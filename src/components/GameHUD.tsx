"use client";

import { useStore } from "@/state/useStore";

export default function GameHUD() {
    const { bumpReset } = useStore();

    return (
        <div className="pointer-events-none absolute left-2 sm:left-3 bottom-2 sm:bottom-3 z-50 text-white/90 max-w-[calc(100vw-1rem)] sm:max-w-md">
            <div className="pointer-events-auto flex gap-2">
                <button
                    onClick={() => bumpReset()}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-black/60 border border-white/15 hover:bg-white/10 whitespace-nowrap"
                >
                    Reset to Earth
                </button>
            </div>
            <div className="mt-2 text-[10px] sm:text-xs opacity-80 hidden sm:block">
                WASD 이동, Space 부스터, Q/E 롤, ↑↓←→ 회전
            </div>
            <div className="text-[10px] sm:text-xs opacity-70 hidden sm:block">
                기본 3인칭 추적 / 휠로 거리 조절 / 오른쪽 마우스 누르면 Orbit로 둘러보기
            </div>
            <div className="mt-1 text-[10px] opacity-80 sm:hidden">
                Use controls to navigate
            </div>
        </div>
    );
}
