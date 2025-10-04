"use client";

import { useMemo } from "react";
import { useStore } from "@/state/useStore";
import { PLANETS } from "@/data/solar";

export default function ScoreSidebar() {
    const { threshold, setThreshold, planets } = useStore();

    const count = useMemo(() => {
        const cut = threshold / 100;

        // 태양계 행성 카운트
        const solarCount = PLANETS.filter((p) => (p.score ?? 0) >= cut).length;

        // 외계 행성 카운트
        const exoCount = planets.filter((p) => {
            // 외계 행성인지 확인 (ra, dec가 있으면 외계 행성)
            const isExoplanet = p.ra !== undefined && p.dec !== undefined;
            if (!isExoplanet) return false;
            return (p.score ?? 0) >= cut;
        }).length;

        return solarCount + exoCount;
    }, [threshold, planets]);

    const totalCount = useMemo(() => {
        return PLANETS.length + planets.filter(p => p.ra !== undefined && p.dec !== undefined).length;
    }, [planets]);

    return (
        <div className="pointer-events-auto w-full lg:w-64 bg-black/55 border border-white/15 rounded-xl p-2 sm:p-3 text-white backdrop-blur-sm">
            <div className="text-sm sm:text-base font-semibold">Score filter</div>
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
                Visible planets: {count} / {totalCount}
            </div>
        </div>
    );
}
