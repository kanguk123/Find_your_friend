"use client";

import { useStore } from "@/state/useStore";

export default function GameHUD() {
    const { bumpReset } = useStore();

    return (
        <div className="pointer-events-none absolute left-2 sm:left-3 bottom-2 sm:bottom-3 z-50 text-white/90 max-w-[calc(100vw-1rem)] sm:max-w-md">


        </div>
    );
}
