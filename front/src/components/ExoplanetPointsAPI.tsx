"use client";

import React, { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { useStore } from "../state/useStore";
import { ApiService, PlanetData } from "../services/api";

// 지구 렌더링 크기 상수 (행성 반지름으로 사용)
const EARTH_RENDER_SIZE = 0.13 * 0.62;

/** 화면(세로/가로) FOV를 모두 고려해, 반지름 r인 구가 프레임에 충분히 들어오도록 하는 최소 거리 계산 */
function distanceToFitSphere({
  radius,
  fovDeg,
  aspect,
  fitRatio = 0.6, // 화면 높이(또는 너비) 대비 구가 차지할 비율 (0~1)
  padding = 1.15, // 살짝 여유
}: {
  radius: number;
  fovDeg: number;
  aspect: number;
  fitRatio?: number;
  padding?: number;
}) {
  // 세로 FOV
  const vFov = MathUtils.degToRad(fovDeg);
  const vDist = (radius * 2 * padding) / (2 * Math.tan(vFov / 2)) / fitRatio;

  // 가로 FOV = 2 * atan(tan(vFov/2) * aspect)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const hDist = (radius * 2 * padding) / (2 * Math.tan(hFov / 2)) / fitRatio;

  return Math.max(vDist, hDist);
}

export default function ExoplanetPointsAPI() {
  const { camera, viewport } = useThree(); // <- 카메라와 화면 비율 사용
  const [planets, setPlanets] = useState<PlanetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    selectedId,
    setSelectedId,
    setFlyToTarget,
    setBodyPositions,
    bodyPositions,
    mode,
    setShowPlanetCard,
    setSelectedPlanetData,
  } = useStore();

  // 백엔드에서 행성 데이터 로드
  useEffect(() => {
    const loadPlanets = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getPlanets();

        if (response.success) {
          setPlanets(response.data);

          const positions: Record<string, [number, number, number]> = {};
          response.data.forEach((planet) => {
            positions[`exo-${planet.id}`] = [
              planet.coordinates_3d.x,
              planet.coordinates_3d.y,
              planet.coordinates_3d.z,
            ];
          });
          setBodyPositions(positions);

          console.log(`로드된 행성 수: ${response.data.length}`);
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        console.error("행성 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };

    loadPlanets();
  }, [setBodyPositions]);

  // 행성 클릭 핸들러
  const handlePlanetClick = (planetId: number, planet: PlanetData) => {
    console.log("행성 클릭:", planetId, planet.disposition);

    const exoId = `exo-${planetId}`;
    const isAlreadySelected = selectedId === exoId;

    setSelectedId(exoId);
    setSelectedPlanetData(planet);
    setShowPlanetCard(true);

    // bodyPositions 보강
    setBodyPositions({
      ...bodyPositions,
      [exoId]: [
        planet.coordinates_3d.x,
        planet.coordinates_3d.y,
        planet.coordinates_3d.z,
      ],
    });

    // 이미 선택된 행성을 다시 클릭한 경우에만 카메라 이동
    if (isAlreadySelected) {
      const { setIsCameraMoving } = useStore.getState();
      setIsCameraMoving(true);

      // 행성 위치 벡터
      const planetPos = new Vector3(
        planet.coordinates_3d.x,
        planet.coordinates_3d.y,
        planet.coordinates_3d.z
      );

      // ====== 카메라 거리 계산 (세로/가로 FOV 모두 고려) ======
      const radius = EARTH_RENDER_SIZE;
      const aspect = viewport.aspect || (camera as any).aspect || 1;
      const fovDeg = (camera as any).fov ?? 55;

      const minDistance = distanceToFitSphere({
        radius,
        fovDeg,
        aspect,
        fitRatio: 0.6, // 구가 화면의 60% 정도 차지
        padding: 1.15, // 살짝 여유
      });

      // ====== 카메라 접근 방향: 현재 카메라 위치 기준으로 행성을 바라보는 방향 유지 ======
      const camPos = new Vector3().copy(camera.position);
      // 카메라에서 행성을 향하는 방향
      const toPlanet = new Vector3().subVectors(planetPos, camPos);

      if (toPlanet.length() < 1e-4) {
        // 거의 같은 지점이면 임의의 안정적 방향에서 행성 관찰
        toPlanet.set(1, 0.25, 1);
      }
      toPlanet.normalize();

      // 카메라를 행성 뒤쪽(행성에서 toPlanet의 반대방향)에 배치
      const dir = toPlanet.clone().negate(); // 행성에서 카메라 방향 (행성->카메라)

      // 목표 카메라 위치 = 행성 중심 + (행성에서 카메라 방향) * (필요 최소 거리)
      const targetCamPos = new Vector3()
        .copy(planetPos)
        .addScaledVector(dir, minDistance);

      // 디버그 로그
      console.log(
        "Flying to exoplanet:",
        planetId,
        "planet position:",
        planetPos.toArray(),
        "camera position:",
        targetCamPos.toArray(),
        "required distance:",
        minDistance.toFixed(2)
      );

      // ====== 이동 지시 ======
      if (mode === "player") {
        const {
          setRocketCameraMode,
          setRocketCameraTarget,
          setIsCameraMoving,
        } = useStore.getState();
        setRocketCameraMode("planet_view");
        setRocketCameraTarget(exoId);
        setIsCameraMoving(true);
        setFlyToTarget(targetCamPos.toArray() as [number, number, number]);
      } else {
        const { setIsCameraMoving } = useStore.getState();
        setIsCameraMoving(true);
        setFlyToTarget(targetCamPos.toArray() as [number, number, number]);
      }
    }
  };

  if (loading) {
    return (
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }

  if (planets.length === 0) return null;

  return (
    <group>
      {planets.map((planet) => {
        let color = "#ff0000";
        if (planet.disposition === "CONFIRMED") color = "#00ff00";
        else if (planet.disposition === "CANDIDATE") color = "#ffff00";
        else if (planet.disposition === "FALSE POSITIVE") color = "#ff0000";

        const isSelected = selectedId === `exo-${planet.id}`;
        const size = EARTH_RENDER_SIZE;

        return (
          <group key={planet.id}>
            <mesh
              position={[
                planet.coordinates_3d.x,
                planet.coordinates_3d.y,
                planet.coordinates_3d.z,
              ]}
              onClick={(e) => {
                e.stopPropagation();
                handlePlanetClick(planet.id, planet);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.8 : 0.3}
                roughness={0.6}
                metalness={0.2}
                transparent
                opacity={isSelected ? 1.0 : 0.85}
              />
            </mesh>

            {isSelected && (
              <mesh
                position={[
                  planet.coordinates_3d.x,
                  planet.coordinates_3d.y,
                  planet.coordinates_3d.z,
                ]}
              >
                <sphereGeometry args={[size * 1.5, 16, 16]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.2}
                  side={2}
                />
              </mesh>
            )}

            {isSelected && (
              <mesh
                position={[
                  planet.coordinates_3d.x,
                  planet.coordinates_3d.y,
                  planet.coordinates_3d.z,
                ]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[size * 2, size * 2.5, 32]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.6}
                  side={2}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
