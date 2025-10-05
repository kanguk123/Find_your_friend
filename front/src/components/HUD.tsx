// src/components/HUD.tsx
"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Planet } from "@/types";
import { scoreToHSL } from "@/utils/math";

type Props = {
    planet?: Planet;
    position?: [number, number, number];
};

export default function HUD({ planet, position }: Props) {
    const scorePct = useMemo(
        () => Math.round(((planet?.score ?? 0) * 100)),
        [planet]
    );

    if (!planet || !position) return null;

    // 외계행성 여부 확인
    const isExoplanet = planet?.ra !== undefined && planet?.dec !== undefined;

    // 태양계 행성: 이름만 표시
    if (!isExoplanet) {
        return (
            <Html
                position={position}
                distanceFactor={8}
                transform
                occlude
                className="select-none"
            >
                <div className="backdrop-blur-sm bg-black/60 text-white rounded-xl p-3 shadow-xl border border-white/10">
                    <div className="text-lg font-semibold">{planet.name}</div>
                </div>
            </Html>
        );
    }

    // 외계행성: 전체 정보 표시
    return (
        <Html
            position={position}
            distanceFactor={8}
            transform
            occlude
            className="select-none"
        >
            <div className="backdrop-blur-sm bg-black/60 text-white rounded-xl p-3 w-56 shadow-xl border border-white/10">
                <div className="text-sm opacity-80">Selected Planet</div>
                <div className="text-lg font-semibold">{planet.name}</div>
                {planet.teq !== undefined && (
                    <div className="text-xs opacity-80 mt-1">Teq: {planet.teq} K</div>
                )}
                <div className="mt-2">
                    <div className="text-xs mb-1">AI Probability</div>
                    <div className="h-2 w-full bg-white/10 rounded">
                        <div
                            className="h-2 rounded"
                            style={{
                                width: `${scorePct}%`,
                                background: scoreToHSL(planet.score),
                            }}
                        />
                    </div>
                    <div className="text-right text-xs mt-1">{scorePct}%</div>
                </div>
            </div>
        </Html>
    );
}
