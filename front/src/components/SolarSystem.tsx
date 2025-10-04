"use client";

import { useMemo, useRef } from "react";
import { Group, Vector3, AdditiveBlending } from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useStore } from "@/state/useStore";
import { useSolarTextures } from "@/hooks/useSolarTextures";
import {
  SUN,
  PLANETS,
  ORBIT_SCALE,
  FLY_DISTANCE_FACTOR,
  type Body,
} from "@/data/solar";
import { SolarPlanetClickHandler } from "@/utils/PlanetClickHandler";

const TAU = Math.PI * 2;

// ===== 렌더 스케일 정책 =====
const GLOBAL_PLANET_SCALE = 0.62;
function renderRadius(body: Body) {
  return body.id === "sun" ? body.radius : body.radius * GLOBAL_PLANET_SCALE;
}

function PlanetMesh({
  body,
  texUrl,
  isCameraMovingToThis,
}: {
  body: Body;
  texUrl?: string;
  isCameraMovingToThis?: boolean;
}) {
  const textures = useSolarTextures();
  const tex = texUrl ? textures.get(texUrl) : undefined;
  const hasTex = !!tex;
  const clickHandler = new SolarPlanetClickHandler();

  // 행성을 Planet 타입으로 변환
  const planet = {
    id: body.id,
    name: body.name,
    score: body.score,
    features: {
      mass: body.radius * 10,
      radius: body.radius,
      orbital_period: body.periodDays,
      stellar_flux: 1.0 / (body.orbitRadius || 1) ** 2,
    },
  };

  const visualState = clickHandler.getVisualState(planet);

  return (
    <mesh renderOrder={visualState.renderOrder}>
      <sphereGeometry args={[renderRadius(body), 64, 64]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={visualState.isSelected && tex ? tex : undefined}
        color={
          visualState.isOtherSelected
            ? "#666666"
            : hasTex
            ? "#ffffff"
            : body.color
        }
        roughness={0.9}
        metalness={0}
        emissive={
          visualState.isOtherSelected
            ? "#000000"
            : hasTex
            ? "#000000"
            : body.color
        }
        emissiveIntensity={
          visualState.isSelected && isCameraMovingToThis
            ? hasTex
              ? 1.2
              : 2.0
            : visualState.isSelected
            ? hasTex
              ? 0.5
              : 1.0
            : visualState.isOtherSelected
            ? 0.0
            : hasTex
            ? 0.0
            : 0.08
        }
        depthTest={true}
        depthWrite={!visualState.isOtherSelected}
        transparent={!!visualState.isOtherSelected}
        opacity={visualState.opacity}
      />
    </mesh>
  );
}

function SaturnRing({ body }: { body: Body }) {
  // ⛔️ 훅 조건부 호출 방지: 항상 최상단
  const textures = useSolarTextures();
  if (!body.ring) return null;

  const tex = body.ring.texture ? textures.get(body.ring.texture) : undefined;
  const r = renderRadius(body);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * body.ring.inner, r * body.ring.outer, 96]} />
      <meshBasicMaterial
        map={tex}
        transparent
        alphaTest={0.3}
        premultipliedAlpha
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
}

function SunCore() {
  const textures = useSolarTextures();
  const sunTex = SUN.texture ? textures.get(SUN.texture) : undefined;
  const { setSelectedId, setFlyToTarget, setFollowRocket, selectedId } =
    useStore();

  // 행성이 선택되었고, 태양이 아닌 경우 태양을 반투명하게
  const isSunTransparent = !!(selectedId && selectedId !== SUN.id);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();

        const clickHandler = new SolarPlanetClickHandler();
        const planet = {
          id: SUN.id,
          name: SUN.name,
          score: SUN.score,
          features: {
            mass: SUN.radius * 10,
            radius: SUN.radius,
            orbital_period: undefined,
            stellar_flux: 1.0,
          },
        };

        const currentSelectedId = useStore.getState().selectedId;
        if (currentSelectedId !== planet.id) {
          clickHandler.handleClick(planet);
          return;
        }

        if (useStore.getState().isCameraMoving) {
          return;
        }

        useStore.getState().setIsCameraMoving(true);
        // 태양은 중심에 있으므로 적당한 거리에서 보기
        setFlyToTarget([0, 0, 4]);
        setFollowRocket(false);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
      }}
    >
      <mesh renderOrder={isSunTransparent ? -1 : 0}>
        <sphereGeometry args={[renderRadius(SUN), 64, 64]} />
        <meshBasicMaterial
          map={sunTex}
          color={sunTex ? "#ffffff" : SUN.color}
          toneMapped={false}
          transparent={true}
          opacity={isSunTransparent ? 0.25 : 1.0}
          depthWrite={!isSunTransparent}
          depthTest={true}
        />
      </mesh>

      <pointLight intensity={4} distance={3000} decay={2} />
    </group>
  );
}

