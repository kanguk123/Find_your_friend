// src/components/Rocket.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Quaternion, Vector3, Euler } from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls as OrbitControlsCmp } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useKey } from "@/hooks/useKey";
import { useStore } from "@/state/useStore";
import { PLANETS } from "@/data/solar";
import dynamic from "next/dynamic";

// 🚀 Rocket components (클라이언트 전용)
const RocketModel = dynamic(() => import("./RocketModel"), { ssr: false });
const RocketFlame = dynamic(() => import("./RocketFlame"), { ssr: false });

/* ===== 공용 타입 유틸 ===== */
type Vec3 = [number, number, number];
type FlyTo =
  | undefined
  | string // 행성 id로 저장하는 경우
  | Vec3 // 좌표로 저장하는 경우
  | { id: string }; // 객체로 저장하는 경우(이전 버전 호환)

/* ===== 파라미터 ===== */
const WORLD_UP = new Vector3(0, 1, 0);

const THRUST_ACCEL = 1.6;
const MAX_FWD = 3.2;
const MAX_REV = 2.0;
const DRAG_K = 0.8;

const BOOST_ACCEL = 5.0;
const BOOST_MAX = 2.0;

const PITCH_RATE = 1.6;
const YAW_RATE = 1.8;
const ROLL_RATE = 1.8;

const TPV_LOOK_AHEAD = 0.22;
const TARGET_LERP = 0.2;

const START_ALT = 0.015;
const visualRotation: [number, number, number] = [-Math.PI / 2, 0, 0];

