"use client";

import { Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Link from "next/link";
import SolarSystem from "./SolarSystem";
import SolarSearchSidebar from "./SolarSearchSidebar";
import ScoreSidebar from "./ScoreSidebar";
import InfoPanel from "./InfoPanel";
import Rocket from "./Rocket";
import BlackHole from "./BlackHole";
import GameHUD from "./GameHUD";
import GlobeBase from "./GlobeBase";
import PlanetsPoints from "./PlanetsPoints";
import ModeSwitch from "./ModeSwitch";
import PlanetCard from "./PlanetCard";
import FavoriteFilter from "./FavoriteFilter";
import CSVUploader from "./CSVUploader";
import HyperparameterPanel from "./HyperparameterPanel";
import ModelAccuracy from "./ModelAccuracy";
import ExoplanetLoader from "./ExoplanetLoader";
import { useStore } from "@/state/useStore";

function CameraRig() {
    const { camera } = useThree();
    const { flyToTarget, setFlyToTarget, followRocket, mode } = useStore();

    useFrame(() => {
        // 🔻 Expert 모드에서는 fly-to 무시 (OrbitControls 사용)
        if (mode === "expert") return;

        // 🔻 로켓 추적 중이면 fly-to 무시 (항상 로켓 시점 우선)
        if (!flyToTarget || followRocket) return;

        const cur = camera.position;
        const [tx, ty, tz] = flyToTarget;
        cur.x += (tx - cur.x) * 0.08;
        cur.y += (ty - cur.y) * 0.08;
        cur.z += (tz - cur.z) * 0.08;
        camera.lookAt(0, 0, 0);

        if (Math.hypot(cur.x - tx, cur.y - ty, cur.z - tz) < 0.01) {
            camera.position.set(tx, ty, tz);
            setFlyToTarget(undefined); // 도착 후 유지(자유시점)
        }
    });
    return null;
}

export default function Scene() {
    const [autoRotate, setAutoRotate] = useState(true);
    const { mode, selectedId, setSelectedId, planets } = useStore();
    const selectedPlanet = planets.find((p) => p.id === selectedId);

    return (
        <div className="relative h-screen w-full">
            {/* 샘플 데이터 로더 */}
            <ExoplanetLoader />

            {/* 모드 전환 UI - 최상단 중앙 */}
            <div className="pointer-events-none absolute top-3 left-0 right-0 z-50 flex justify-center px-4">
                <div className="pointer-events-auto">
                    <ModeSwitch />
                </div>
            </div>

            {/* 상단 UI */}
            <div className="pointer-events-none absolute top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
                <div className="pointer-events-auto max-w-6xl w-full flex items-start gap-4">
                    <div className="w-[28rem]">
                        <SolarSearchSidebar />
                    </div>
                    <div className="w-[24rem]">
                        <ScoreSidebar />
                    </div>
                    <div className="flex-1 flex justify-end">
                        <FavoriteFilter />
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    <button
                        onClick={() => setAutoRotate((v) => !v)}
                        className="px-3 py-1.5 rounded-lg bg-black/60 text-white border border-white/15 hover:bg-white/10"
                        aria-pressed={autoRotate}
                        title="Toggle auto-rotate"
                    >
                        {autoRotate ? "Auto-rotate" : "Auto-rotate (paused)"}
                    </button>
                </div>
            </div>

            {/* 우측 상단 HUD */}
            <div className="pointer-events-none absolute top-3 right-3 z-50 space-y-3">
                <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-3 backdrop-blur-sm">
                    <InfoPanel />
                </div>
            </div>

            {/* Expert 모드 전용 패널들 */}
            {mode === "expert" && (
                <>
                    {/* 좌측 Expert 패널 */}
                    <div className="pointer-events-none absolute top-3 left-3 z-50 w-80 space-y-3">
                        <div className="pointer-events-auto">
                            <CSVUploader />
                        </div>
                        <div className="pointer-events-auto">
                            <HyperparameterPanel />
                        </div>
                        <div className="pointer-events-auto">
                            <ModelAccuracy />
                        </div>
                        <div className="pointer-events-auto">
                            <Link
                                href="/training"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Data Training
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* Player 모드 전용 - 좌하단 게임 HUD */}
            {mode === "player" && <GameHUD />}

            {/* 행성 카드 (선택된 행성이 있을 때) */}
            {selectedPlanet && (
                <PlanetCard
                    planet={selectedPlanet}
                    onClose={() => setSelectedId(undefined)}
                />
            )}

            {/* 3D */}
            <Canvas
                camera={{ position: [0, 0, 4.2], fov: 55 }}
                dpr={[1, 2]}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
                }}
            >
                <color attach="background" args={["#000"]} />
                <ambientLight intensity={0.06} />

                {/* Expert 모드에서는 OrbitControls 사용 */}
                {mode === "expert" && (
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={2}
                        maxDistance={100}
                    />
                )}

                <Suspense fallback={null}>
                    <SolarSystem timeScale={autoRotate ? 60 : 0.0001} />

                    {/* 외계행성 표시 */}
                    <group position={[-15, 0, 0]}>
                        <GlobeBase />
                        <PlanetsPoints radius={1.6} />
                    </group>

                    {/* 로켓은 Player 모드에서만 표시 */}
                    {mode === "player" && <Rocket />}
                    <BlackHole pos={[6, 0, 0]} />
                </Suspense>

                {/* 행성 보기(flyTo) 전용 리그 (Player 모드에서만 작동) */}
                <CameraRig />
            </Canvas>
        </div>
    );
}
