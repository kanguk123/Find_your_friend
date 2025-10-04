"use client";

import { useEffect } from "react";
import { useStore } from "@/state/useStore";
import { SAMPLE_EXOPLANETS } from "@/data/exoplanets";

/**
 * 앱 시작 시 샘플 외계행성 데이터를 로드하는 컴포넌트
 */
export default function ExoplanetLoader() {
    const { planets, setPlanets } = useStore();

    useEffect(() => {
        // planets가 비어있을 때만 샘플 데이터 로드
        if (planets.length === 0) {
            setPlanets(SAMPLE_EXOPLANETS);
        }
    }, [planets.length, setPlanets]);

    return null;
}
