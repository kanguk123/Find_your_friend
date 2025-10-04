"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Mesh } from "three";
import { Color } from "three";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import { useStore } from "@/state/useStore";
import type { Planet } from "@/types";
import { sph2cart, scoreToHSL } from "@/utils/math";

const SURFACE_OFFSET = 0.01;
const RING_SEGMENTS = 64;
const RING_ROT_SPEED = 1.2;
const RING_PULSE_SPEED = 0.004;
const RING_PULSE_RANGE = 0.05;

type Vec3 = [number, number, number];

export default function PlanetsPoints({ radius = 20 }: { radius?: number }) {
    const { planets, threshold, selectedId, setSelectedId, setFlyToTarget, showOnlyFavorites, favorites } = useStore();

    const dotRadius = Math.max(0.02, radius * 0.0014);     // 반경 비례 점 크기
    const ringInner = dotRadius * 1.6;
    const ringOuter = dotRadius * 2.6;

    const points = useMemo(() => {
        const cut = threshold / 100;
        const r = radius + SURFACE_OFFSET;
        return planets
            .filter((p) => {
                // 임계값 필터
                if ((p.score ?? 0) < cut) return false;
                // 즐겨찾기 필터
                if (showOnlyFavorites && !favorites.has(p.id)) return false;
                return true;
            })
            .map((p) => {
                const [x, y, z] = sph2cart(p.ra, p.dec, r);
                const color = new Color().setStyle(scoreToHSL(p.score)).getStyle();
                return { p, pos: [x, y, z] as Vec3, color };
            });
    }, [planets, threshold, radius, showOnlyFavorites, favorites]);

    const selectPlanet = useCallback(
        (p: Planet) => {
            const { setShowPlanetCard, setSelectedPlanetData } = useStore.getState();

            // 행성 선택 및 카드 표시
            setSelectedId(p.id);
            setShowPlanetCard(true);
            setSelectedPlanetData(p);

            // 카메라 거리는 반경 비례로 잡아줌 (법선 방향으로 0.19*radius 배)
            const ra = p.ra ?? 0;
            const dec = p.dec ?? 0;
            const [x, y, z] = sph2cart(ra, dec, radius + SURFACE_OFFSET);
            const len = Math.hypot(x, y, z) || 1;
            const n: Vec3 = [x / len, y / len, z / len];
            const dist = radius * 0.19 * 20 / 3.8; // 기존 체감과 비슷한 비율로 조정
            setFlyToTarget([n[0] * dist, n[1] * dist, n[2] * dist]);
        },
        [radius, setSelectedId, setFlyToTarget]
    );

    const [hover, setHover] = useState(false);
    useEffect(() => {
        document.body.style.cursor = hover ? "pointer" : "default";
        return () => { document.body.style.cursor = "default"; };
    }, [hover]);

    const ringRef = useRef<Mesh>(null!);
    const selPlanet = useMemo(() => planets.find((p) => p.id === selectedId), [planets, selectedId]);
    const selPos: Vec3 | undefined = useMemo(() => {
        if (!selPlanet) return undefined;
        const [x, y, z] = sph2cart(selPlanet.ra, selPlanet.dec, radius + SURFACE_OFFSET);
        return [x, y, z];
    }, [selPlanet, radius]);

    useFrame((_, dt) => {
        if (!ringRef.current) return;
        ringRef.current.rotation.z += dt * RING_ROT_SPEED;
        const s = 1 + Math.sin(performance.now() * RING_PULSE_SPEED) * RING_PULSE_RANGE;
        ringRef.current.scale.setScalar(s);
    });

    return (
        <>
            <Instances limit={points.length || 1} key={points.length}>
                <sphereGeometry args={[dotRadius, 16, 16]} />
                <meshBasicMaterial vertexColors toneMapped={false} />
                {points.map(({ p, pos, color }) => (
                    <Instance
                        key={p.id}
                        position={pos}
                        color={color}
                        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
                        onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
                        onPointerDown={(e) => { e.stopPropagation(); selectPlanet(p); }}
                        onClick={(e) => { e.stopPropagation(); selectPlanet(p); }}
                    />
                ))}
            </Instances>

            {selPos && (
                <mesh ref={ringRef} position={selPos}>
                    <ringGeometry args={[ringInner, ringOuter, RING_SEGMENTS]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
                </mesh>
            )}
        </>
    );
}
