"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useStore, type Planet } from "@/state/useStore";
import { ExoplanetClickHandler } from "@/utils/PlanetClickHandler";

interface ExternalPlanet {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export default function ExternalPlanets() {
  const [planets, setPlanets] = useState<ExternalPlanet[]>([]);
  const planetRefs = useRef<Record<string, Group>>({});
  const { setSelectedId, setFlyToTarget, setFollowRocket } = useStore();

  useEffect(() => {
    // Fetch planets from API
    fetch("/api/planets")
      .then((res) => res.json())
      .then((data) => {
        if (data.planets) {
          setPlanets(data.planets);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch planets:", err);
        // Generate fallback random planets (50개로 증가)
        const fallbackPlanets = generateFallbackPlanets(50);
        setPlanets(fallbackPlanets);
      });
  }, []);

  // Animate planets in orbit
  useFrame(() => {
    const now = Date.now() / 1000;
    planets.forEach((planet) => {
      if (!planet.orbitRadius || !planet.orbitSpeed) return;
      const g = planetRefs.current[planet.id];
      if (!g) return;

      const angle = now * planet.orbitSpeed;
      const x = Math.cos(angle) * planet.orbitRadius;
      const z = Math.sin(angle) * planet.orbitRadius;
      g.position.set(x, 0, z);
    });
  });

  const handlePlanetClick = (planet: ExternalPlanet) => {
    const g = planetRefs.current[planet.id];
    if (!g) return;

    // ExternalPlanet을 Planet 타입으로 변환
    const planetData: Planet = {
      id: planet.id,
      name: planet.name,
      ra: Math.random() * 360, // 랜덤 적경
      dec: (Math.random() - 0.5) * 180, // 랜덤 적위
      score: 0.3 + Math.random() * 0.6, // 랜덤 점수
      features: {
        mass: planet.radius * 10,
        radius: planet.radius,
        orbital_period: 100 + Math.random() * 1000,
        stellar_flux: 0.1 + Math.random() * 2,
      },
    };

    // 통합된 클릭 핸들러 사용
    const clickHandler = new ExoplanetClickHandler();
    const position: [number, number, number] = [
      g.position.x,
      g.position.y,
      g.position.z,
    ];
    clickHandler.handleClick(planetData, position);

    // 로켓 추적 해제
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
            handlePlanetClick(planet);
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

function generateFallbackPlanets(count: number): ExternalPlanet[] {
  const planets: ExternalPlanet[] = [];
  const planetNames = [
    "Kepler-186f",
    "Proxima Centauri b",
    "TRAPPIST-1e",
    "Kepler-452b",
    "LHS 1140 b",
    "Gliese 581g",
    "HD 40307g",
    "Wolf 1061c",
    "Ross 128 b",
    "Teegarden's Star b",
    "GJ 357 d",
    "TOI-700 d",
    "K2-18b",
    "GJ 667Cc",
    "HD 85512b",
    "Gliese 667Cc",
    "Kepler-438b",
    "Kepler-442b",
    "GJ 273b",
    "TRAPPIST-1f",
  ];

  const colors = [
    "#4a90e2",
    "#e24a4a",
    "#4ae24a",
    "#e2e24a",
    "#e24ae2",
    "#4ae2e2",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#54a0ff",
    "#5f27cd",
    "#00d2d3",
    "#ff9f43",
    "#10ac84",
    "#ee5a24",
    "#0984e3",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
  ];

  // 태양계 밖 다양한 거리에 행성 배치
  for (let i = 0; i < count; i++) {
    // 태양계 밖 거리 (20-100 단위)
    const distance = 20 + Math.random() * 80;

    // 3D 공간에 랜덤 배치 (구면 좌표계 사용)
    const theta = Math.random() * Math.PI * 2; // azimuth
    const phi = Math.acos(2 * Math.random() - 1); // elevation
    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = (Math.random() - 0.5) * 20; // 수직 범위 제한
    const z = distance * Math.sin(phi) * Math.sin(theta);

    // 행성 크기 (지구 대비 0.5-3배)
    const radius = 0.05 + Math.random() * 0.25;

    // 궤도 반지름과 속도 (일부 행성만 궤도 운동)
    const hasOrbit = Math.random() > 0.3;
    const orbitRadius = hasOrbit ? distance : undefined;
    const orbitSpeed = hasOrbit ? 0.00005 + Math.random() * 0.0001 : undefined;

    planets.push({
      id: `external-planet-${i}`,
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
    });
  }

  return planets;
}
