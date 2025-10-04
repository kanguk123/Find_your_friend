"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "../state/useStore";
import { ApiService, PlanetData } from "../services/api";

const SURFACE_OFFSET = 0.1;

export default function ExoplanetPointsAPI() {
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

          // bodyPositions에 행성 위치 저장 (외계행성은 "exo-" 접두사 사용)
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

    // 선택된 행성 ID 설정 (외계행성은 "exo-" 접두사 사용)
    setSelectedId(`exo-${planetId}`);

    // PlanetCard 표시를 위한 데이터 설정
    setSelectedPlanetData(planet);
    setShowPlanetCard(true);

    // 행성 위치
    const planetPos: [number, number, number] = [
      planet.coordinates_3d.x,
      planet.coordinates_3d.y,
      planet.coordinates_3d.z,
    ];

    // bodyPositions에 저장 (이미 useEffect에서 저장되어 있어야 하지만, 확실히 하기 위해)
    setBodyPositions({
      ...bodyPositions,
      [`exo-${planetId}`]: planetPos,
    });

    // 행성 위치에서 약간 떨어진 카메라 위치 계산
    const calculateCameraOffset = (
      pos: [number, number, number],
      radius: number
    ): [number, number, number] => {
      // 행성 반지름 기반 거리 계산 (최소 1.5, 최대 5.0)
      const minDistance = 1.5;
      const maxDistance = 5.0;
      const baseDistance = Math.max(
        minDistance,
        Math.min(radius * 2, maxDistance)
      );

      // 행성 위치의 정규화된 방향 벡터 계산 (원점에서 행성으로)
      const length = Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);

      if (length > 0.001) {
        // 행성이 원점에서 멀리 있는 경우: 원점 방향에서 약간 오프셋
        const dirX = pos[0] / length;
        const dirY = pos[1] / length;
        const dirZ = pos[2] / length;

        return [
          pos[0] + dirX * baseDistance * 0.5,
          pos[1] + dirY * baseDistance * 0.5 + baseDistance * 0.3, // 약간 위에서
          pos[2] + dirZ * baseDistance * 0.5 + baseDistance * 0.7, // 약간 뒤에서
        ];
      } else {
        // 행성이 원점 근처에 있는 경우: 단순히 z축 방향으로 오프셋
        return [pos[0], pos[1] + baseDistance * 0.3, pos[2] + baseDistance];
      }
    };

    const cameraPos = calculateCameraOffset(planetPos, planet.r);

    console.log(
      "Flying to exoplanet:",
      planetId,
      "planet position:",
      planetPos,
      "camera position:",
      cameraPos,
      "distance from planet:",
      Math.sqrt(
        (cameraPos[0] - planetPos[0]) ** 2 +
          (cameraPos[1] - planetPos[1]) ** 2 +
          (cameraPos[2] - planetPos[2]) ** 2
      ).toFixed(2)
    );

    if (mode === "player") {
      // Player 모드: 로켓 카메라 모드로 전환
      const { setRocketCameraMode, setRocketCameraTarget, setIsCameraMoving } =
        useStore.getState();
      setRocketCameraMode("planet_view");
      setRocketCameraTarget(`exo-${planetId}`);
      setIsCameraMoving(true);
      console.log("로켓 카메라 모드로 전환:", planetId);

      setFlyToTarget(cameraPos);
    } else {
      // Expert 모드: 카메라 이동
      const { setIsCameraMoving } = useStore.getState();
      setIsCameraMoving(true);

      setFlyToTarget(cameraPos);
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

  if (planets.length === 0) {
    return null;
  }

  return (
    <group>
      {/* 개별 행성 메시 (클릭 가능) */}
      {planets.map((planet) => {
        // disposition에 따른 색상 결정
        let color = "#ff0000"; // 기본 빨간색
        if (planet.disposition === "CONFIRMED") {
          color = "#00ff00"; // 녹색
        } else if (planet.disposition === "CANDIDATE") {
          color = "#ffff00"; // 노란색
        } else if (planet.disposition === "FALSE POSITIVE") {
          color = "#ff0000"; // 빨간색
        }

        // AI 확률에 따른 크기 (더 크게)
        const size = Math.max(0.15, Math.min(planet.ai_probability * 0.5, 0.4));

        return (
          <mesh
            key={planet.id}
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
              emissiveIntensity={0.3}
              roughness={0.6}
              metalness={0.2}
              transparent
              opacity={0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}
