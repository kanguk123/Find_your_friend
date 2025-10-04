"use client";

import { useState, useEffect } from "react";
import { useStore, type Planet } from "@/state/useStore";

export default function PlanetListPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const {
    selectedId,
    setSelectedId,
    setFlyToTarget,
    threshold,
    showOnlyFavorites,
    favorites,
  } = useStore();

  // test.json에서 데이터 로드
  useEffect(() => {
    fetch("/test.json")
      .then((res) => res.json())
      .then((data) => {
        const planetData: Planet[] = data.planets.map((p: any) => ({
          id: p.id,
          name: p.name,
          ra: p.ra,
          dec: p.dec,
          score: p.score,
          teq: p.teq,
          features: p.features,
        }));
        setPlanets(planetData);
      })
      .catch((err) => {
        console.error("Failed to load planet data:", err);
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
    setSelectedId(planet.id);
    if (planet.ra && planet.dec) {
      // 구면 좌표를 직교 좌표로 변환
      const phi = (planet.ra * Math.PI) / 180;
      const theta = (planet.dec * Math.PI) / 180;
      const radius = 30;
      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta);
      const z = radius * Math.cos(theta) * Math.sin(phi);

      const len = Math.hypot(x, y, z) || 1;
      const n = [x / len, y / len, z / len];
      const dist = radius * 0.15;
      setFlyToTarget([n[0] * dist, n[1] * dist, n[2] * dist]);
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
        <div className="px-4 pb-4 max-h-80 overflow-y-auto">
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
              {filteredPlanets.map((planet) => (
                <div
                  key={planet.id}
                  onClick={() => handlePlanetClick(planet)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedId === planet.id
                      ? "bg-purple-500/20 border border-purple-400/50"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white text-sm">
                      {planet.name}
                    </h4>
                    {planet.score && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getScoreColor(planet.score) }}
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
                  </div>

                  {planet.features && (
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
