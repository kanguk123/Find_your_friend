"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Quaternion, Vector3, Euler } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useKey } from "@/hooks/useKey";
import { useStore } from "@/state/useStore";
import { PLANETS } from "@/data/solar";

const WORLD_UP = new Vector3(0, 1, 0);

/* 이동/조종 파라미터 (불꽃 제거됨) */
const THRUST_ACCEL = 1.6;
const MAX_FWD = 3.2;
const MAX_REV = 2.0;
const DRAG_K = 0.8;

const BOOST_ACCEL = 5.0;
const BOOST_MAX = 2.0;

const PITCH_RATE = 1.6;
const YAW_RATE = 1.8;
const ROLL_RATE = 1.8;
const BANK_GAIN = 0.7;
const BANK_RETURN = 3.0;

/* 카메라 추적 */
const TPV_HEIGHT = 0.06;
const TPV_LOOK_AHEAD = 0.22;
const TPV_SMOOTH = 0.22;

/* 로켓 치수(간단 메시) */
const BODY_R = 0.006;
const BODY_H = 0.085;
const NOSE_H = 0.022;

/* 시작 고도/정렬 */
const START_ALT = 0.015;
const visualRotation: [number, number, number] = [-Math.PI / 2, 0, 0];

export default function Rocket() {
  const physRef = useRef<Group>(null!);
  const { camera } = useThree();

  const bodyPositions = useStore((s) => s.bodyPositions);
  const requestReset = useStore((s) => s.requestReset);
  const setRocketAlive = useStore((s) => s.setRocketAlive);
  const rocketAlive = useStore((s) => s.rocketAlive);
  const followRocket = useStore((s) => s.followRocket);
  const setFollowRocket = useStore((s) => s.setFollowRocket);
  const setFlyToTarget = useStore((s) => s.setFlyToTarget);

  const key = useKey();
  const euler = useMemo(() => new Euler(0, 0, 0, "YXZ"), []);
  const vel = useRef(0);
  const followDist = useRef(0.28);
  const boosting = useRef(false);

  const [spawned, setSpawned] = useState(false);
  const [visible, setVisible] = useState(false);

  function spawnAtEarth() {
    const g = physRef.current;
    const earthPos = bodyPositions["earth"];
    if (!g || !earthPos) {
      setVisible(false);
      setSpawned(false);
      return false;
    }

    const r = new Vector3(earthPos[0], earthPos[1], earthPos[2]);
    const n = r.clone().normalize();
    const earthR = PLANETS.find((p) => p.id === "earth")?.radius ?? 0.13;

    g.position.copy(
      r.clone().add(n.clone().multiplyScalar(earthR + START_ALT))
    );

    const tangent = new Vector3().crossVectors(WORLD_UP, r).normalize();
    const axis = new Vector3().crossVectors(WORLD_UP, tangent).normalize();
    const forward = tangent.clone().applyAxisAngle(axis, -Math.PI * 0.06);

    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, -1),
      forward
    );
    euler.setFromQuaternion(q, "YXZ");

    vel.current = 0;
    followDist.current = 0.28;
    setRocketAlive(true);
    setVisible(true);
    setSpawned(true);
    setFollowRocket(true); // 스폰 시 로켓 추적
    setFlyToTarget(undefined); // flyTo 잔여 제거
    return true;
  }

  useEffect(() => {
    if (!spawned) spawnAtEarth(); /* eslint-disable-next-line */
  }, [bodyPositions, spawned]);
  useEffect(() => {
    setSpawned(false);
  }, [requestReset]);
  useEffect(() => {
    if (!followRocket) vel.current = 0;
  }, [followRocket]);

  function updateInputs(dt: number) {
    let thrust = 0;
    let anyInput = false;

    if (key.down("KeyW")) {
      thrust += THRUST_ACCEL;
      anyInput = true;
    }
    if (key.down("KeyS")) {
      thrust -= THRUST_ACCEL;
      anyInput = true;
    }

    boosting.current = key.down("Space") && (thrust >= 0 || vel.current >= 0);
    anyInput = anyInput || key.down("Space");

    if (key.down("ArrowUp")) {
      euler.x += PITCH_RATE * dt;
      anyInput = true;
    }
    if (key.down("ArrowDown")) {
      euler.x -= PITCH_RATE * dt;
      anyInput = true;
    }

    const yawIn = (key.down("KeyA") ? -1 : 0) + (key.down("KeyD") ? 1 : 0);
    if (yawIn !== 0) {
      euler.y -= yawIn * YAW_RATE * dt;
      anyInput = true;
    }

    const rollIn = (key.down("KeyQ") ? -1 : 0) + (key.down("KeyE") ? 1 : 0);
    if (rollIn !== 0) {
      euler.z += rollIn * ROLL_RATE * dt;
      anyInput = true;
    } else {
      const targetBank = yawIn * BANK_GAIN;
      euler.z += (targetBank - euler.z) * BANK_RETURN * dt;
    }

    const LIM = Math.PI / 2 - 0.01;
    euler.x = Math.max(-LIM, Math.min(LIM, euler.x));

    vel.current =
      Math.sign(vel.current) *
      Math.max(0, Math.abs(vel.current) - DRAG_K * Math.abs(vel.current) * dt);
    vel.current += thrust * dt;
    if (boosting.current) vel.current += BOOST_ACCEL * dt;

    const vmaxF = MAX_FWD + (boosting.current ? BOOST_MAX : 0);
    vel.current = Math.min(vmaxF, Math.max(-MAX_REV, vel.current));

    // 🔻 입력이 들어오면 즉시 로켓 추적 모드로 복귀
    if (anyInput && !followRocket) {
      setFollowRocket(true);
      setFlyToTarget(undefined);
    }
  }

  function updateKinematics(dt: number) {
    const g = physRef.current;
    if (!g) return;

    g.quaternion.setFromEuler(euler);

    const fwd = new Vector3(0, 0, -1).applyQuaternion(g.quaternion);
    g.position.addScaledVector(fwd, vel.current * dt);

    // 추적 모드일 때만 카메라 갱신
    if (followRocket) {
      const back = fwd.clone().multiplyScalar(-followDist.current);
      const lift = WORLD_UP.clone().multiplyScalar(TPV_HEIGHT);
      const camPos = g.position.clone().add(back).add(lift);

      camera.position.lerp(camPos, TPV_SMOOTH);
      camera.lookAt(
        g.position.clone().add(fwd.clone().multiplyScalar(TPV_LOOK_AHEAD))
      );
    }
  }

  useFrame((_, dt) => {
    if (!rocketAlive || !spawned || !visible) return;

    // 자유시점(행성 보기/드래그)일 때는 정지 + 입력 감지만
    if (!followRocket) {
      vel.current = 0;
      // 입력을 누르면 바로 추적으로 전환
      if (
        key.down("KeyW") ||
        key.down("KeyA") ||
        key.down("KeyS") ||
        key.down("KeyD") ||
        key.down("ArrowUp") ||
        key.down("ArrowDown") ||
        key.down("ArrowLeft") ||
        key.down("ArrowRight") ||
        key.down("KeyQ") ||
        key.down("KeyE") ||
        key.down("Space")
      ) {
        setFollowRocket(true);
        setFlyToTarget(undefined);
      }
      return;
    }

    updateInputs(dt);
    updateKinematics(dt);
  });

  return (
    <>
      {/* 드래그 시작하면 자유시점 유지 */}
      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={0.1}
        maxDistance={500}
        onStart={() => setFollowRocket(false)}
      />

      <group ref={physRef} visible={visible}>
        <hemisphereLight intensity={0.12} />
        <group rotation={visualRotation}>
          {/* 몸통 */}
          <mesh position={[0, (BODY_H - NOSE_H) * 0.5, 0]}>
            <cylinderGeometry args={[BODY_R, BODY_R, BODY_H, 24]} />
            <meshStandardMaterial
              color="#e9eef2"
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          {/* 노즈 */}
          <mesh position={[0, BODY_H - NOSE_H * 0.5, 0]}>
            <coneGeometry args={[BODY_R * 0.93, NOSE_H, 24]} />
            <meshStandardMaterial
              color="#f3f6f8"
              roughness={0.28}
              metalness={0.15}
            />
          </mesh>
          {/* 인터스테이지(띠) */}
          <mesh position={[0, BODY_H * 0.42, 0]}>
            <cylinderGeometry
              args={[BODY_R * 1.02, BODY_R * 1.02, BODY_R * 0.22, 24]}
            />
            <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </>
  );
}
