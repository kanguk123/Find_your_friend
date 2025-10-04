"use client";

import { useMemo, useState, useCallback } from "react";
import { useStore } from "@/state/useStore";
import { selectAndFlyTo } from "@/utils/select";

export default function SearchBox({ globeRadius = 1.6 }: { globeRadius?: number }) {
    const { planets, setSelectedId, setFlyToTarget } = useStore();
    const [q, setQ] = useState("");

    const list = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s
            ? planets.filter((p) => [p.name, p.id].some(v => v.toLowerCase().includes(s))).slice(0, 5)
            : planets.slice(0, 5);
    }, [planets, q]);

    const go = useCallback((id: string) => {
        const p = planets.find((x) => x.id === id);
        if (!p) return;
        // 공용 함수로 선택 + fly-to
        selectAndFlyTo(p, globeRadius, (partial) => {
            if ("selectedId" in partial) setSelectedId(partial.selectedId);
            if ("flyToTarget" in partial) setFlyToTarget(partial.flyToTarget);
        });
    }, [planets, globeRadius, setSelectedId, setFlyToTarget]);

    return (
        <div className="relative">
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" && list[0]) ? go(list[0].id) : undefined}
                placeholder={`Try: "TRAPPIST-1e", "Kepler-186f", or "K2-18b"  (↑/↓, Enter)`}
                className="w-full rounded-xl bg-black/60 text-white px-3 py-2 outline-none border border-white/15 backdrop-blur-sm"
            />
            {q && list.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 rounded-xl bg-black/80 border border-white/15 text-white overflow-hidden z-10">
                    {list.map((p) => (
                        <li
                            key={p.id}
                            className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                            onMouseDown={() => go(p.id)}
                        >
                            {p.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
