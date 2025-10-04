"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useStore } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";

type Item = { id: string; name: string };

export default function SolarSearchSidebar() {
    const catalog = useMemo<Item[]>(
        () => [{ id: SUN.id, name: SUN.name }, ...PLANETS.map(p => ({ id: p.id, name: p.name }))],
        []
    );

    const { bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket } = useStore();

    const [q, setQ] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const [focused, setFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const blurTimer = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const list = useMemo(() => {
        const s = q.trim().toLowerCase();
        const base = s
            ? catalog.filter(i => i.name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s))
            : catalog;
        return base.slice(0, 8);
    }, [catalog, q]);

    const showDropdown = showSuggestions && focused && list.length > 0;

    useEffect(() => { setActiveIdx(0); }, [q]);

    const flyTo = useCallback((id: string) => {
        setSelectedId(id);
        const pos = bodyPositions[id];
        if (!pos) return;
        const [x, y, z] = pos;
        const len = Math.hypot(x, y, z) || 1;
        const f = len * 1.35;
        // 카메라를 천체 바깥 쪽으로 이동
        setFlyToTarget([(x/len)*f, (y/len)*f, (z/len)*f]);
        // 🔻 로켓 추적 해제 → 로켓은 가만히, 카메라는 천체 보기 모드
        setFollowRocket(false);
    }, [bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket]);

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Escape") return setShowSuggestions(false);
        if (!list.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, list.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); flyTo(list[activeIdx].id); }
    };

    const handleBlur = () => {
        if (blurTimer.current) window.clearTimeout(blurTimer.current);
        blurTimer.current = window.setTimeout(() => setFocused(false), 120);
    };
    const handleFocus = () => {
        if (blurTimer.current) window.clearTimeout(blurTimer.current);
        setFocused(true);
    };

    const toggleSuggestions = () => {
        setShowSuggestions(v => {
            const next = !v;
            if (next) setTimeout(() => inputRef.current?.focus(), 0);
            return next;
        });
    };

    return (
        <div className="pointer-events-auto w-72 bg-black/60 border border-white/15 rounded-xl p-3 text-white backdrop-blur-sm">
            <div className="font-semibold mb-2">Search planets</div>

            <div className="relative">
                <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder='Try "Earth", "Mars", "Saturn" (↑/↓, Enter, Esc)'
                    className="w-full rounded-md bg-black/60 text-white px-3 py-2 outline-none border border-white/15"
                />

                <div className="mt-2 flex items-center justify-between text-xs">
                    <button
                        onClick={toggleSuggestions}
                        className="rounded bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20"
                    >
                        {showSuggestions ? "Hide suggestions" : "Show suggestions"}
                    </button>
                    <span className="opacity-60">{q ? `${list.length} match(es)` : "type to search"}</span>
                </div>

                {showDropdown && (
                    <ul
                        className="absolute left-0 right-0 mt-2 max-h-60 overflow-auto rounded-md border border-white/10 divide-y divide-white/10 bg-black/80 z-10"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {list.map((item, idx) => (
                            <li
                                key={item.id}
                                className={`px-3 py-2 cursor-pointer ${idx === activeIdx ? "bg-white/15" : "hover:bg-white/10"}`}
                                onMouseEnter={() => setActiveIdx(idx)}
                                onClick={() => flyTo(item.id)}
                            >
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
