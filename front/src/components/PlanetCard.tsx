"use client";

import { useStore } from "@/state/useStore";
import type { PlanetDetail } from "@/services/api";

type Props = {
  planet: PlanetDetail | Record<string, unknown>; // PlanetDetail 또는 기타 행성 데이터
  onClose: () => void;
};

export default function PlanetCard({ planet, onClose }: Props) {
  const { mode, favorites, toggleFavorite } = useStore();

  if (!planet) return null;

  const planetId = String(planet.id);
  const isFavorite = favorites.has(planetId);

  // 타입 안전한 속성 접근을 위한 헬퍼
  const getProp = <T,>(key: string, defaultValue?: T): T | undefined => {
    return (planet as Record<string, unknown>)[key] as T | undefined ?? defaultValue;
  };

  return (
    <div className="fixed bottom-3 right-3 z-[100] pointer-events-auto">
      <div className="bg-black/90 border border-white/20 rounded-xl p-3 backdrop-blur-lg shadow-2xl w-80 max-h-[60vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-1 truncate">
              {getProp<string>("name", "Unknown")}
            </h2>
            <p className="text-xs text-white/50 uppercase tracking-wider">
              {mode === "expert" ? "Research Mode" : "Explorer Mode"}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => toggleFavorite(planetId)}
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
              {getProp<number>("ai_probability") !== undefined
                ? ((getProp<number>("ai_probability") || 0) * 100).toFixed(1)
                : getProp<number>("score") !== undefined
                ? ((getProp<number>("score") || 0) * 100).toFixed(1)
                : "N/A"}
            </span>
            <span className="text-sm text-white/70">%</span>
          </div>
          <p className="text-xs text-white/60">
            {getProp<number>("ai_probability") !== undefined ? "AI Probability" : "Habitability Score"}
          </p>
          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{
                width: `${getProp<number>("ai_probability") !== undefined ? ((getProp<number>("ai_probability") || 0) * 100) : (getProp<number>("score") || 0) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Disposition (외계행성용) */}
        {getProp<string>("disposition") && (
          <div className="mb-4">
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">
              Status
            </div>
            <div
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                getProp<string>("disposition") === "CONFIRMED"
                  ? "bg-green-500/20 text-green-400 border border-green-400/30"
                  : getProp<string>("disposition") === "CANDIDATE"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
                  : "bg-red-500/20 text-red-400 border border-red-400/30"
              }`}
            >
              {getProp<string>("disposition")}
            </div>
          </div>
        )}

        {/* 좌표 정보 */}
        <div className="mb-4 space-y-3">
          {getProp<number>("ra") !== undefined && getProp<number>("dec") !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Right Ascension</div>
                <div className="text-xs font-mono text-white">
                  {(getProp<number>("ra") || 0).toFixed(2)}°
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Declination</div>
                <div className="text-xs font-mono text-white">
                  {(getProp<number>("dec") || 0).toFixed(2)}°
                </div>
              </div>
            </div>
          )}

          {getProp<number>("teq") !== undefined && (
            <div>
              <div className="text-xs text-white/50 mb-1">
                Equilibrium Temperature
              </div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("teq") || 0).toFixed(0)} K
              </div>
            </div>
          )}

          {/* API 데이터 필드들 */}
          {getProp<number>("r") !== undefined && (getProp<number>("r") || 0) > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Radius</div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("r") || 0).toFixed(2)} R⊕
              </div>
            </div>
          )}

          {getProp<number>("m") !== undefined && (getProp<number>("m") || 0) > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Mass</div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("m") || 0).toFixed(2)} M⊕
              </div>
            </div>
          )}

          {getProp<number>("per") !== undefined && (getProp<number>("per") || 0) > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Orbital Period</div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("per") || 0).toFixed(1)} days
              </div>
            </div>
          )}

          {getProp<number>("flux") !== undefined && (getProp<number>("flux") || 0) > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Stellar Flux</div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("flux") || 0).toFixed(2)} S⊕
              </div>
            </div>
          )}
        </div>

        {/* Expert 모드: Features */}
        {mode === "expert" && planet.features && Object.keys(planet.features).length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Features
            </h3>
            <div className="space-y-1">
              {Object.entries(planet.features).map(([key, value]) => (
                value !== undefined && (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{key}</span>
                    <span className="text-white/80">{value.toFixed(3)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Expert 모드: Feature Correlations */}
        {mode === "expert" && planet.feature_correlations && planet.feature_correlations.length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Feature Correlations
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {planet.feature_correlations.map((corr: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                  <span className="text-white/60 flex-1 truncate">
                    {corr.feature1} ↔ {corr.feature2}
                  </span>
                  <span
                    className={`font-mono ml-2 ${
                      Math.abs(corr.correlation) > 0.7
                        ? 'text-red-400'
                        : Math.abs(corr.correlation) > 0.4
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {corr.correlation.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
