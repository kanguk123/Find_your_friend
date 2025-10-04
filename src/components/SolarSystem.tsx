"use client";

import { useMemo, useRef } from "react";
import { Group, Vector3, AdditiveBlending } from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useStore } from "@/state/useStore";
import { useSolarTextures } from "@/hooks/useSolarTextures";
import {
    SUN,
    PLANETS,
    ORBIT_SCALE,
    FLY_DISTANCE_FACTOR,
    type Body,
} from "@/data/solar";

const TAU = Math.PI * 2;

// ===== 렌더 스케일 정책 =====
const GLOBAL_PLANET_SCALE = 0.62;
function renderRadius(body: Body) {
    return body.id === "sun" ? body.radius : body.radius * GLOBAL_PLANET_SCALE;
}

function PlanetMesh({ body, texUrl }: { body: Body; texUrl?: string }) {
    const textures = useSolarTextures();
    const tex = texUrl ? textures.get(texUrl) : undefined;
    const hasTex = !!tex;

    return (
        <mesh>
            <sphereGeometry args={[renderRadius(body), 64, 64]} />
            <meshStandardMaterial
                map={tex}
                color={hasTex ? "#ffffff" : body.color}
                roughness={0.9}
                metalness={0}
                emissive={hasTex ? "#000000" : body.color}
                emissiveIntensity={hasTex ? 0.0 : 0.08}
            />
        </mesh>
    );
}

function SaturnRing({ body }: { body: Body }) {
    // ⛔️ 훅 조건부 호출 방지: 항상 최상단
    const textures = useSolarTextures();
    if (!body.ring) return null;

    const tex = body.ring.texture ? textures.get(body.ring.texture) : undefined;
    const r = renderRadius(body);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r * body.ring.inner, r * body.ring.outer, 96]} />
            <meshBasicMaterial
                map={tex}
                transparent
                alphaTest={0.3}
                premultipliedAlpha
                depthWrite={false}
                side={2}
            />
        </mesh>
    );
}

function SunCore() {
    const textures = useSolarTextures();
    const sunTex = SUN.texture ? textures.get(SUN.texture) : undefined;

    return (
        <group>
            <mesh>
                <sphereGeometry args={[renderRadius(SUN), 64, 64]} />
                <meshBasicMaterial map={sunTex} color={sunTex ? "#ffffff" : SUN.color} toneMapped={false} />
            </mesh>

            {false && (
                <sprite scale={[SUN.radius * 6, SUN.radius * 6, SUN.radius * 6]}>
                    <spriteMaterial
                        transparent
                        depthWrite={false}
                        blending={AdditiveBlending}
                        opacity={0.85}
                    />
                </sprite>
            )}

            <pointLight intensity={4} distance={3000} decay={2} />
        </group>
    );
}

export default function SolarSystem({ timeScale = 60 }: { timeScale?: number }) {
    const planetRefs = useRef<Record<string, Group>>({});
    const { threshold, setSelectedId, setFlyToTarget, setBodyPositions } = useStore();

    const cut = threshold / 100;

    // 행성 리스트는 고정
    const planets = useMemo(() => PLANETS, []);

    // 궤도선 정점 캐시
    const orbitPoints = useMemo(() => {
        const seg = 128;
        const map: Record<string, Vector3[]> = {};
        for (const p of planets) {
            const r = (p.orbitRadius ?? 0) * ORBIT_SCALE;
            const pts: Vector3[] = [];
            for (let i = 0; i <= seg; i++) {
                const a = (i / seg) * TAU;
                pts.push(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
            }
            map[p.id] = pts;
        }
        return map;
    }, [planets]);

    // 공전/자전 업데이트 + 위치 공유
    useFrame(() => {
        const now = Date.now();
        const pos: Record<string, [number, number, number]> = {};

        for (const p of planets) {
            const g = planetRefs.current[p.id];
            if (!g || !p.orbitRadius || !p.periodDays) continue;

            const seconds = now / 1000;
            const omega = timeScale === 0 ? 0 : TAU / (p.periodDays * 86400 / timeScale);
            const a = omega * seconds;
            const r = p.orbitRadius * ORBIT_SCALE;

            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            g.position.set(x, 0, z);
            g.rotation.y = -a;

            pos[p.id] = [x, 0, z];
        }
        setBodyPositions(pos);
    });

    return (
        <group>
            {/* 태양 */}
            <SunCore />

            {/* 궤도선 */}
            {planets.map((p) => (
                <Line
                    key={`${p.id}-orbit`}
                    points={orbitPoints[p.id]}
                    color="#7a7f87"
                    lineWidth={1}
                    transparent
                    opacity={p.score !== undefined && p.score < cut ? 0.1 : 0.45}
                />
            ))}

            {/* 행성들(항상 마운트) */}
            {planets.map((p) => (
                <group
                    key={p.id}
                    ref={(el) => {
                        if (el) planetRefs.current[p.id] = el;
                    }}
                    visible={p.score === undefined ? true : p.score >= cut}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(p.id);
                        const g = planetRefs.current[p.id];
                        if (!g) return;
                        const len = Math.hypot(g.position.x, g.position.y, g.position.z) || 1;
                        const f = len * (1 + FLY_DISTANCE_FACTOR);
                        setFlyToTarget([(g.position.x / len) * f, 0, (g.position.z / len) * f]);
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = "default";
                    }}
                >
                    <PlanetMesh body={p} texUrl={p.texture} />
                    {p.ring && <SaturnRing body={p} />}
                </group>
            ))}
        </group>
    );
}