export default function SolarSystem({
  timeScale = 60,
}: {
  timeScale?: number;
}) {
  const planetRefs = useRef<Record<string, Group>>({});
  const {
    threshold,
    selectedId,
    setSelectedId,
    setFlyToTarget,
    setBodyPositions,
    setFollowRocket,
    isCameraMoving,
    setIsCameraMoving,
    flyToTarget,
    mode,
    rocketPosition,
  } = useStore();

  const cut = threshold / 100;

  // 행성 리스트는 고정
  const planets = useMemo(() => PLANETS, []);

  // 궤도선 정점 캐시
  const orbitPoints = useMemo(() => {
    const seg = 128;
    const map: Record<string, Vector3[]> = {};
    for (const p of planets) {
      const r = (p.orbitRadius ?? 0) * ORBIT_SCALE;
      const pts: Vector3[] = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * TAU;
        pts.push(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      map[p.id] = pts;
    }
    return map;
  }, [planets]);

  // 공전/자전 업데이트 + 위치 공유
  useFrame(() => {
    const now = Date.now();
    const pos: Record<string, [number, number, number]> = {};

    // 태양 위치 추가 (중심에 고정)
    pos[SUN.id] = [0, 0, 0];

    for (const p of planets) {
      const g = planetRefs.current[p.id];
      if (!g || !p.orbitRadius || !p.periodDays) continue;

      const seconds = now / 1000;
      const omega =
        timeScale === 0 ? 0 : TAU / ((p.periodDays * 86400) / timeScale);
      const a = omega * seconds;
      const r = p.orbitRadius * ORBIT_SCALE;

      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      g.position.set(x, 0, z);
      g.rotation.y = -a;

      pos[p.id] = [x, 0, z];
    }
    setBodyPositions(pos);
  });

  return (
    <group>
      {/* 태양 */}
      <SunCore />

      {/* 선택된 행성으로 카메라 이동 시 추가 조명 */}
      {selectedId &&
        selectedId !== SUN.id &&
        planetRefs.current[selectedId] &&
        (isCameraMoving || flyToTarget) && (
          <>
            {/* 메인 포인트 라이트 - 행성 위치에서 */}
            <pointLight
              position={planetRefs.current[selectedId].position}
              intensity={8}
              distance={12}
              decay={0.5}
              color="#ffffff"
            />
            {/* 보조 포인트 라이트 - 행성에서 약간 떨어진 위치 */}
            <pointLight
              position={[
                planetRefs.current[selectedId].position.x + 2,
                planetRefs.current[selectedId].position.y + 1,
                planetRefs.current[selectedId].position.z + 2,
              ]}
              intensity={4}
              distance={10}
              decay={0.8}
              color="#ffffff"
            />
            {/* 방향성 조명 - 태양 반대편에서 */}
            <directionalLight
              position={[
                planetRefs.current[selectedId].position.x - 5,
                planetRefs.current[selectedId].position.y + 3,
                planetRefs.current[selectedId].position.z - 5,
              ]}
              intensity={2}
              color="#ffffff"
              target={planetRefs.current[selectedId]}
            />
          </>
        )}

      {/* 궤도선 */}
      {planets.map((p) => (
        <Line
          key={`${p.id}-orbit`}
          points={orbitPoints[p.id]}
          color="#7a7f87"
          lineWidth={1}
          transparent
          opacity={p.score !== undefined && p.score < cut ? 0.1 : 0.45}
        />
      ))}

      {/* 행성들(항상 마운트) */}
      {planets.map((p) => (
        <group
          key={p.id}
          ref={(el) => {
            if (el) planetRefs.current[p.id] = el;
          }}
          visible={p.score === undefined ? true : p.score >= cut}
          onClick={(e) => {
            e.stopPropagation();

            // 행성을 Planet 타입으로 변환
            const planet = {
              id: p.id,
              name: p.name,
              score: p.score,
              features: {
                mass: p.radius * 10,
                radius: p.radius,
                orbital_period: p.periodDays,
                stellar_flux: 1.0 / (p.orbitRadius || 1) ** 2,
              },
            };

            const clickHandler = new SolarPlanetClickHandler();

            // 첫 번째 클릭: 행성 선택 (하이라이트)
            const currentSelectedId = useStore.getState().selectedId;
            console.log(
              "SolarSystem click - currentSelectedId:",
              currentSelectedId,
              "planet.id:",
              planet.id
            );

            if (currentSelectedId !== planet.id) {
              console.log("SolarSystem - First click: selecting planet only");
              clickHandler.handleClick(planet);
              return; // 첫 번째 클릭에서는 카메라 이동 없이 종료
            }

            // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
            console.log("SolarSystem - Second click: camera movement");
            if (isCameraMoving) {
              console.log("SolarSystem - Camera already moving, ignoring");
              // 이미 카메라가 이동 중이면 무시
              return;
            }

            console.log("SolarSystem - Starting camera movement");
            setIsCameraMoving(true);
            const g = planetRefs.current[p.id];
            if (!g) return;

            // 행성 크기에 따라 카메라 거리 조정
            const planetRadius = renderRadius(p);
            const cameraDistance = planetRadius * 4.5; // 더 멀리

            let camX, camY, camZ;

            // 현재 행성의 실제 3D 위치를 기준으로 카메라 위치 계산
            const planetX = g.position.x;
            const planetY = g.position.y;
            const planetZ = g.position.z;

            console.log("Planet actual position:", [planetX, planetY, planetZ]);

            if (mode === "player") {
              // Player 모드: 로켓의 현재 위치를 기준으로 상대적 카메라 위치 계산
              const [rocketX, rocketY, rocketZ] = rocketPosition;

              console.log("Player mode - Rocket position:", rocketPosition);

              // 로켓에서 행성으로의 방향 벡터 (정규화)
              const dirX = planetX - rocketX;
              const dirY = planetY - rocketY;
              const dirZ = planetZ - rocketZ;
              const len = Math.hypot(dirX, dirY, dirZ) || 1;

              // 행성에서 로켓 방향으로 카메라 배치 (행성을 관찰)
              // 행성 위치를 기준으로 상대적으로 카메라 위치 계산
              camX = planetX - (dirX / len) * cameraDistance;
              camY =
                planetY - (dirY / len) * cameraDistance + cameraDistance * 0.15;
              camZ = planetZ - (dirZ / len) * cameraDistance;

              console.log("Camera target position (relative to planet):", [
                camX,
                camY,
                camZ,
              ]);
            } else {
              // Expert 모드: 태양을 기준으로 상대적 카메라 위치 계산
              const dirX = planetX;
              const dirZ = planetZ;
              const len = Math.hypot(dirX, dirZ) || 1;
              const normalX = dirX / len;
              const normalZ = dirZ / len;

              // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
              // 행성 위치를 기준으로 상대적으로 카메라 위치 계산
              camX = planetX + normalX * cameraDistance;
              camY = planetY + cameraDistance * 0.15;
              camZ = planetZ + normalZ * cameraDistance;

              console.log("Camera target position (relative to planet):", [
                camX,
                camY,
                camZ,
              ]);
            }

            setFlyToTarget([camX, camY, camZ]);

            // 로켓 추적 해제 (카메라가 행성으로 이동)
            setFollowRocket(false);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
          }}
        >
          <PlanetMesh
            body={p}
            texUrl={p.texture}
            isCameraMovingToThis={
              selectedId === p.id && (isCameraMoving || flyToTarget)
            }
          />
          {p.ring && <SaturnRing body={p} />}
        </group>
      ))}
    </group>
  );
}
