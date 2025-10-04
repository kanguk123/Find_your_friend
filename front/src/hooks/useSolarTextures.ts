// src/hooks/useSolarTextures.ts
"use client";

import { useMemo } from "react";
import { SRGBColorSpace, Texture } from "three";
import { useTexture } from "@react-three/drei";
import { PLANETS, SUN } from "@/data/solar";

/** 모든 행성/태양 텍스처를 한 번에 프리로드해서 반환 */
export function useSolarTextures() {
    // drei useTexture는 내부적으로 캐시됨(Suspense 기반)
    const urls = useMemo(() => {
        const u = new Set<string>();
        if (SUN.texture) u.add(SUN.texture);
        for (const p of PLANETS) {
            if (p.texture) u.add(p.texture);
            if (p.ring?.texture) u.add(p.ring.texture);
        }
        return Array.from(u);
    }, []);

    // 빈 배열이면 useTexture가 에러라 최소 1개 보장
    const list = useTexture(urls.length ? urls : ["/__noop__.png"]) as Texture[] | Texture;

    // 단일/배열 타입 정규화
    const textures = Array.isArray(list) ? list : [list];

    // sRGB 보정
    textures.forEach((t) => {
        if (t && "colorSpace" in t) t.colorSpace = SRGBColorSpace;
    });

    // url -> Texture 매핑
    const byUrl = useMemo(() => {
        const map = new Map<string, Texture>();
        urls.forEach((u, i) => {
            const tex = textures[i];
            if (tex) map.set(u, tex);
        });
        return map;
    }, [urls, textures]);

    return byUrl;
}
