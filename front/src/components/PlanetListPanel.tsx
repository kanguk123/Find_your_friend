"use client";

import { useState, useEffect } from "react";
import { useStore, type Planet, type Vec3 } from "@/state/useStore";
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
    isCameraMoving,
    threshold,
    showOnlyFavorites,
    favorites,
    setPlanets: setStorePlanets,
    bodyPositions,
    setShowPlanetCard,
    setSelectedPlanetData,
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

    // 외계행성 데이터 로드 - 백엔드 API 사용 (500개)
    import("../services/api")
      .then(({ ApiService }) => ApiService.getPlanets(1, 500))
      .then((response) => {
        if (response.success && response.data) {
          const exoplanets: Planet[] = response.data.map((p: any) => ({
            id: `exo-${p.id}`, // ID 충돌 방지
            name: `Planet ${p.rowid}`,
            ra: p.ra,
            dec: p.dec,
            score: p.ai_probability, // AI 확률을 score로 사용
            disposition: p.disposition,
            coordinates_3d: p.coordinates_3d, // 3D 좌표 추가
            distance: p.distance, // 거리 데이터 추가
            features: {
              mass: 0, // 백엔드에서 제공되지 않음
              radius: p.r,
              orbital_period: 0, // 백엔드에서 제공되지 않음
              stellar_flux: 0, // 백엔드에서 제공되지 않음
            },
          }));

          console.log(`Loaded ${exoplanets.length} exoplanets from API`);

          // 태양계 행성과 외계행성 합치기
          const allPlanets = [...solarSystemPlanets, ...exoplanets];
          setPlanets(allPlanets);
          setStorePlanets(allPlanets); // store에도 업데이트
        } else {
          throw new Error("Invalid API response");
        }
      })
      .catch((err) => {
        console.error("Failed to load exoplanet data from API:", err);
        // 외계행성 로드 실패 시 태양계 행성만 표시
        setPlanets(solarSystemPlanets);
        setStorePlanets(solarSystemPlanets); // store에도 업데이트
      });
  }, [setStorePlanets]);

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
    // 태양계 행성인지 확인 (ra, dec가 undefined이거나 null이면 태양계 행성)
    const isSolarSystem = planet.ra === undefined || planet.dec === undefined;
    const clickHandler = isSolarSystem
      ? new SolarPlanetClickHandler()
      : new ExoplanetClickHandler();

    // 첫 번째 클릭: 행성 선택 (하이라이트)
    const currentSelectedId = useStore.getState().selectedId;
    console.log(
      "PlanetList click - currentSelectedId:",
      currentSelectedId,
      "planet.id:",
      planet.id
    );

    if (currentSelectedId !== planet.id) {
      console.log("PlanetList - First click: selecting planet only");
      clickHandler.handleClick(planet);

      // 외계행성인 경우에만 PlanetCard 표시
      if (!isSolarSystem) {
        setShowPlanetCard(true);
        const planetId = parseInt(planet.id.replace("exo-", ""));

        // API에서 상세 정보 가져오기
        import("../services/api")
          .then(({ ApiService }) => ApiService.getPlanetDetail(planetId))
          .then((response) => {
            if (response.success && response.data) {
              // API에서 받은 상세 정보를 PlanetCard에 전달
              setSelectedPlanetData(response.data);
            } else {
              // API 호출 실패 시 기본 데이터 사용
              const planetData = {
                id: planetId,
                rowid: planetId,
                kepler_name: planet.name,
                ra: planet.ra || 0,
                dec: planet.dec || 0,
                teq: planet.teq,
                disposition: (planet as any).disposition || "UNKNOWN",
                ai_probability: planet.score || 0,
                r: planet.features?.radius || 0,
                m: planet.features?.mass || 0,
                per: planet.features?.orbital_period || 0,
                flux: planet.features?.stellar_flux || 0,
                coordinates_3d: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
              };
              setSelectedPlanetData(planetData);
            }
          })
          .catch((error) => {
            console.error("Failed to fetch planet detail:", error);
            // 에러 발생 시 기본 데이터 사용
            const planetData = {
              id: planetId,
              rowid: planetId,
              kepler_name: planet.name,
              ra: planet.ra || 0,
              dec: planet.dec || 0,
              teq: planet.teq,
              disposition: (planet as any).disposition || "UNKNOWN",
              ai_probability: planet.score || 0,
              r: planet.features?.radius || 0,
              m: planet.features?.mass || 0,
              per: planet.features?.orbital_period || 0,
              flux: planet.features?.stellar_flux || 0,
              coordinates_3d: {
                x: 0,
                y: 0,
                z: 0,
              },
            };
            setSelectedPlanetData(planetData);
          });
      }

      return; // 첫 번째 클릭에서는 카메라 이동 없이 종료
    }

    // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
    console.log("PlanetList - Second click: camera movement");
    if (isCameraMoving) {
      console.log("PlanetList - Camera already moving, ignoring");
      // 이미 카메라가 이동 중이면 무시
      return;
    }

    console.log("PlanetList - Starting camera movement");

    // 태양계 행성인지 확인 (ra, dec가 undefined이거나 null이면 태양계 행성)
    if (planet.ra === undefined || planet.dec === undefined) {
      // 태양인 경우
      if (planet.id === SUN.id) {
        // 3D 오브젝트와 동일한 로직
        const { setFlyToTarget, setFollowRocket, setIsCameraMoving } =
          useStore.getState();

        setIsCameraMoving(true);
        // 태양은 중심에 있으므로 적당한 거리에서 보기
        setFlyToTarget([0, 0, 4]);
        setFollowRocket(false);
      } else {
        // 다른 태양계 행성의 경우 - 3D 오브젝트와 동일한 로직
        const planetPos = bodyPositions[planet.id];
        if (!planetPos) {
          console.warn("행성 위치를 찾을 수 없습니다:", planet.id);
          return;
        }

        const solarPlanet = PLANETS.find((p) => p.id === planet.id) || SUN;
        const planetRadius = solarPlanet.radius * 0.62; // GLOBAL_PLANET_SCALE 적용

        // 3D 오브젝트와 동일한 카메라 위치 계산
        const { setFlyToTarget, setFollowRocket, setIsCameraMoving, setRocketCameraMode, setRocketCameraTarget } =
          useStore.getState();

        setIsCameraMoving(true);

        // 로켓 카메라 모드로 전환
        setRocketCameraMode("planet_view");
        setRocketCameraTarget(planet.id);
        console.log("로켓 카메라 모드로 전환:", planet.name);

        const [planetX, planetY, planetZ] = planetPos;
        console.log("Planet actual position:", planetPos);

        // 행성 크기에 따라 카메라 거리 조정
        const cameraDistance = planetRadius * 4.5;

        // 태양을 기준으로 상대적 카메라 위치 계산
        const dirX = planetX;
        const dirZ = planetZ;
        const len = Math.hypot(dirX, dirZ) || 1;
        const normalX = dirX / len;
        const normalZ = dirZ / len;

        // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
        const camX = planetX + normalX * cameraDistance;
        const camY = planetY + cameraDistance * 0.15;
        const camZ = planetZ + normalZ * cameraDistance;

        console.log("Camera target position (relative to planet):", [
          camX,
          camY,
          camZ,
        ]);

        setFlyToTarget([camX, camY, camZ]);
        setFollowRocket(false);
      }
    } else {
      // 외계행성의 경우 - 3D 오브젝트와 동일한 로직
      // ra와 dec가 undefined 또는 null인지 확인 (0은 유효한 값)
      if (planet.ra === undefined || planet.ra === null ||
          planet.dec === undefined || planet.dec === null) {
        console.warn("외계행성 데이터가 불완전합니다:", planet);
        return;
      }

      // 외계행성 데이터가 유효한지 추가 검증
      if (
        typeof planet.ra !== "number" ||
        typeof planet.dec !== "number" ||
        isNaN(planet.ra) ||
        isNaN(planet.dec)
      ) {
        console.warn("외계행성 좌표 데이터가 유효하지 않습니다:", planet);
        return;
      }

      // 3D 오브젝트와 동일한 위치 계산
      const { setFlyToTarget, setIsCameraMoving, setRocketCameraMode, setRocketCameraTarget } =
        useStore.getState();

      setIsCameraMoving(true);

      // 로켓 카메라 모드로 전환
      setRocketCameraMode("planet_view");
      setRocketCameraTarget(planet.id);
      console.log("로켓 카메라 모드로 전환:", planet.name);

      // coordinates_3d가 있으면 그대로 사용, 없으면 ra/dec와 distance로 계산
      let x, y, z;
      const coords3d = (planet as any).coordinates_3d;
      const SURFACE_OFFSET = 0.1;
      const radius = 25;

      if (
        coords3d &&
        typeof coords3d.x === "number" &&
        typeof coords3d.y === "number" &&
        typeof coords3d.z === "number"
      ) {
        x = coords3d.x;
        y = coords3d.y;
        z = coords3d.z;
      } else {
        const distance = (planet as any).distance;
        const actualRadius = distance
          ? Math.max(50, Math.min(500, distance * 10))
          : radius + SURFACE_OFFSET;
        const phi = (planet.ra * Math.PI) / 180;
        const theta = (planet.dec * Math.PI) / 180;
        x = actualRadius * Math.cos(theta) * Math.cos(phi);
        y = actualRadius * Math.sin(theta);
        z = actualRadius * Math.cos(theta) * Math.sin(phi);
      }

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
        planet.name,
        "planet position:",
        [x, y, z],
        "camera target:",
        targetPos,
        "distance:",
        dist
      );

      // bodyPositions에 외계행성 위치 저장
      const currentPositions = useStore.getState().bodyPositions;
      const newPositions = {
        ...currentPositions,
        [planet.id]: [x, y, z] as Vec3,
      };
      useStore.getState().setBodyPositions(newPositions);

      // 즉시 bodyPositions 업데이트 후 카메라 이동
      useStore.setState({ bodyPositions: newPositions });
      setFlyToTarget(targetPos);
    }
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
                const isSolarSystem =
                  planet.ra === undefined || planet.dec === undefined;
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
                          {"disposition" in planet && planet.disposition && (
                            <div>
                              <span className="text-white/50">Type:</span>
                              <span
                                className={`ml-1 font-mono ${
                                  planet.disposition === "CONFIRMED"
                                    ? "text-green-400"
                                    : planet.disposition === "CANDIDATE"
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {planet.disposition}
                              </span>
                            </div>
                          )}
                          {planet.teq && (
                            <div>
                              <span className="text-white/50">Temp:</span>
                              <span className="ml-1 font-mono text-blue-400">
                                {planet.teq}K
                              </span>
                            </div>
                          )}
                          {planet.ra !== undefined && planet.dec !== undefined && (
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
