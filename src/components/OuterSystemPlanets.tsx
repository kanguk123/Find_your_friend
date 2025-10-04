"use client";

import { useEffect, useRef, useState } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useStore, type Planet } from "@/state/useStore";

interface OuterPlanet {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitAngle?: number;
}

export default function OuterSystemPlanets() {
  const [planets, setPlanets] = useState<OuterPlanet[]>([]);
  const planetRefs = useRef<Record<string, Group>>({});
  const {
    setSelectedId,
    setFlyToTarget,
    setFollowRocket,
    setPlanets: setStorePlanets,
    setBodyPositions,
  } = useStore();

  useEffect(() => {
    // 천왕성 궤도(19.2 AU) 바깥에 행성들 생성
    const outerPlanets = generateOuterPlanets(30);
    setPlanets(outerPlanets);

    // Store에 Planet 형태로 변환하여 추가
    const storePlanets: Planet[] = outerPlanets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      ra: Math.random() * 360, // 랜덤 적경
      dec: (Math.random() - 0.5) * 180, // 랜덤 적위
      teq: 50 + Math.random() * 200, // 랜덤 평형온도 (50-250K)
      score: 0.3 + Math.random() * 0.6, // 랜덤 점수 (0.3-0.9)
      features: {
        mass: 0.1 + Math.random() * 10, // 지구 질량의 0.1-10배
        radius: 0.5 + Math.random() * 2, // 지구 반지름의 0.5-2.5배
        orbital_period: 100 + Math.random() * 1000, // 공전주기 (일)
        stellar_flux: 0.1 + Math.random() * 2, // 항성 플럭스
      },
    }));

    setStorePlanets(storePlanets);
  }, [setStorePlanets]);

  // 행성들이 궤도 운동하도록 애니메이션
  useFrame(() => {
    const now = Date.now() / 1000;
    const positions: Record<string, [number, number, number]> = {};

    planets.forEach((planet) => {
      if (!planet.orbitRadius || !planet.orbitSpeed) return;
      const g = planetRefs.current[planet.id];
      if (!g) return;

      const angle = (planet.orbitAngle || 0) + now * planet.orbitSpeed;
      const x = Math.cos(angle) * planet.orbitRadius;
      const z = Math.sin(angle) * planet.orbitRadius;
      g.position.set(x, 0, z);

      // Store에 현재 위치 업데이트
      positions[planet.id] = [x, 0, z];
    });

    // 모든 외부 행성 위치를 Store에 업데이트
    setBodyPositions(positions);
  });

  const handleDoubleClick = (planet: OuterPlanet) => {
    const g = planetRefs.current[planet.id];
    if (!g) return;

    setSelectedId(planet.id);

    // 행성 크기에 따라 카메라 거리 조정
    const planetRadius = planet.radius;
    const cameraDistance = Math.max(planetRadius * 15, 2); // 최소 2 단위 거리 보장

    // 태양(0, 0, 0)에서 행성으로 향하는 방향 벡터 계산
    const dirX = g.position.x;
    const dirZ = g.position.z;
    const len = Math.hypot(dirX, dirZ) || 1;
    const normalX = dirX / len;
    const normalZ = dirZ / len;

    // 수직 벡터 (행성에서 태양 쪽으로 향하는 선에 수직)
    const perpX = -normalZ;
    const perpZ = normalX;

    // 카메라 위치 계산: 행성 위치에서 태양 반대편, 약간 옆으로 비켜서
    const camX =
      g.position.x -
      normalX * cameraDistance * 0.4 +
      perpX * cameraDistance * 0.6;
    const camY = g.position.y + cameraDistance * 0.5; // 위쪽에서 내려다보는 각도
    const camZ =
      g.position.z -
      normalZ * cameraDistance * 0.4 +
      perpZ * cameraDistance * 0.6;

    setFlyToTarget([camX, camY, camZ]);
    setFollowRocket(false);
  };

  return (
    <group>
      {planets.map((planet) => (
        <group
          key={planet.id}
          ref={(el) => {
            if (el) planetRefs.current[planet.id] = el;
          }}
          position={planet.position}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(planet.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleDoubleClick(planet);
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
          <mesh>
            <sphereGeometry args={[planet.radius, 32, 32]} />
            <meshStandardMaterial
              color={planet.color}
              roughness={0.6 + Math.random() * 0.3}
              metalness={0.1 + Math.random() * 0.3}
              emissive={planet.color}
              emissiveIntensity={0.1 + Math.random() * 0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function generateOuterPlanets(count: number): OuterPlanet[] {
  const planets: OuterPlanet[] = [];
  const planetNames = [
    "Pluto",
    "Eris",
    "Makemake",
    "Haumea",
    "Quaoar",
    "Sedna",
    "Orcus",
    "Gonggong",
    "Salacia",
    "Varda",
    "Ixion",
    "Chaos",
    "Varuna",
    "2002 MS4",
    "2002 AW197",
    "2003 AZ84",
    "2004 GV9",
    "2005 RN43",
    "2007 JJ43",
    "2008 OG19",
  ];

  const colors = [
    "#8B7355",
    "#A0522D",
    "#CD853F",
    "#D2691E",
    "#BC8F8F",
    "#F4A460",
    "#D2B48C",
    "#DEB887",
    "#F5DEB3",
    "#FFE4B5",
    "#FFEBCD",
    "#FFF8DC",
    "#FFEFD5",
    "#FFFACD",
    "#FAEBD7",
    "#FDF5E6",
    "#FFF5EE",
    "#F0F8FF",
    "#E6E6FA",
    "#F8F8FF",
    "#FFFAF0",
    "#FFFFF0",
  ];

  // 천왕성 궤도(19.2 AU) 바깥부터 시작
  const uranusOrbit = 19.2;

  for (let i = 0; i < count; i++) {
    // 천왕성 궤도(19.2 AU)보다 확실히 밖에 배치 (최소 21 AU에서 시작)
    const orbitRadius = uranusOrbit + 1.8 + Math.random() * 75;

    // 초기 궤도 각도 (랜덤)
    const orbitAngle = Math.random() * Math.PI * 2;

    // 초기 위치 계산
    const x = Math.cos(orbitAngle) * orbitRadius;
    const z = Math.sin(orbitAngle) * orbitRadius;
    const y = (Math.random() - 0.5) * 5; // 약간의 수직 오프셋

    // 행성 크기 (명왕성 크기 정도)
    const radius = 0.03 + Math.random() * 0.08;

    // 궤도 속도 (거리가 멀수록 느림)
    const orbitSpeed = 0.00001 + Math.random() * 0.00002;

    planets.push({
      id: `outer-planet-${i}`,
      name:
        planetNames[i % planetNames.length] +
        (i >= planetNames.length
          ? `-${Math.floor(i / planetNames.length) + 1}`
          : ""),
      position: [x, y, z],
      radius,
      color: colors[Math.floor(Math.random() * colors.length)],
      orbitRadius,
      orbitSpeed,
      orbitAngle,
    });
  }

  return planets;
}
