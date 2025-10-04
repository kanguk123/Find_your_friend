"use client";

import { useStore } from "@/state/useStore";

export default function ModeSwitch() {
    const { mode, setMode } = useStore();

    return (
        <div className="inline-flex rounded-lg bg-black/60 border border-white/15 p-0.5 sm:p-1 backdrop-blur-sm">
            <button
                onClick={() => setMode("player")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    mode === "player"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
                Player
            </button>
            <button
                onClick={() => setMode("expert")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    mode === "expert"
                        ? "bg-purple-500 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
                Expert
            </button>
        </div>
    );
}
