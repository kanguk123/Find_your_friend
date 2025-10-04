"use client";

import { useState, useEffect } from "react";
import { useStore, type Planet } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";
import {
  SolarPlanetClickHandler,
  ExoplanetClickHandler,
} from "@/utils/PlanetClickHandler";

export default function PlanetListPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const {
    selectedId,
    setSelectedId,
    setFlyToTarget,
    setFollowRocket,
    isCameraMoving,
    setIsCameraMoving,
    threshold,
    showOnlyFavorites,
    favorites,
  } = useStore();

  // 태양계 행성과 외계행성 데이터 로드
  useEffect(() => {
    // 태양계 행성을 Planet 타입으로 변환
    const solarSystemPlanets: Planet[] = [
      {
        id: SUN.id,
        name: SUN.name,
        score: 1.0, // 태양은 최고 점수
        features: {
          mass: 1.0,
          radius: 1.0,
          orbital_period: 0,
          stellar_flux: 1.0,
        },
      },
      ...PLANETS.map((planet) => ({
        id: planet.id,
        name: planet.name,
        score: planet.score || 0,
        features: {
          mass: planet.radius * 10, // 대략적인 질량 추정
          radius: planet.radius,
          orbital_period: planet.periodDays,
          stellar_flux: 1.0 / (planet.orbitRadius || 1) ** 2, // 거리의 제곱에 반비례
        },
      })),
    ];

    // 외계행성 데이터 로드
    fetch("/test.json")
      .then((res) => res.json())
      .then((data) => {
        const exoplanets: Planet[] = data.planets.map((p: any) => ({
          id: p.id,
          name: p.name,
          ra: p.ra,
          dec: p.dec,
          score: p.score,
          teq: p.teq,
          features: p.features,
        }));

        // 태양계 행성과 외계행성 합치기
        setPlanets([...solarSystemPlanets, ...exoplanets]);
      })
      .catch((err) => {
        console.error("Failed to load exoplanet data:", err);
        // 외계행성 로드 실패 시 태양계 행성만 표시
        setPlanets(solarSystemPlanets);
      });
  }, []);

  // 필터링된 행성 목록
  const filteredPlanets = planets.filter((p) => {
    const cut = threshold / 100;
    if (p.score && p.score < cut) return false;
    if (showOnlyFavorites && !favorites.has(p.id)) return false;
    return true;
  });

  // 점수에 따른 색상 생성
  const getScoreColor = (score: number) => {
    const hue = score * 120; // 0-120 (빨강-초록)
    return `hsl(${hue}, 70%, 50%)`;
  };

  // 행성 클릭 핸들러
  const handlePlanetClick = (planet: Planet) => {
    // 태양계 행성인지 확인 (ra, dec가 없으면 태양계 행성)
    const isSolarSystem = !planet.ra || !planet.dec;
    const clickHandler = isSolarSystem
      ? new SolarPlanetClickHandler()
      : new ExoplanetClickHandler();

    // 첫 번째 클릭: 행성 선택 (하이라이트)
    const currentSelectedId = useStore.getState().selectedId;
    if (currentSelectedId !== planet.id) {
      clickHandler.handleClick(planet);
      return;
    }

    // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
    if (isCameraMoving) {
      // 이미 카메라가 이동 중이면 무시
      return;
    }

    setIsCameraMoving(true);

    // 태양계 행성인지 확인 (ra, dec가 없으면 태양계 행성)
    if (!planet.ra || !planet.dec) {
      // 태양계 행성의 경우 - SolarSystem.tsx와 동일한 로직 사용
      const solarPlanet = PLANETS.find((p) => p.id === planet.id) || SUN;
      const orbitRadius = solarPlanet.orbitRadius || 0;

      // 행성 크기에 따라 카메라 거리 조정
      const planetRadius =
        solarPlanet.id === "sun"
          ? solarPlanet.radius
          : solarPlanet.radius * 0.62; // GLOBAL_PLANET_SCALE 적용
      const cameraDistance = planetRadius * 4.5; // 더 멀리

      // 태양계 행성의 현재 위치 계산 (SolarSystem.tsx와 동일한 로직)
      const timeScale = 60; // SolarSystem에서 사용하는 timeScale
      const TAU = Math.PI * 2;
      const ORBIT_SCALE = 1; // SolarSystem에서 사용하는 ORBIT_SCALE

      let x, y, z;
      if (solarPlanet.periodDays) {
        const now = Date.now();
        const seconds = now / 1000;
        const omega =
          timeScale === 0
            ? 0
            : TAU / ((solarPlanet.periodDays * 86400) / timeScale);
        const angle = omega * seconds;
        const r = orbitRadius * ORBIT_SCALE;
        x = r * Math.cos(angle);
        y = 0;
        z = r * Math.sin(angle);
      } else {
        // 태양의 경우 중심에 고정
        x = 0;
        y = 0;
        z = 0;
      }

      // 태양(0, 0, 0)에서 행성으로 향하는 방향 벡터 (정규화)
      const dirX = x;
      const dirZ = z;
      const len = Math.hypot(dirX, dirZ) || 1;
      const normalX = dirX / len;
      const normalZ = dirZ / len;

      // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
      // 행성의 밝은 면을 정면에서 봄
      const camX = x + normalX * cameraDistance;
      const camY = y + cameraDistance * 0.15; // 약간 위에서
      const camZ = z + normalZ * cameraDistance;

      setFlyToTarget([camX, camY, camZ]);
    } else {
      // 외계행성의 경우 - ExoplanetPoints.tsx와 동일한 로직 사용
      const phi = (planet.ra * Math.PI) / 180;
      const theta = (planet.dec * Math.PI) / 180;
      const radius = 30;
      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta);
      const z = radius * Math.cos(theta) * Math.sin(phi);

      const len = Math.hypot(x, y, z) || 1;
      const n = [x / len, y / len, z / len];
      const dist = radius * 0.5;
      setFlyToTarget([n[0] * dist, n[1] * dist, n[2] * dist]);
    }

    // 로켓 추적 해제 (카메라가 행성으로 이동)
    setFollowRocket(false);
  };

  return (
    <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Planet List ({filteredPlanets.length})
        </h3>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 max-h-60 overflow-y-auto">
          {filteredPlanets.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p>No planets found</p>
              <p className="text-xs mt-1">Adjust filters to see more planets</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlanets.map((planet) => {
                const isSolarSystem = !planet.ra || !planet.dec;
                const clickHandler = isSolarSystem
                  ? new SolarPlanetClickHandler()
                  : new ExoplanetClickHandler();
                const visualState = clickHandler.getVisualState(planet);
                const isMoving = visualState.isSelected && isCameraMoving;

                return (
                  <div
                    key={planet.id}
                    onClick={() => handlePlanetClick(planet)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      visualState.isSelected
                        ? isMoving
                          ? "bg-green-500/20 border border-green-400/50"
                          : "bg-purple-500/20 border border-purple-400/50"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                    style={{
                      opacity: visualState.isOtherSelected
                        ? visualState.opacity
                        : 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white text-sm">
                          {planet.name}
                        </h4>
                        {isSolarSystem && (
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                            Solar System
                          </span>
                        )}
                        {visualState.isSelected && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              isMoving
                                ? "bg-green-500/20 text-green-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {isMoving ? "Moving..." : "Selected"}
                          </span>
                        )}
                      </div>
                      {planet.score && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getScoreColor(planet.score),
                          }}
                          title={`Score: ${(planet.score * 100).toFixed(1)}%`}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                      {planet.score && (
                        <div>
                          <span className="text-white/50">Score:</span>
                          <span className="ml-1 font-mono text-green-400">
                            {(planet.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {isSolarSystem ? (
                        // 태양계 행성 정보
                        <>
                          {planet.features?.orbital_period && (
                            <div>
                              <span className="text-white/50">Period:</span>
                              <span className="ml-1 font-mono text-yellow-400">
                                {planet.features.orbital_period.toFixed(0)}d
                              </span>
                            </div>
                          )}
                          {planet.features?.radius && (
                            <div>
                              <span className="text-white/50">Radius:</span>
                              <span className="ml-1 font-mono text-blue-400">
                                {planet.features.radius.toFixed(2)}R⊕
                              </span>
                            </div>
                          )}
                          {planet.features?.mass && (
                            <div>
                              <span className="text-white/50">Mass:</span>
                              <span className="ml-1 font-mono text-purple-400">
                                {planet.features.mass.toFixed(2)}M⊕
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        // 외계행성 정보
                        <>
                          {planet.teq && (
                            <div>
                              <span className="text-white/50">Temp:</span>
                              <span className="ml-1 font-mono text-blue-400">
                                {planet.teq}K
                              </span>
                            </div>
                          )}
                          {planet.ra && planet.dec && (
                            <div className="col-span-2">
                              <span className="text-white/50">Position:</span>
                              <span className="ml-1 font-mono text-orange-400">
                                RA: {planet.ra.toFixed(2)}°, Dec:{" "}
                                {planet.dec.toFixed(2)}°
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {planet.features && !isSolarSystem && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                          {planet.features.mass && (
                            <div>
                              <span>Mass:</span>
                              <span className="ml-1 font-mono">
                                {planet.features.mass.toFixed(2)}M⊕
                              </span>
                            </div>
                          )}
                          {planet.features.radius && (
                            <div>
                              <span>Radius:</span>
                              <span className="ml-1 font-mono">
                                {planet.features.radius.toFixed(2)}R⊕
                              </span>
                            </div>
                          )}
                          {planet.features.orbital_period && (
                            <div>
                              <span>Period:</span>
                              <span className="ml-1 font-mono">
                                {planet.features.orbital_period.toFixed(1)}d
                              </span>
                            </div>
                          )}
                          {planet.features.stellar_flux && (
                            <div>
                              <span>Flux:</span>
                              <span className="ml-1 font-mono">
                                {planet.features.stellar_flux.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
