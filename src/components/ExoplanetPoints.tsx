"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import { Color, Mesh } from "three";
import { useStore, type Planet } from "@/state/useStore";

// 구면 좌표를 직교 좌표로 변환
function sph2cart(
  ra: number,
  dec: number,
  radius: number
): [number, number, number] {
  const phi = (ra * Math.PI) / 180;
  const theta = (dec * Math.PI) / 180;
  const x = radius * Math.cos(theta) * Math.cos(phi);
  const y = radius * Math.sin(theta);
  const z = radius * Math.cos(theta) * Math.sin(phi);
  return [x, y, z];
}

// 점수에 따른 색상 생성
function scoreToHSL(score: number): string {
  const hue = score * 120; // 0-120 (빨강-초록)
  const saturation = 70;
  const lightness = 50;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const SURFACE_OFFSET = 0.1;
const RING_ROT_SPEED = 0.5;
const RING_PULSE_SPEED = 2;
const RING_SEGMENTS = 32;
const RING_PULSE_RANGE = 0.05;

export default function ExoplanetPoints({ radius = 25 }: { radius?: number }) {
  const {
    threshold,
    selectedId,
    setSelectedId,
    setFlyToTarget,
    showOnlyFavorites,
    favorites,
  } = useStore();
  const [exoplanets, setExoplanets] = useState<Planet[]>([]);

  // test.json에서 데이터 로드
  useEffect(() => {
    fetch("/test.json")
      .then((res) => res.json())
      .then((data) => {
        // test.json 데이터를 Planet 타입으로 변환
        const planets: Planet[] = data.planets.map((p: any) => ({
          id: p.id,
          name: p.name,
          ra: p.ra,
          dec: p.dec,
          score: p.score,
          teq: p.teq,
          features: p.features,
        }));
        setExoplanets(planets);
      })
      .catch((err) => {
        console.error("Failed to load exoplanet data:", err);
      });
  }, []);

  const dotRadius = Math.max(0.03, radius * 0.002);
  const ringInner = dotRadius * 1.8;
  const ringOuter = dotRadius * 3.0;

  const points = useMemo(() => {
    const cut = threshold / 100;
    const r = radius + SURFACE_OFFSET;
    return exoplanets
      .filter((p) => {
        // 임계값 필터
        if (p.score < cut) return false;
        // 즐겨찾기 필터
        if (showOnlyFavorites && !favorites.has(p.id)) return false;
        return true;
      })
      .filter((p) => p.ra !== undefined && p.dec !== undefined)
      .map((p) => {
        const [x, y, z] = sph2cart(p.ra!, p.dec!, r);
        const color = new Color().setStyle(scoreToHSL(p.score || 0)).getStyle();
        return { p, pos: [x, y, z] as [number, number, number], color };
      });
  }, [exoplanets, threshold, radius, showOnlyFavorites, favorites]);

  const selectPlanet = useCallback(
    (p: Planet) => {
      setSelectedId(p.id);
    },
    [setSelectedId]
  );

  const flyToPlanet = useCallback(
    (p: Planet) => {
      if (!p.ra || !p.dec) return;
      setSelectedId(p.id);
      // 카메라 거리는 반경 비례로 잡아줌
      const [x, y, z] = sph2cart(p.ra, p.dec, radius + SURFACE_OFFSET);
      const len = Math.hypot(x, y, z) || 1;
      const n: [number, number, number] = [x / len, y / len, z / len];
      const dist = radius * 0.15;
      setFlyToTarget([n[0] * dist, n[1] * dist, n[2] * dist]);
    },
    [radius, setSelectedId, setFlyToTarget]
  );

  const [hover, setHover] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hover]);

  const ringRef = useRef<Mesh>(null!);
  const selPlanet = useMemo(
    () => exoplanets.find((p) => p.id === selectedId),
    [exoplanets, selectedId]
  );
  const selPos: [number, number, number] | undefined = useMemo(() => {
    if (!selPlanet || !selPlanet.ra || !selPlanet.dec) return undefined;
    const [x, y, z] = sph2cart(
      selPlanet.ra,
      selPlanet.dec,
      radius + SURFACE_OFFSET
    );
    return [x, y, z];
  }, [selPlanet, radius]);

  useFrame((_, dt) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += dt * RING_ROT_SPEED;
    const s =
      1 + Math.sin(performance.now() * RING_PULSE_SPEED) * RING_PULSE_RANGE;
    ringRef.current.scale.setScalar(s);
  });

  return (
    <>
      <Instances limit={points.length || 1} key={points.length}>
        <sphereGeometry args={[dotRadius, 16, 16]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
        {points.map(({ p, pos, color }) => (
          <Instance
            key={p.id}
            position={pos}
            color={color}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(true);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHover(false);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              selectPlanet(p);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              flyToPlanet(p);
            }}
          />
        ))}
      </Instances>

      {selPos && (
        <mesh ref={ringRef} position={selPos}>
          <ringGeometry args={[ringInner, ringOuter, RING_SEGMENTS]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
        </mesh>
      )}
    </>
  );
}
