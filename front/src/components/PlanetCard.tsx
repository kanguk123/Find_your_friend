"use client";

import { useStore, type Planet } from "@/state/useStore";

type Props = {
    planet: Planet;
    onClose: () => void;
};

export default function PlanetCard({ planet, onClose }: Props) {
    const { mode, favorites, toggleFavorite, setFlyToTarget, bodyPositions } = useStore();
    const isFavorite = favorites.has(planet.id);

    const handleFlyTo = () => {
        const pos = bodyPositions[planet.id];
        if (pos) {
            // 행성 위치에서 약간 떨어진 카메라 위치 설정
            const [x, y, z] = pos;
            const distance = 2;
            const cameraPos: [number, number, number] = [
                x + distance,
                y + distance * 0.5,
                z + distance,
            ];
            setFlyToTarget(cameraPos);
        }
    };

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto px-4 max-w-full">
            <div className="bg-black/90 border border-white/20 rounded-2xl p-4 sm:p-6 backdrop-blur-lg shadow-2xl w-full sm:w-96 max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 truncate">{planet.name}</h2>
                        <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                            {mode === "expert" ? "Research Mode" : "Explorer Mode"}
                        </p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={() => toggleFavorite(planet.id)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                            <svg
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                    isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/50"
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
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 확률 표시 */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-blue-400">
                            {planet.score ? (planet.score * 100).toFixed(1) : "N/A"}
                        </span>
                        <span className="text-lg text-white/70">%</span>
                    </div>
                    <p className="text-sm text-white/60">외계 생명체 존재 가능성</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${(planet.score || 0) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Expert 모드: 상세 피처 정보 */}
                {mode === "expert" && planet.features && (
                    <div className="mb-6 space-y-3">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                            Feature Correlation
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(planet.features).map(([key, value]) => (
                                <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                    <div className="text-xs text-white/50 mb-1 capitalize">
                                        {key.replace(/_/g, " ")}
                                    </div>
                                    <div className="text-lg font-semibold text-purple-400">
                                        {value !== undefined ? value.toFixed(2) : "N/A"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 좌표 정보 */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-white/50 mb-1">Right Ascension</div>
                        <div className="text-sm font-mono text-white">{planet.ra?.toFixed(2)}°</div>
                    </div>
                    <div>
                        <div className="text-xs text-white/50 mb-1">Declination</div>
                        <div className="text-sm font-mono text-white">{planet.dec?.toFixed(2)}°</div>
                    </div>
                    {planet.teq && (
                        <div className="col-span-2">
                            <div className="text-xs text-white/50 mb-1">Equilibrium Temperature</div>
                            <div className="text-sm font-mono text-white">{planet.teq.toFixed(0)} K</div>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                <button
                    onClick={handleFlyTo}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                    Fly to Planet
                </button>
            </div>
        </div>
    );
}
