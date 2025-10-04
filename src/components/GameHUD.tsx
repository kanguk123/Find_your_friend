"use client";

import { useStore } from "@/state/useStore";

export default function GameHUD() {
    const { bumpReset } = useStore();

    return (
        <div className="pointer-events-none absolute left-3 bottom-3 z-50 text-white/90">
            <div className="pointer-events-auto flex gap-2">
                <button
                    onClick={() => bumpReset()}
                    className="px-3 py-1 rounded-lg bg-black/60 border border-white/15 hover:bg-white/10"
                >
                    Reset to Earth
                </button>
            </div>
            <div className="mt-2 text-xs opacity-80">
                WASD 이동, Space 부스터, Q/E 롤, ↑↓←→ 회전
            </div>
            <div className="text-xs opacity-70">
                기본 3인칭 추적 / 휠로 거리 조절 / 오른쪽 마우스 누르면 Orbit로 둘러보기
            </div>
        </div>
    );
}
