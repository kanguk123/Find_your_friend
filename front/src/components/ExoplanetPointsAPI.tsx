"use client";

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { BufferGeometry, Float32BufferAttribute, Points as ThreePoints } from "three";
import { useStore } from "../state/useStore";
import { ApiService, PlanetData } from "../services/api";

const SURFACE_OFFSET = 0.1;

export default function ExoplanetPointsAPI() {
  const pointsRef = useRef<ThreePoints>(null);
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
  } = useStore();

  // 백엔드에서 행성 데이터 로드
  useEffect(() => {
    const loadPlanets = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getPlanets();
        
        if (response.success) {
          setPlanets(response.data);
          
          // bodyPositions에 행성 위치 저장
          const positions: Record<string, [number, number, number]> = {};
          response.data.forEach((planet) => {
            positions[planet.id.toString()] = [
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

  // 3D 포인트 생성
  const pointsGeometry = React.useMemo(() => {
    if (planets.length === 0) return null;

    const geometry = new BufferGeometry();
    const positions = new Float32Array(planets.length * 3);
    const colors = new Float32Array(planets.length * 3);
    const sizes = new Float32Array(planets.length);

    planets.forEach((planet, i) => {
      const idx = i * 3;
      
      // 위치 설정 (백엔드에서 받은 3D 좌표 사용)
      positions[idx] = planet.coordinates_3d.x;
      positions[idx + 1] = planet.coordinates_3d.y;
      positions[idx + 2] = planet.coordinates_3d.z;

      // 색상 설정 (disposition에 따라)
      let color = [1, 1, 1]; // 기본 흰색
      if (planet.disposition === "CONFIRMED") {
        color = [0, 1, 0]; // 녹색
      } else if (planet.disposition === "CANDIDATE") {
        color = [1, 1, 0]; // 노란색
      } else if (planet.disposition === "FALSE POSITIVE") {
        color = [1, 0, 0]; // 빨간색
      }

      colors[idx] = color[0];
      colors[idx + 1] = color[1];
      colors[idx + 2] = color[2];

      // 크기 설정 (AI 확률에 따라)
      sizes[i] = Math.max(0.5, planet.ai_probability * 3);
    });

    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new Float32BufferAttribute(sizes, 1));

    return geometry;
  }, [planets]);

  // 애니메이션
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // 행성 클릭 핸들러
  const handlePlanetClick = (planetId: number, planet: PlanetData) => {
    console.log("행성 클릭:", planetId, planet.disposition);
    
    // 선택된 행성 ID 설정
    setSelectedId(planetId.toString());

    if (mode === "player") {
      // Player 모드: 로켓 카메라 모드로 전환
      const { setRocketCameraMode, setRocketCameraTarget } = useStore.getState();
      setRocketCameraMode("planet_view");
      setRocketCameraTarget(planetId.toString());
      console.log("로켓 카메라 모드로 전환:", planetId);

      // 카메라 거리 계산
      const radius = planet.r;
      const cameraDistance = radius * 1.5;
      const targetPos: [number, number, number] = [
        planet.coordinates_3d.x,
        planet.coordinates_3d.y,
        planet.coordinates_3d.z,
      ];

      console.log(
        "Flying to exoplanet:",
        planetId,
        "planet position:",
        targetPos,
        "distance:",
        cameraDistance
      );

      setFlyToTarget(targetPos);
    } else {
      // Expert 모드: 카메라 이동
      const targetPos: [number, number, number] = [
        planet.coordinates_3d.x,
        planet.coordinates_3d.y,
        planet.coordinates_3d.z,
      ];
      setFlyToTarget(targetPos);
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

  if (!pointsGeometry) {
    return null;
  }

  return (
    <group>
      <Points ref={pointsRef} geometry={pointsGeometry} limit={planets.length}>
        <PointMaterial
          transparent
          vertexColors
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
      
      {/* 개별 행성 메시 (클릭 가능) */}
      {planets.map((planet) => (
        <mesh
          key={planet.id}
          position={[
            planet.coordinates_3d.x,
            planet.coordinates_3d.y,
            planet.coordinates_3d.z,
          ]}
          onClick={() => handlePlanetClick(planet.id, planet)}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={
              planet.disposition === "CONFIRMED"
                ? "green"
                : planet.disposition === "CANDIDATE"
                ? "yellow"
                : "red"
            }
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
