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
  const [cameraDistance, setCameraDistance] = useState(0);

  const {
    selectedId,
    setSelectedId,
    setFlyToTarget,
    setBodyPositions,
    bodyPositions,
    mode,
    setShowPlanetCard,
    setSelectedPlanetData,
    threshold,
    rocketPosition,
  } = useStore();

  // 카메라 거리 추적
  useEffect(() => {
    const updateDistance = () => {
      const distance = camera.position.length();
      setCameraDistance(distance);
    };

    const interval = setInterval(updateDistance, 100);
    return () => clearInterval(interval);
  }, [camera]);

  // 백엔드에서 행성 데이터 로드
  useEffect(() => {
    const loadPlanets = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getPlanets(1, 500);

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

    // Player 모드에서는 카메라 이동 없이 정보만 표시
    if (mode === "player") {
      console.log("Player 모드: 카메라 이동 없이 정보만 표시");
      return;
    }

    // Expert 모드에서만 카메라 이동
    const { setIsCameraMoving } = useStore.getState();
    setIsCameraMoving(true);

    // 행성 위치 벡터
    const planetPos = new Vector3(
      planet.coordinates_3d.x,
      planet.coordinates_3d.y,
      planet.coordinates_3d.z
    );

    // ====== 카메라 거리 계산 ======
    // 원점(태양)으로부터 행성까지의 거리
    const distanceFromOrigin = planetPos.length();

    // 카메라 거리: 원점에서 행성까지 거리의 최소 30% 이상
    const minDistance = Math.max(distanceFromOrigin * 0.3, EARTH_RENDER_SIZE * 10);

    // ====== 카메라 방향: 원점에서 행성을 향하는 방향 ======
    const directionToPlaneт = planetPos.clone().normalize();

    // 목표 카메라 위치 = 행성 위치 + (원점->행성 방향) * 거리
    // 이렇게 하면 원점-행성-카메라가 일직선상에 놓여 행성이 화면 중앙에 위치
    const targetCamPos = new Vector3()
      .copy(planetPos)
      .addScaledVector(directionToPlaneт, minDistance);

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

    // Expert 모드에서만 카메라 이동
    setIsCameraMoving(true);
    setFlyToTarget(targetCamPos.toArray() as [number, number, number]);
  };

  // 로딩 중이거나 에러가 있거나 데이터가 없으면 렌더링하지 않음
  if (loading || error || planets.length === 0) {
    return null;
  }

  return (
    <group>
      {planets.map((planet) => {
        // Score filter 적용
        const aiProbability = planet.ai_probability ?? 0;
        const thresholdValue = threshold / 100;
        if (aiProbability < thresholdValue) {
          return null;
        }

        // 행성 위치
        const planetPos = new Vector3(
          planet.coordinates_3d.x,
          planet.coordinates_3d.y,
          planet.coordinates_3d.z
        );

        // 거리별 렌더링
        if (mode === "player") {
          // Player 모드: 로켓 중심으로 일정 거리 내 행성만 렌더링
          const rocketPos = new Vector3(rocketPosition[0], rocketPosition[1], rocketPosition[2]);
          const distanceFromRocket = rocketPos.distanceTo(planetPos);
          const renderRadius = 50; // 로켓 주변 50 단위 내 행성만 표시

          if (distanceFromRocket > renderRadius) {
            return null;
          }
        } else {
          // Expert 모드: 카메라 거리 기준 렌더링
          const distanceToPlanet = camera.position.distanceTo(planetPos);
          const minRenderDistance = cameraDistance * 0.1;
          const maxRenderDistance = cameraDistance * 3;

          if (distanceToPlanet < minRenderDistance || distanceToPlanet > maxRenderDistance) {
            return null;
          }
        }

        // AI probability에 따른 히트맵 색상 (낮음: 노란색 -> 중간: 초록색 -> 높음: 빨간색)
        let r, g, b;
        if (aiProbability < 0.5) {
          // 0-0.5: 노란색 -> 초록색
          r = Math.floor(255 * (1 - aiProbability * 2));
          g = 255;
          b = 0;
        } else {
          // 0.5-1: 초록색 -> 빨간색
          r = Math.floor(255 * (aiProbability - 0.5) * 2);
          g = Math.floor(255 * (1 - (aiProbability - 0.5) * 2));
          b = 0;
        }
        const color = `rgb(${r}, ${g}, ${b})`;

        const isSelected = selectedId === `exo-${planet.id}`;
        const size = EARTH_RENDER_SIZE * 4; // 외계 행성 크기 4배

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
                  color="white"
                  transparent
                  opacity={0.3}
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
                  color="white"
                  transparent
                  opacity={0.8}
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