export default function Rocket() {
  const physRef = useRef<Group>(null!);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const bodyPositions = useStore(
    (s) => s.bodyPositions as Record<string, Vec3>
  );
  const requestReset = useStore((s) => s.requestReset);
  const setRocketAlive = useStore((s) => s.setRocketAlive);
  const rocketAlive = useStore((s) => s.rocketAlive);

  const followRocket = useStore((s) => s.followRocket);
  const setFollowRocket = useStore((s) => s.setFollowRocket);

  const flyToTargetRaw = useStore((s) => s.flyToTarget) as FlyTo;
  const setFlyToTarget = useStore((s) => s.setFlyToTarget);
  const setIsCameraMoving = useStore((s) => s.setIsCameraMoving);

  // 로켓 카메라 상태
  const rocketCameraMode = useStore((s) => s.rocketCameraMode);
  const setRocketCameraMode = useStore((s) => s.setRocketCameraMode);
  const rocketCameraTarget = useStore((s) => s.rocketCameraTarget);
  const setRocketCameraTarget = useStore((s) => s.setRocketCameraTarget);

  const key = useKey();
  const euler = useMemo(() => new Euler(0, 0, 0, "YXZ"), []);
  const vel = useRef(0);
  const boosting = useRef(false);
  const flameIntensity = useRef(0); // Use ref to avoid re-renders

  const [spawned, setSpawned] = useState(false);
  const [visible, setVisible] = useState(false);

  /* ===== 유틸: flyToTarget을 좌표(Vec3)로 해석 ===== */
  function resolveFlyToVec3(fly: FlyTo): Vec3 | undefined {
    if (!fly) return undefined;

    // 1) string: 행성 id → bodyPositions에서 좌표 찾기
    if (typeof fly === "string") return bodyPositions[fly];

    // 2) Vec3: 그대로 사용
    if (Array.isArray(fly) && fly.length === 3) return fly as Vec3;

    // 3) {id:string} 객체 호환
    if (typeof fly === "object" && "id" in fly && typeof fly.id === "string") {
      return bodyPositions[fly.id];
    }
    return undefined;
  }

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

    // 지구 표면에서 살짝 띄워 스폰
    g.position.copy(
      r.clone().add(n.clone().multiplyScalar(earthR + START_ALT))
    );

    // 공전 접선 방향을 전방으로
    const tangent = new Vector3().crossVectors(WORLD_UP, r).normalize();
    const axis = new Vector3().crossVectors(WORLD_UP, tangent).normalize();
    const forward = tangent.clone().applyAxisAngle(axis, -Math.PI * 0.06);

    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, -1),
      forward
    );
    euler.setFromQuaternion(q, "YXZ");

    vel.current = 0;
    setRocketAlive(true);
    setVisible(true);
    setSpawned(true);

    // 시작은 로켓 추적
    setFlyToTarget(undefined);
    setFollowRocket(true);
    return true;
  }

  useEffect(() => {
    if (!spawned) spawnAtEarth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyPositions, spawned]);

  useEffect(() => {
    setSpawned(false);
  }, [requestReset]);

  useEffect(() => {
    if (!followRocket) vel.current = 0;
  }, [followRocket]);

  // ✅ 행성 포커스가 설정되면 그 프레임부터 로켓 추적을 반드시 끈다
  useEffect(() => {
    if (flyToTargetRaw && followRocket) setFollowRocket(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToTargetRaw]);

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

    // 스페이스바: 로켓 시점으로 돌아가기
    if (key.down("Space")) {
      if (rocketCameraMode === "planet_view") {
        // 행성 뷰 모드에서 스페이스바: 로켓 시점으로 돌아가기
        setRocketCameraMode("follow");
        setRocketCameraTarget(undefined);
        setFlyToTarget(undefined);
        setFollowRocket(true);
        setIsCameraMoving(false);
        console.log("로켓 시점으로 돌아갑니다");
        anyInput = true;
      }
    }

    // Shift 키: 부스트 + 화염 효과
    if (key.down("ShiftLeft") || key.down("ShiftRight")) {
      boosting.current = thrust >= 0 || vel.current >= 0;
      anyInput = true;
    } else {
      boosting.current = false;
    }

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

    // ✅ 입력 들어오면: 행성 포커스 해제 + 로켓 추적 복귀
    if (anyInput && !followRocket) {
      setFlyToTarget(undefined);
      setFollowRocket(true);
    }
  }

  function updateKinematics(dt: number) {
    const g = physRef.current;
    if (!g) return;

    // 로켓 자세/위치
    g.quaternion.setFromEuler(euler);
    const fwd = new Vector3(0, 0, -1).applyQuaternion(g.quaternion);
    g.position.addScaledVector(fwd, vel.current * dt);

    // 카메라 타겟만 관리 (카메라 위치/각도는 OrbitControls가 전담)
    const controls = controlsRef.current;
    if (!controls) return;

    if (rocketCameraMode === "follow" && followRocket) {
      // 로켓 추적 모드
      const lookPoint = g.position
        .clone()
        .add(fwd.clone().multiplyScalar(TPV_LOOK_AHEAD));
      controls.target.lerp(lookPoint, TARGET_LERP);
    } else if (rocketCameraMode === "planet_view" && rocketCameraTarget) {
      // 행성 뷰 모드 - 로켓 위치에서 행성을 바라봄
      const planetPos = bodyPositions[rocketCameraTarget];
      if (planetPos) {
        const planetVector = new Vector3(
          planetPos[0],
          planetPos[1],
          planetPos[2]
        );
        controls.target.lerp(planetVector, TARGET_LERP);
      }
    } else if (!followRocket && flyToTargetRaw) {
      // 기존 행성 포커스 모드
      const v = resolveFlyToVec3(flyToTargetRaw);
      if (v) {
        const planetPos = new Vector3(v[0], v[1], v[2]);
        controls.target.lerp(planetPos, TARGET_LERP);
      }
    }
  }

  useFrame((_, dt) => {
    if (!rocketAlive || !spawned || !visible) {
      flameIntensity.current = 0;
      return;
    }

    // 행성 뷰 모드에서는 로켓 움직임을 멈추고 카메라만 타겟을 따라간다
    if (rocketCameraMode === "planet_view") {
      vel.current = 0;
      flameIntensity.current = 0;
      updateKinematics(dt);
      return;
    }

    // 기존 행성 포커스 모드
    if (!followRocket && flyToTargetRaw) {
      vel.current = 0;
      flameIntensity.current = 0;
      updateKinematics(dt);
      return;
    }

    // 로켓 추적 모드
    updateInputs(dt);
    updateKinematics(dt);

    // Update flame intensity based on boost state
    // Only show flame when Shift is pressed
    flameIntensity.current = boosting.current ? 1.0 : 0.0;
  });

  return (
    <>
      <OrbitControlsCmp
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minPolarAngle={0.001}
        maxPolarAngle={Math.PI - 0.001}
        minDistance={0.12}
        maxDistance={1.6}
      />

      <group ref={physRef} visible={visible}>
        {/* 로켓 주변 조명 - 로켓과 함께 움직임 */}
        <pointLight position={[0, 0, 0]} intensity={2.5} distance={3} decay={2} color="#ffffff" />
        <pointLight position={[0.3, 0, 0]} intensity={1.2} distance={2} decay={2} color="#ffffff" />
        <pointLight position={[-0.3, 0, 0]} intensity={1.2} distance={2} decay={2} color="#ffffff" />
        <hemisphereLight intensity={0.3} />

        <group rotation={visualRotation}>
          <RocketModel scaleToMeters={0.2} rotation={[0, Math.PI / 6, 0]} />
        </group>
        {/* Rocket flame - positioned at the back of the rocket, aligned with rocket direction */}
        {visible && (
          <RocketFlame
            intensity={flameIntensity.current}
            position={[0, 0, 0.05]}
          />
        )}
      </group>
    </>
  );
}
