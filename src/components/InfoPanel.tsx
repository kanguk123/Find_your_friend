"use client";

import { useMemo } from "react";
import { useStore } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";

export default function InfoPanel() {
    const { selectedId } = useStore();
    const all = [SUN, ...PLANETS];
    const b = useMemo(() => all.find((x) => x.id === selectedId), [selectedId]);

    if (!b) {
        return (
            <div className="w-full sm:w-64 lg:w-72 text-white/80 text-xs sm:text-sm">
                <div className="opacity-70">Click a planet to inspect.</div>
            </div>
        );
    }

    return (
        <div className="w-full sm:w-64 lg:w-72 text-white">
            <div className="text-xs opacity-70">SELECTED</div>
            <div className="text-base sm:text-lg font-semibold">{b.name}</div>

            {"periodDays" in b && b.periodDays ? (
                <>
                    <div className="mt-1 text-xs opacity-70">Orbital period</div>
                    <div className="text-sm">{b.periodDays.toLocaleString()} days</div>
                </>
            ) : (
                <>
                    <div className="mt-1 text-xs opacity-70">Star</div>
                    <div className="text-sm">G-type main-sequence</div>
                </>
            )}

            <div className="mt-1 text-xs opacity-70">Radius (scene)</div>
            <div className="text-sm">{b.radius}</div>

            {"orbitRadius" in b && b.orbitRadius && (
                <>
                    <div className="mt-1 text-xs opacity-70">Orbit radius</div>
                    <div className="text-sm">{b.orbitRadius} AU</div>
                </>
            )}
        </div>
    );
}
