"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/state/useStore";
import { sph2cart } from "@/utils/math";

export default function DebugHUD({ radius = 1.6 }: { radius?: number }) {
    const { planets, threshold, selectedId, flyToTarget } = useStore();
    const { camera } = useThree();
    const [fps, setFps] = useState(0);

    const cut = threshold / 100;
    const visible = useMemo(
        () => planets.filter(p => (p.score ?? 0) >= cut),
        [planets, cut]
    );

    // 카메라 기준 전면/후면 분류
    const frontBack = useMemo(() => {
        const cam = camera.position;
        let front = 0, back = 0;
        for (const p of visible) {
            const [x, y, z] = sph2cart(p.ra, p.dec, radius + 0.01);
            const dot = x*cam.x + y*cam.y + z*cam.z; // 카메라와 점의 내적
            if (dot > 0) front++; else back++;
        }
        return { front, back };
    }, [visible, camera.position, radius]);

    // 간단 FPS
    useEffect(() => {
        let frames = 0, t0 = performance.now(), raf = 0;
        const loop = () => {
            frames++;
            const t = performance.now();
            if (t - t0 >= 1000) {
                setFps(frames);
                frames = 0; t0 = t;
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="pointer-events-none fixed left-3 bottom-3 z-50 text-[11px] leading-tight text-white/85 bg-black/60 border border-white/15 rounded-lg px-2.5 py-2 backdrop-blur-sm">
            <div>FPS: {fps}</div>
            <div>planets: {planets.length} / visible: {visible.length}</div>
            <div>front: {frontBack.front} / back: {frontBack.back}</div>
            <div>threshold: {threshold}%</div>
            <div>selected: {selectedId ?? "-"}</div>
            <div>flyTo: {flyToTarget ? flyToTarget.map(n => n.toFixed(2)).join(", ") : "-"}</div>
        </div>
    );
}
