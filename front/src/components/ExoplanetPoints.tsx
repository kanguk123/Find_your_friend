"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useStore, type Planet, type Vec3 } from "@/state/useStore";
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

// 행성의 3D 좌표를 계산하는 유틸 함수 (중복 제거)
function getPlanetPosition(
  planet: Planet,
  radius: number,
  surfaceOffset: number
): [number, number, number] {
  // coordinates_3d가 있으면 그대로 사용
  if (planet.coordinates_3d) {
    const { x, y, z } = planet.coordinates_3d;
    return [x, y, z];
  }

  // coordinates_3d가 없으면 ra/dec와 distance를 사용하여 계산
  const actualRadius = planet.distance
    ? Math.max(50, Math.min(500, planet.distance * 10))
    : radius + surfaceOffset;

  return sph2cart(planet.ra!, planet.dec!, actualRadius);
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
const MAX_RENDER_DISTANCE = 50; // 카메라로부터 최대 렌더링 거리

export default function ExoplanetPoints({ radius = 25 }: { radius?: number }) {
  const {
    threshold,
    setFlyToTarget,
    showOnlyFavorites,
    favorites,
    setBodyPositions,
    isCameraMoving,
    setIsCameraMoving,
    planets,
    mode,
    followRocket,
    collectCoin,
    addFloatingText,
    collectedPlanets,
    addCollectedPlanet,
  } = useStore();
  const { camera } = useThree();

  // useStore에서 외계행성 데이터 가져오기
  const exoplanets = useMemo(
    () => planets.filter((p) => p.ra !== undefined && p.dec !== undefined),
    [planets]
  );

  const dotRadius = Math.max(0.3, radius * 0.0005); // 크기를 1/10로 축소

  const allPoints = useMemo(() => {
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
        const [x, y, z] = getPlanetPosition(p, radius, SURFACE_OFFSET);
        const color = scoreToHeatmap(p.score || 0);
        return { p, pos: [x, y, z] as [number, number, number], color };
      });
  }, [exoplanets, threshold, radius, showOnlyFavorites, favorites]);

  // 외계행성 위치를 bodyPositions에 저장 (useEffect로 분리)
  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {};
    allPoints.forEach(({ p, pos }) => {
      positions[p.id] = pos;
    });
    setBodyPositions(positions);
  }, [allPoints, setBodyPositions]);

  const handlePlanetClick = useCallback(
    (p: Planet) => {
      const clickHandler = new ExoplanetClickHandler();
      const { setShowPlanetCard } = useStore.getState();

      // 첫 번째 클릭: 행성 선택 (하이라이트) 및 PlanetCard 표시
      const currentSelectedId = useStore.getState().selectedId;
      if (currentSelectedId !== p.id) {
        clickHandler.handleClick(p);

        // Player 모드 + 로켓 시점 + 90% 이상 확률 + 아직 수집 안한 행성 = 코인 획득
        if (
          mode === "player" &&
          followRocket &&
          (p.score || 0) >= 0.9 &&
          !collectedPlanets.has(p.id)
        ) {
          // 무조건 1코인
          collectCoin();

          // 행성 위치 계산
          const [px, py, pz] = getPlanetPosition(p, radius, SURFACE_OFFSET);

          // 플로팅 텍스트 표시
          addFloatingText("+1 🪙", [px, py, pz]);

          // 행성을 수집 완료로 마킹
          addCollectedPlanet(p.id);

          console.log(
            `🎉 Collected 1 coin from ${p.name} (${(
              (p.score || 0) * 100
            ).toFixed(1)}%)`
          );
        }

        // PlanetCard 표시 - API에서 상세 정보 가져오기
        setShowPlanetCard(true);
        const planetId = parseInt(p.id.replace("exo-", ""));

        // API에서 상세 정보 가져오기
        import("../services/api")
          .then(({ ApiService }) => ApiService.getPlanetDetail(planetId))
          .then((response) => {
            const { setSelectedPlanetData: setData } = useStore.getState();
            if (response.success && response.data) {
              // API에서 받은 상세 정보를 PlanetCard에 전달
              setData(response.data);
              console.log(
                "3D Planet clicked - API data loaded:",
                response.data
              );
            } else {
              // API 호출 실패 시 기본 데이터 사용
              const planetData = {
                id: planetId,
                rowid: planetId,
                kepler_name: p.name,
                ra: p.ra || 0,
                dec: p.dec || 0,
                teq: p.teq,
                disposition:
                  "disposition" in p ? String(p.disposition) : "UNKNOWN",
                ai_probability: p.score || 0,
                r: p.features?.radius || 0,
                m: p.features?.mass || 0,
                per: p.features?.orbital_period || 0,
                flux: p.features?.stellar_flux || 0,
                coordinates_3d: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
              };
              setData(planetData);
            }
          })
          .catch((error) => {
            console.error(
              "Failed to fetch planet detail from 3D click:",
              error
            );
            const { setSelectedPlanetData: setData } = useStore.getState();
            // 에러 발생 시 기본 데이터 사용
            const planetData = {
              id: planetId,
              rowid: planetId,
              kepler_name: p.name,
              ra: p.ra || 0,
              dec: p.dec || 0,
              teq: p.teq,
              disposition:
                "disposition" in p ? String(p.disposition) : "UNKNOWN",
              ai_probability: p.score || 0,
              r: p.features?.radius || 0,
              m: p.features?.mass || 0,
              per: p.features?.orbital_period || 0,
              flux: p.features?.stellar_flux || 0,
              coordinates_3d: {
                x: 0,
                y: 0,
                z: 0,
              },
            };
            setData(planetData);
          });

        return;
      }

      // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
      // player 모드에서는 행성으로 이동하지 않음
      if (mode === "player") {
        return;
      }

      if (isCameraMoving) {
        // 이미 카메라가 이동 중이면 무시
        return;
      }

      if (p.ra === undefined || p.dec === undefined) {
        console.log("Cannot fly to planet - missing ra/dec:", p);
        return;
      }

      // 외계행성 데이터가 유효한지 추가 검증
      if (
        typeof p.ra !== "number" ||
        typeof p.dec !== "number" ||
        isNaN(p.ra) ||
        isNaN(p.dec)
      ) {
        console.warn("외계행성 좌표 데이터가 유효하지 않습니다:", p);
        return;
      }

      console.log("Starting flyToPlanet for:", p.name);
      setIsCameraMoving(true);

      // 로켓 카메라 모드로 전환
      const { setRocketCameraMode, setRocketCameraTarget } =
        useStore.getState();
      setRocketCameraMode("planet_view");
      setRocketCameraTarget(p.id);
      console.log("로켓 카메라 모드로 전환:", p.name);

      // 행성 위치 계산
      const [x, y, z] = getPlanetPosition(p, radius, SURFACE_OFFSET);

      const len = Math.hypot(x, y, z) || 1;
      const n: [number, number, number] = [x / len, y / len, z / len];
      const dist = len * 1.2; // 행성으로부터 20% 더 멀리
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

      // bodyPositions에 외계행성 위치 저장 (Scene.tsx에서 사용)
      const currentPositions = useStore.getState().bodyPositions;
      const newPositions = {
        ...currentPositions,
        [p.id]: [x, y, z] as Vec3,
      };
      setBodyPositions(newPositions);

      // 즉시 bodyPositions 업데이트 후 카메라 이동
      useStore.setState({ bodyPositions: newPositions });
      setFlyToTarget(targetPos);
    },
    [
      radius,
      setFlyToTarget,
      isCameraMoving,
      setIsCameraMoving,
      setBodyPositions,
      mode,
      followRocket,
      collectCoin,
      addFloatingText,
      collectedPlanets,
      addCollectedPlanet,
    ]
  );

  const [hover, setHover] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hover]);

  return (
    <>
      {allPoints.map(({ p, pos, color }) => {
        // 카메라 거리 체크 (렌더링 시점에 실시간 계산)
        const dx = pos[0] - camera.position.x;
        const dy = pos[1] - camera.position.y;
        const dz = pos[2] - camera.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > MAX_RENDER_DISTANCE) return null;

        const clickHandler = new ExoplanetClickHandler();
        const visualState = clickHandler.getVisualState(p);
        const isSelected = visualState.isSelected;

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
            <sphereGeometry
              args={[isSelected ? dotRadius * 1.5 : dotRadius, 16, 16]}
            />
            <meshBasicMaterial
              color={
                visualState.isOtherSelected
                  ? "#666666"
                  : isSelected
                  ? "#ffffff"
                  : color
              }
              transparent
              opacity={
                visualState.isOtherSelected
                  ? visualState.opacity
                  : isSelected
                  ? 1.0
                  : 0.8
              }
            />
          </mesh>
        );
      })}
    </>
  );
}
