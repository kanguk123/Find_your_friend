"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import { Color, Mesh } from "three";
import { useStore, type Planet } from "@/state/useStore";
import { ExoplanetClickHandler } from "@/utils/PlanetClickHandler";

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

// 점수에 따른 색상 생성 (파란색에서 빨간색으로 히트맵)
function scoreToHeatmap(score: number): string {
  // score는 0-1 범위로 정규화
  const normalizedScore = Math.max(0, Math.min(1, score));

  // 파란색(0)에서 빨간색(1)으로 변환하는 히트맵
  // 낮은 점수 = 파란색, 높은 점수 = 빨간색
  let r, g, b;

  if (normalizedScore < 0.5) {
    // 파란색에서 초록색으로 (0.0 - 0.5)
    const t = normalizedScore * 2;
    r = Math.floor(t * 200); // 더 밝은 색상
    g = Math.floor(t * 255);
    b = Math.floor((1 - t) * 255);
  } else {
    // 초록색에서 빨간색으로 (0.5 - 1.0)
    const t = (normalizedScore - 0.5) * 2;
    r = Math.floor(200 + t * 55); // 더 밝은 빨간색
    g = Math.floor((1 - t) * 200);
    b = Math.floor((1 - t) * 100);
  }

  return `rgb(${r}, ${g}, ${b})`;
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
    setBodyPositions,
    isCameraMoving,
    setIsCameraMoving,
    planets,
  } = useStore();
  // useStore에서 외계행성 데이터 가져오기
  const exoplanets = useMemo(
    () => planets.filter((p) => p.ra !== undefined && p.dec !== undefined),
    [planets]
  );

  const dotRadius = Math.max(0.3, radius * 0.02); // 크기 증가
  const ringInner = dotRadius * 1.8;
  const ringOuter = dotRadius * 3.0;

  const points = useMemo(() => {
    const cut = threshold / 100;
    const r = radius + SURFACE_OFFSET;
    return exoplanets
      .filter((p) => {
        // 임계값 필터
        if ((p.score || 0) < cut) return false;
        // 즐겨찾기 필터
        if (showOnlyFavorites && !favorites.has(p.id)) return false;
        return true;
      })
      .filter((p) => p.ra !== undefined && p.dec !== undefined)
      .map((p) => {
        const [x, y, z] = sph2cart(p.ra!, p.dec!, r);
        const color = scoreToHeatmap(p.score || 0);
        return { p, pos: [x, y, z] as [number, number, number], color };
      });
  }, [exoplanets, threshold, radius, showOnlyFavorites, favorites]);

  // 외계행성 위치를 bodyPositions에 저장 (useEffect로 분리)
  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {};
    points.forEach(({ p, pos }) => {
      positions[p.id] = pos;
    });
    setBodyPositions(positions);
    console.log(
      "Updated bodyPositions with exoplanets:",
      Object.keys(positions).length,
      "planets"
    );
  }, [points]);

  console.log("Filtered points:", points.length, "threshold:", threshold);
  console.log("Dot radius:", dotRadius);
  console.log(
    "Sample points:",
    points.slice(0, 3).map((p) => ({
      id: p.p.id,
      score: p.p.score,
      color: p.color,
      pos: p.pos,
    }))
  );

  const handlePlanetClick = useCallback(
    (p: Planet) => {
      const clickHandler = new ExoplanetClickHandler();

      // 첫 번째 클릭: 행성 선택 (하이라이트)
      const currentSelectedId = useStore.getState().selectedId;
      if (currentSelectedId !== p.id) {
        clickHandler.handleClick(p);
        return;
      }

      // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
      if (isCameraMoving) {
        // 이미 카메라가 이동 중이면 무시
        return;
      }

      if (p.ra === undefined || p.dec === undefined) {
        console.log("Cannot fly to planet - missing ra/dec:", p);
        return;
      }

      console.log("Starting flyToPlanet for:", p.name);
      setIsCameraMoving(true);

      // 카메라 거리는 반경 비례로 잡아줌
      const [x, y, z] = sph2cart(p.ra, p.dec, radius + SURFACE_OFFSET);
      const len = Math.hypot(x, y, z) || 1;
      const n: [number, number, number] = [x / len, y / len, z / len];
      const dist = radius * 1.2; // 외계행성은 작으므로 더 멀리서 관찰
      const targetPos: [number, number, number] = [
        n[0] * dist,
        n[1] * dist,
        n[2] * dist,
      ];

      console.log(
        "Flying to exoplanet:",
        p.name,
        "planet position:",
        [x, y, z],
        "camera target:",
        targetPos,
        "distance:",
        dist
      );

      setFlyToTarget(targetPos);
    },
    [radius, setSelectedId, setFlyToTarget, isCameraMoving, setIsCameraMoving]
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

  console.log("Rendering points:", points.length, "dotRadius:", dotRadius);

  return (
    <>
      {points.map(({ p, pos, color }) => {
        const clickHandler = new ExoplanetClickHandler();
        const visualState = clickHandler.getVisualState(p);

        return (
          <mesh
            key={p.id}
            position={pos}
            renderOrder={visualState.renderOrder}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(true);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHover(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Click on exoplanet:", p.name);
              handlePlanetClick(p);
            }}
          >
            <sphereGeometry args={[dotRadius, 16, 16]} />
            <meshBasicMaterial
              color={visualState.isOtherSelected ? "#666666" : color}
              transparent
              opacity={visualState.isOtherSelected ? visualState.opacity : 0.8}
            />
          </mesh>
        );
      })}

      {selPos && (
        <mesh ref={ringRef} position={selPos}>
          <ringGeometry args={[ringInner, ringOuter, RING_SEGMENTS]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
        </mesh>
      )}
    </>
  );
}
