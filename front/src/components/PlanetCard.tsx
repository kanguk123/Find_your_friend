"use client";

import { useStore, type Planet } from "@/state/useStore";

type Props = {
  planet: any; // Planet | PlanetData 모두 허용
  onClose: () => void;
};

export default function PlanetCard({ planet, onClose }: Props) {
  const { mode, favorites, toggleFavorite } = useStore();

  if (!planet) return null;

  const planetId = String(planet.id);
  const isFavorite = favorites.has(planetId);

  // 외계행성인지 확인 (exo- 또는 planet-로 시작하면 외계행성)
  const isExoplanet = planetId.startsWith("exo-") || planetId.startsWith("planet-");

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
              {planet.ai_probability !== undefined
                ? (planet.ai_probability * 100).toFixed(1)
                : planet.score !== undefined
                ? (planet.score * 100).toFixed(1)
                : "N/A"}
            </span>
            <span className="text-sm text-white/70">%</span>
          </div>
          <p className="text-xs text-white/60">
            {planet.ai_probability !== undefined ? "AI Probability" : "Habitability Score"}
          </p>
          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{
                width: `${planet.ai_probability !== undefined ? (planet.ai_probability * 100) : (planet.score || 0) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Disposition (외계행성용) */}
        {planet.disposition && (
          <div className="mb-4">
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider">
              Status
            </div>
            <div
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                planet.disposition === "CONFIRMED"
                  ? "bg-green-500/20 text-green-400 border border-green-400/30"
                  : planet.disposition === "CANDIDATE"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
                  : "bg-red-500/20 text-red-400 border border-red-400/30"
              }`}
            >
              {planet.disposition}
            </div>
          </div>
        )}

        {/* 좌표 정보 */}
        <div className="mb-4 space-y-3">
          {planet.ra !== undefined && planet.dec !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-white/50 mb-1">Right Ascension</div>
                <div className="text-xs font-mono text-white">
                  {planet.ra.toFixed(2)}°
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Declination</div>
                <div className="text-xs font-mono text-white">
                  {planet.dec.toFixed(2)}°
                </div>
              </div>
            </div>
          )}

          {planet.teq !== undefined && (
            <div>
              <div className="text-xs text-white/50 mb-1">
                Equilibrium Temperature
              </div>
              <div className="text-xs font-mono text-white">
                {planet.teq.toFixed(0)} K
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
      </div>
    </div>
  );
}
