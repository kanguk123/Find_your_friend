// src/utils/select.ts
import { sph2cart } from "@/utils/math";
import type { Planet } from "@/types";
import type { StateCreator } from "zustand";

// 공용 상수(카메라 거리 배율, 표면 오프셋)
export const SURFACE_OFFSET = 0.01;
export const FLY_MULTIPLIER = 3.8;

export function getFlyTarget(ra: number, dec: number, radius: number) {
    const [x, y, z] = sph2cart(ra, dec, radius + SURFACE_OFFSET);
    const len = Math.hypot(x, y, z) || 1;
    return [ (x/len)*FLY_MULTIPLIER, (y/len)*FLY_MULTIPLIER, (z/len)*FLY_MULTIPLIER ] as [number, number, number];
}

/**
 * 행성 선택 + 카메라 fly-to
 * @param p       Planet
 * @param radius  globe radius (e.g., 1.6)
 * @param set     Zustand set fn: set({ selectedId, flyToTarget })
 */
export function selectAndFlyTo(
    p: Planet,
    radius: number,
    set: (partial: Partial<{ selectedId?: string; flyToTarget?: [number, number, number] }>) => void
) {
    set({ selectedId: p.id, flyToTarget: getFlyTarget(p.ra, p.dec, radius) });
}
