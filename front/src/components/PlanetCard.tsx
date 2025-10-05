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

  // 타입 안전한 속성 접근을 위한 헬퍼
  const getProp = <T,>(key: string, defaultValue?: T): T | undefined => {
    return (planet as Record<string, unknown>)[key] as T | undefined ?? defaultValue;
  };

  // 외계행성 ID 처리
  // API에서 온 데이터는 id가 숫자이고, store의 외계행성은 exo-{id} 형식
  const rawId = planet.id;
  const isExoplanet = typeof rawId === "number" && getProp<number>("ra") !== undefined;

  const planetId = isExoplanet ? `exo-${rawId}` : String(rawId);
  const isFavorite = favorites.has(planetId);

  // 태양계 행성: 이름만 표시 (외계행성과 동일한 UI 스타일)
  if (!isExoplanet) {
    return (
      <div className="fixed bottom-3 right-3 z-[100] pointer-events-auto">
        <div className="bg-black/90 border border-white/20 rounded-xl p-3 backdrop-blur-lg shadow-2xl w-80">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white mb-1 truncate">
                {getProp<string>("name") || String(rawId)}
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-wider">
                {mode === "expert" ? "Research Mode" : "Explorer Mode"}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
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
        </div>
      </div>
    );
  }

  // 외계행성: 전체 정보 표시
  return (
    <div className="fixed bottom-3 right-3 z-[100] pointer-events-auto">
      <div className="bg-black/90 border border-white/20 rounded-xl p-3 backdrop-blur-lg shadow-2xl w-80 max-h-[60vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-1 truncate">
              {`Planet ${getProp<number>("rowid") || rawId}`}
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

          {/* 3D 좌표 정보 */}
          {getProp<{ x: number; y: number; z: number }>("coordinates_3d") && (
            <div>
              <div className="text-xs text-white/50 mb-1">3D Coordinates</div>
              <div className="text-xs font-mono text-white">
                X: {(getProp<{ x: number; y: number; z: number }>("coordinates_3d")?.x || 0).toFixed(2)},
                Y: {(getProp<{ x: number; y: number; z: number }>("coordinates_3d")?.y || 0).toFixed(2)},
                Z: {(getProp<{ x: number; y: number; z: number }>("coordinates_3d")?.z || 0).toFixed(2)}
              </div>
            </div>
          )}

          {/* 거리 정보 */}
          {getProp<number>("distance") !== undefined && (getProp<number>("distance") || 0) > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-1">Distance</div>
              <div className="text-xs font-mono text-white">
                {(getProp<number>("distance") || 0).toFixed(2)} pc
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
        {mode === "expert" && getProp<Record<string, number | undefined>>("features") && Object.keys(getProp<Record<string, number | undefined>>("features") || {}).length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Features
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {Object.entries(getProp<Record<string, number | undefined>>("features") || {}).map(([_, value], index) => {
                // CSV의 컬럼명 순서대로 feature 이름 매핑 (ra부터 st_tmagerr2까지)
                const featureNames = [
                  "ra", "dec", "koi_period", "koi_period_err1", "koi_period_err2", "koi_time0bk", "koi_time0bk_err1", "koi_time0bk_err2",
                  "koi_time0", "koi_time0_err1", "koi_time0_err2", "koi_impact", "koi_impact_err1", "koi_impact_err2", "koi_duration",
                  "koi_duration_err1", "koi_duration_err2", "koi_depth", "koi_depth_err1", "koi_depth_err2", "koi_ror", "koi_ror_err1",
                  "koi_ror_err2", "koi_srho", "koi_srho_err1", "koi_srho_err2", "koi_sma", "koi_incl", "koi_teq", "koi_dor", "koi_dor_err1",
                  "koi_dor_err2", "koi_ldm_coeff2", "koi_ldm_coeff1", "koi_max_sngle_ev", "koi_max_mult_ev", "koi_model_snr", "koi_num_transits",
                  "koi_steff", "koi_steff_err1", "koi_steff_err2", "koi_slogg", "koi_slogg_err1", "koi_slogg_err2", "koi_smet", "koi_smet_err1",
                  "koi_smet_err2", "koi_srad", "koi_srad_err1", "koi_srad_err2", "koi_smass", "koi_smass_err1", "koi_smass_err2", "pl_rade",
                  "pl_radeerr1", "pl_radeerr2", "pl_radj", "pl_radjerr1", "pl_radjerr2", "pl_tranmid", "pl_tranmiderr1", "pl_tranmiderr2",
                  "pl_imppar", "pl_impparerr1", "pl_impparerr2", "pl_trandep", "pl_trandeperr1", "pl_trandeperr2", "pl_ratror", "pl_ratrorerr1",
                  "pl_ratrorerr2", "st_teff", "st_tefferr1", "st_tefferr2", "st_rad", "st_raderr1", "st_raderr2", "st_mass", "st_masserr1",
                  "st_masserr2", "st_met", "st_meterr1", "st_meterr2", "st_logg", "st_loggerr1", "st_loggerr2", "st_dens", "st_denserr1",
                  "st_denserr2", "pl_eqt", "st_teff.1", "st_tefferr1.1", "st_tefferr2.1", "st_logg.1", "st_loggerr1.1", "st_loggerr2.1",
                  "pl_trandurherr1", "pl_trandurherr2", "st_dist", "st_disterr1", "st_disterr2", "st_rad.1", "st_raderr1.1", "st_raderr2.1",
                  "pl_insol", "st_pmdec", "st_pmdecerr1", "st_pmdecerr2", "st_rad.2", "st_raderr1.2", "st_raderr2.2", "st_pmra", "st_pmraerr1",
                  "st_pmraerr2", "pl_orbper", "pl_orbpererr1", "pl_orbpererr2", "st_tmag", "st_tmagerr1", "st_tmagerr2"
                ];
                // feature_122 이후 제외 (index 120 이후)
                if (index >= 120) return null;
                const featureName = featureNames[index] || `feature_${index}`;
                return value !== undefined && value !== null && typeof value === "number" && (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-white/60 font-mono">{featureName}</span>
                    <span className="text-white/80">{value.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expert 모드: Feature Correlations */}
        {mode === "expert" && getProp<Array<{ feature1: string; feature2: string; correlation: number }>>("feature_correlations") && (getProp<Array<{ feature1: string; feature2: string; correlation: number }>>("feature_correlations") || []).length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Feature Correlations
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {(getProp<Array<{ feature1: string; feature2: string; correlation: number }>>("feature_correlations") || []).map((corr, idx: number) => (
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
