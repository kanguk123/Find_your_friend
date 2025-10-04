"use client";

import { useStore, type Planet } from "@/state/useStore";
import { type PlanetData } from "@/services/api";

type Props = {
  planet: Planet;
  planetData?: PlanetData; // 서버에서 받아온 원본 데이터
  onClose: () => void;
};

export default function PlanetCard({ planet, planetData, onClose }: Props) {
  const { mode, favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.has(planet.id);

  // 외계행성인지 확인 (exo-로 시작하면 외계행성)
  const isExoplanet = planet.id.startsWith("exo-");

  return (
    <div className="fixed bottom-3 right-3 z-50 pointer-events-auto">
      <div className="bg-black/90 border border-white/20 rounded-xl p-3 backdrop-blur-lg shadow-2xl w-80 max-h-[60vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-1 truncate">
              {planet.name}
            </h2>
            <p className="text-xs text-white/50 uppercase tracking-wider">
              {mode === "expert" ? "Research Mode" : "Explorer Mode"}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => toggleFavorite(planet.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                className={`w-4 h-4 ${
                  isFavorite
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/50"
                }`}
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-4 h-4 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 확률 표시 */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-blue-400">
              {planet.score ? (planet.score * 100).toFixed(1) : "N/A"}
            </span>
            <span className="text-sm text-white/70">%</span>
          </div>
          <p className="text-xs text-white/60">
            {isExoplanet ? "AI 확률" : "외계 생명체 존재 가능성"}
          </p>
          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${(planet.score || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* 외계행성 disposition 정보 */}
        {isExoplanet && planetData && (
          <div className="mb-4">
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">
              Planet Type
            </div>
            <div
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                planetData.disposition === "CONFIRMED"
                  ? "bg-green-500/20 text-green-400 border border-green-400/30"
                  : planetData.disposition === "CANDIDATE"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
                  : "bg-red-500/20 text-red-400 border border-red-400/30"
              }`}
            >
              {planetData.disposition}
            </div>
          </div>
        )}

        {/* Expert 모드: 상세 피처 정보 */}
        {mode === "expert" && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              {isExoplanet ? "Planet Details" : "Feature Correlation"}
            </h3>
            {isExoplanet && planetData ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Radius</div>
                  <div className="text-sm font-semibold text-purple-400">
                    {planetData.r ? planetData.r.toFixed(2) : "N/A"} R⊕
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Mass</div>
                  <div className="text-sm font-semibold text-purple-400">
                    {planetData.m ? planetData.m.toFixed(2) : "N/A"} M⊕
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Period</div>
                  <div className="text-sm font-semibold text-purple-400">
                    {planetData.per ? planetData.per.toFixed(2) : "N/A"} days
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Flux</div>
                  <div className="text-sm font-semibold text-purple-400">
                    {planetData.flux ? planetData.flux.toFixed(2) : "N/A"}
                  </div>
                </div>
              </div>
            ) : planet.features ? (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(planet.features).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white/5 rounded-lg p-2 border border-white/10"
                  >
                    <div className="text-xs text-white/50 mb-1 capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm font-semibold text-purple-400">
                      {value !== undefined ? value.toFixed(2) : "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* 좌표 정보 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/50 mb-1">Right Ascension</div>
            <div className="text-xs font-mono text-white">
              {isExoplanet && planetData
                ? planetData.ra?.toFixed(2)
                : planet.ra?.toFixed(2)}
              °
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1">Declination</div>
            <div className="text-xs font-mono text-white">
              {isExoplanet && planetData
                ? planetData.dec?.toFixed(2)
                : planet.dec?.toFixed(2)}
              °
            </div>
          </div>
          {(isExoplanet && planetData?.teq) || planet.teq ? (
            <div className="col-span-2">
              <div className="text-xs text-white/50 mb-1">
                Equilibrium Temperature
              </div>
              <div className="text-xs font-mono text-white">
                {isExoplanet && planetData
                  ? planetData.teq?.toFixed(0)
                  : planet.teq?.toFixed(0)}{" "}
                K
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
