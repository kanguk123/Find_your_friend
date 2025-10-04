"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, TextureLoader, BackSide, DirectionalLight } from "three";
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
import ExoplanetPoints from "./ExoplanetPoints";
import PlanetListPanel from "./PlanetListPanel";
import { useStore } from "@/state/useStore";

// 키 입력 상태 관리
const keysPressed: Record<string, boolean> = {};

function Skybox() {
  const texture = useLoader(TextureLoader, "/textures/sky_custom.jpg");

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
}

function CameraLight() {
  const { camera } = useThree();
  const lightRef = useRef<DirectionalLight>(null);

  useFrame((state, delta) => {
    if (lightRef.current) {
      // 조명을 카메라 위치에 배치
      lightRef.current.position.copy(camera.position);
    }
  });

  return <directionalLight ref={lightRef} intensity={1.5} color="#ffffff" />;
}

function CameraRig() {
  const { camera, controls } = useThree();
  const {
    flyToTarget,
    setFlyToTarget,
    followRocket,
    mode,
    selectedId,
    bodyPositions,
  } = useStore();

  useFrame((state, delta) => {
    // Expert 모드에서 WASD 키보드로 카메라 시점 회전
    if (mode === "expert" && controls && !flyToTarget) {
      const rotateSpeed = 2 * delta;

      const target = (controls as any).target as Vector3;
      const cameraPos = camera.position;

      // 카메라에서 타겟으로의 방향 벡터
      const direction = new Vector3().subVectors(target, cameraPos);
      const distance = direction.length();

      let shouldUpdate = false;

      // W/S: 상하 회전 (pitch)
      if (keysPressed["w"] || keysPressed["arrowup"]) {
        const up = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, up).normalize();
        direction.applyAxisAngle(right, rotateSpeed);
        shouldUpdate = true;
      }
      if (keysPressed["s"] || keysPressed["arrowdown"]) {
        const up = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, up).normalize();
        direction.applyAxisAngle(right, -rotateSpeed);
        shouldUpdate = true;
      }

      // A/D: 좌우 회전 (yaw)
      if (keysPressed["a"] || keysPressed["arrowleft"]) {
        const up = new Vector3(0, 1, 0);
        direction.applyAxisAngle(up, rotateSpeed);
        shouldUpdate = true;
      }
      if (keysPressed["d"] || keysPressed["arrowright"]) {
        const up = new Vector3(0, 1, 0);
        direction.applyAxisAngle(up, -rotateSpeed);
        shouldUpdate = true;
      }

      // 키 입력이 있을 때만 타겟 업데이트
      if (shouldUpdate) {
        direction.normalize().multiplyScalar(distance);
        target.copy(cameraPos).add(direction);
        (controls as any).update();
      }
    }

    // 🔻 로켓 추적 중이면 fly-to 무시 (항상 로켓 시점 우선)
    if (followRocket) return;

    // flyToTarget이 없으면 리턴
    if (!flyToTarget) return;

    const cur = camera.position;
    const [tx, ty, tz] = flyToTarget;

    // 카메라 이동
    cur.x += (tx - cur.x) * 0.08;
    cur.y += (ty - cur.y) * 0.08;
    cur.z += (tz - cur.z) * 0.08;

    if (mode === "player") {
      // Player 모드: 선택된 행성을 바라봄
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];
        camera.lookAt(px, py, pz);
      } else {
        camera.lookAt(0, 0, 0);
      }

      // 도착 확인
      if (Math.hypot(cur.x - tx, cur.y - ty, cur.z - tz) < 0.01) {
        camera.position.set(tx, ty, tz);
        setFlyToTarget(undefined);
      }
    } else if (mode === "expert" && controls) {
      // Expert 모드: OrbitControls 타겟을 행성으로 설정
      const orbitControls = controls as any;

      // 항상 선택된 행성 또는 태양을 바라봄
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];
        orbitControls.target.set(px, py, pz);
      } else {
        orbitControls.target.set(0, 0, 0);
      }

      orbitControls.update();

      // 도착 확인
      const distance = Math.hypot(cur.x - tx, cur.y - ty, cur.z - tz);
      if (distance < 0.1) {
        camera.position.set(tx, ty, tz);

        // 도착 후에도 OrbitControls target을 행성에 유지
        if (selectedId && bodyPositions[selectedId]) {
          const [px, py, pz] = bodyPositions[selectedId];
          orbitControls.target.set(px, py, pz);
        }

        orbitControls.update();
        setFlyToTarget(undefined);
      }
    }
  });
  return null;
}

export default function Scene() {
  const [autoRotate, setAutoRotate] = useState(true);
  const { mode, selectedId, setSelectedId, planets, setFlyToTarget } =
    useStore();
  const selectedPlanet = planets.find((p) => p.id === selectedId);

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키로 선택 해제
      if (e.key === "Escape") {
        setFlyToTarget(undefined);
        setSelectedId(undefined);
        return;
      }

      // 카메라 이동 키
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        keysPressed[key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        keysPressed[key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setFlyToTarget, setSelectedId]);

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

      {/* 좌측 상단 - Search planets & Favorites */}
      <div className="pointer-events-none absolute top-16 left-3 z-50 w-80 space-y-3">
        <div className="pointer-events-auto relative z-50">
          <SolarSearchSidebar />
        </div>
        <div className="relative z-40">
          <FavoriteFilter />
        </div>
        <div className="pointer-events-auto relative z-30">
          <PlanetListPanel />
        </div>
      </div>

      {/* 상단 중앙 UI */}
      <div className="pointer-events-none absolute top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
        <div className="pointer-events-auto">
          <ScoreSidebar />
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

      {/* 좌측 하단 - Planet 정보 */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-50 space-y-3">
        <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-3 backdrop-blur-sm">
          <InfoPanel />
        </div>
        {/* ESC 키 안내 - 행성이 선택되었을 때만 표시 */}
        {selectedId && (
          <div className="pointer-events-none bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 backdrop-blur-sm text-white text-xs sm:text-sm text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded border border-white/30 font-mono text-[10px] sm:text-xs">
              ESC
            </kbd>{" "}
            to release camera
          </div>
        )}
      </div>

      {/* Expert 모드 전용 패널들 - 우측 하단 */}
      {mode === "expert" && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-50 w-80 space-y-3 max-h-[calc(100vh-1.5rem)] overflow-y-auto">
          <div className="pointer-events-auto">
            <HyperparameterPanel />
          </div>
          <div className="pointer-events-auto">
            <ModelAccuracy />
          </div>
        </div>
      )}

      {/* Player 모드 전용 - 좌하단 게임 HUD */}
      {mode === "player" && <GameHUD />}

      {/* Data Training 버튼 - 하단 중앙 */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 transform -translate-x-1/2 z-50">
        <div className="pointer-events-auto">
          <Link
            href="/training"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Data Training
          </Link>
        </div>
      </div>

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
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => e.preventDefault(),
            false
          );
        }}
      >
        <ambientLight intensity={0.06} />

        {/* Expert 모드에서는 OrbitControls 사용 */}
        {mode === "expert" && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.1}
            maxDistance={500}
            zoomSpeed={1.5}
          />
        )}

        <Suspense fallback={null}>
          <Skybox />
          <SolarSystem timeScale={autoRotate ? 60 : 0.0001} />

          {/* 외계행성 표시 - 태양계 바깥쪽 */}
          <ExoplanetPoints radius={30} />

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
