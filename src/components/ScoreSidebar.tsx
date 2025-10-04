"use client";

import { useMemo } from "react";
import { useStore } from "@/state/useStore";
import { PLANETS } from "@/data/solar";

export default function ScoreSidebar() {
    const { threshold, setThreshold } = useStore();

    const count = useMemo(() => {
        const cut = threshold / 100;
        return PLANETS.filter((p) => (p.score ?? 0) >= cut).length;
    }, [threshold]);

    return (
        <div className="pointer-events-auto w-64 bg-black/55 border border-white/15 rounded-xl p-3 text-white backdrop-blur-sm">
            <div className="font-semibold">Score filter</div>
            <div className="text-xs opacity-80 mb-2">Score ≥ {threshold}%</div>

            <input
                aria-label="Score threshold"
                type="range"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-white"
            />

            <div className="mt-2 text-xs opacity-80">
                Visible planets: {count} / {PLANETS.length}
            </div>
        </div>
    );
}
