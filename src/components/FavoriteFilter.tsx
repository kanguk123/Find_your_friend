"use client";

import { useStore } from "@/state/useStore";

export default function FavoriteFilter() {
    const { showOnlyFavorites, setShowOnlyFavorites, favorites } = useStore();

    return (
        <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showOnlyFavorites
                    ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-400"
                    : "bg-black/60 border-white/15 text-white/70 hover:bg-white/10"
            }`}
        >
            <svg
                className={`w-5 h-5 ${showOnlyFavorites ? "fill-yellow-400" : "fill-none"}`}
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
            <span className="text-sm font-medium">
                {showOnlyFavorites ? "Showing Favorites" : "Show Favorites"}
            </span>
            {favorites.size > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                    {favorites.size}
                </span>
            )}
        </button>
    );
}
