"use client";

import { useMemo, useState, useCallback } from "react";
import { useStore } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";

export default function FavoriteFilter() {
    const { showOnlyFavorites, setShowOnlyFavorites, favorites, bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket, toggleFavorite } = useStore();
    const [showList, setShowList] = useState(false);

    const allBodies = useMemo(() => [SUN, ...PLANETS], []);

    const favoriteList = useMemo(() => {
        return allBodies.filter(body => favorites.has(body.id));
    }, [favorites, allBodies]);

    const flyTo = useCallback((id: string) => {
        const currentSelectedId = useStore.getState().selectedId;
        if (currentSelectedId === id) {
            setShowList(false);
            return;
        }

        setSelectedId(id);
        const pos = bodyPositions[id];
        if (!pos) return;
        const [x, y, z] = pos;

        const body = allBodies.find(b => b.id === id);
        if (!body) return;

        const planetRadius = body.id === "sun" ? body.radius : body.radius * 0.62;
        const cameraDistance = planetRadius * 4.5;

        const len = Math.hypot(x, z) || 1;
        const normalX = x / len;
        const normalZ = z / len;

        const camX = x + normalX * cameraDistance;
        const camY = y + cameraDistance * 0.15;
        const camZ = z + normalZ * cameraDistance;

        setFlyToTarget([camX, camY, camZ]);
        setFollowRocket(false);
        setShowList(false);
    }, [bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket, allBodies]);

    const handleToggleFavorites = () => {
        const newState = !showOnlyFavorites;
        setShowOnlyFavorites(newState);
        if (newState && favorites.size > 0) {
            setShowList(true);
        } else {
            setShowList(false);
        }
    };

    return (
        <div className="pointer-events-auto w-full lg:w-72 bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 text-white backdrop-blur-sm">
            <button
                onClick={handleToggleFavorites}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all w-full justify-center ${
                    showOnlyFavorites
                        ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-400"
                        : "bg-black/60 border-white/15 text-white/70 hover:bg-white/10"
                }`}
            >
                <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${showOnlyFavorites ? "fill-yellow-400" : "fill-none"}`}
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
                <span className="text-xs sm:text-sm font-medium">
                    <span className="hidden sm:inline">{showOnlyFavorites ? "Showing Favorites" : "Show Favorites"}</span>
                    <span className="sm:hidden">{showOnlyFavorites ? "Favorites" : "★ Only"}</span>
                </span>
                {favorites.size > 0 && (
                    <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-white/10 rounded-full text-[10px] sm:text-xs">
                        {favorites.size}
                    </span>
                )}
            </button>

            {showOnlyFavorites && showList && favoriteList.length > 0 && (
                <div className="mt-2">
                    <div className="text-xs opacity-70 mb-2 px-2">Bookmarked planets ({favoriteList.length})</div>
                    <ul className="max-h-60 overflow-auto rounded-md border border-white/10 divide-y divide-white/10 bg-black/40">
                        {favoriteList.map((body) => (
                            <li
                                key={body.id}
                                className="px-3 py-2 cursor-pointer hover:bg-white/10 flex items-center justify-between group"
                                onClick={() => flyTo(body.id)}
                            >
                                <span className="text-sm">{body.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(body.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                                    title="Remove from favorites"
                                >
                                    <svg
                                        className="w-4 h-4 text-red-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showOnlyFavorites && favorites.size === 0 && (
                <div className="mt-2 text-xs text-white/50 text-center py-2">
                    No favorites yet. Click the star icon on planets to bookmark them.
                </div>
            )}
        </div>
    );
}
