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
    const { selectedId } = useStore();

    // 이 행성이 선택되었으면 렌더 순서를 높여서 태양 앞에 표시
    const isSelected = selectedId === body.id;

    // 다른 행성이 선택되었으면 이 행성을 반투명하게
    const isOtherSelected = selectedId && selectedId !== body.id;

    return (
        <mesh renderOrder={isSelected ? 1 : (isOtherSelected ? -1 : 0)}>
            <sphereGeometry args={[renderRadius(body), 64, 64]} />
            <meshStandardMaterial
                map={tex}
                emissiveMap={isSelected && tex ? tex : undefined}
                color={isOtherSelected ? "#666666" : (hasTex ? "#ffffff" : body.color)}
                roughness={0.9}
                metalness={0}
                emissive={isOtherSelected ? "#000000" : (hasTex ? "#000000" : body.color)}
                emissiveIntensity={isSelected ? 0.8 : (isOtherSelected ? 0.0 : (hasTex ? 0.0 : 0.08))}
                depthTest={true}
                depthWrite={!isOtherSelected}
                transparent={!!isOtherSelected}
                opacity={isOtherSelected ? 0.3 : 1.0}
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
    const { setSelectedId, setFlyToTarget, setFollowRocket, selectedId } = useStore();

    // 행성이 선택되었고, 태양이 아닌 경우 태양을 반투명하게
    const isSunTransparent = !!(selectedId && selectedId !== SUN.id);

    return (
        <group
            onClick={(e) => {
                e.stopPropagation();
                // 같은 태양을 다시 클릭하면 카메라 이동하지 않음
                const currentSelectedId = useStore.getState().selectedId;
                if (currentSelectedId === SUN.id) return;

                setSelectedId(SUN.id);
                // 태양은 중심에 있으므로 적당한 거리에서 보기
                setFlyToTarget([0, 0, 4]);
                setFollowRocket(false);
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
            <mesh renderOrder={isSunTransparent ? -1 : 0}>
                <sphereGeometry args={[renderRadius(SUN), 64, 64]} />
                <meshBasicMaterial
                    map={sunTex}
                    color={sunTex ? "#ffffff" : SUN.color}
                    toneMapped={false}
                    transparent={true}
                    opacity={isSunTransparent ? 0.25 : 1.0}
                    depthWrite={!isSunTransparent}
                    depthTest={true}
                />
            </mesh>

            <pointLight intensity={4} distance={3000} decay={2} />
        </group>
    );
}

export default function SolarSystem({ timeScale = 60 }: { timeScale?: number }) {
    const planetRefs = useRef<Record<string, Group>>({});
    const { threshold, setSelectedId, setFlyToTarget, setBodyPositions, setFollowRocket } = useStore();

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

        // 태양 위치 추가 (중심에 고정)
        pos[SUN.id] = [0, 0, 0];

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
                        // 같은 행성을 다시 클릭하면 카메라 이동하지 않음
                        const currentSelectedId = useStore.getState().selectedId;
                        if (currentSelectedId === p.id) return;

                        setSelectedId(p.id);
                        const g = planetRefs.current[p.id];
                        if (!g) return;

                        // 행성 크기에 따라 카메라 거리 조정
                        const planetRadius = renderRadius(p);
                        const cameraDistance = planetRadius * 4.5; // 더 멀리

                        // 태양(0, 0, 0)에서 행성으로 향하는 방향 벡터 (정규화)
                        const dirX = g.position.x;
                        const dirZ = g.position.z;
                        const len = Math.hypot(dirX, dirZ) || 1;
                        const normalX = dirX / len;
                        const normalZ = dirZ / len;

                        // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
                        // 행성의 밝은 면을 정면에서 봄
                        const camX = g.position.x + normalX * cameraDistance;
                        const camY = g.position.y + cameraDistance * 0.15; // 약간 위에서
                        const camZ = g.position.z + normalZ * cameraDistance;

                        setFlyToTarget([camX, camY, camZ]);

                        // 로켓 추적 해제 (카메라가 행성으로 이동)
                        setFollowRocket(false);
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
