"use client";

import { Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, TextureLoader, BackSide } from "three";
import Link from "next/link";
import SolarSystem from "./SolarSystem";
import SolarSearchSidebar from "./SolarSearchSidebar";
import ScoreSidebar from "./ScoreSidebar";
import InfoPanel from "./InfoPanel";
import Rocket from "./Rocket";
import BlackHole from "./BlackHole";
import GameHUD from "./GameHUD";
import ModeSwitch from "./ModeSwitch";
import FavoriteFilter from "./FavoriteFilter";
import HyperparameterPanel from "./HyperparameterPanel";
import ModelAccuracy from "./ModelAccuracy";
import ExoplanetPoints from "./ExoplanetPoints";
import PlanetListPanel from "./PlanetListPanel";
import { useStore } from "@/state/useStore";

// 키 입력 상태는 useStore에서 관리

function Skybox() {
  const texture = useLoader(TextureLoader, "/textures/sky_custom.jpg");

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
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
    isCameraMoving,
    setIsCameraMoving,
    keysPressed,
  } = useStore();

  useFrame(() => {
    // Player 모드와 Expert 모드에서 WASD 키보드로 카메라 이동
    if ((mode === "player" || mode === "expert") && controls && !flyToTarget) {
      const moveSpeed = 0.05; // Expert 모드와 동일한 이동 속도
      const target = (controls as unknown as { target: Vector3 }).target;
      const cameraPos = camera.position;

      // Player 모드와 Expert 모드 모두에서 선택된 행성을 중심으로 카메라 이동
      let centerPoint = new Vector3(0, 0, 0); // 기본 중심점 (태양)
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];
        centerPoint.set(px, py, pz);
      }

      // 카메라에서 중심점으로의 방향 벡터
      const direction = new Vector3().subVectors(centerPoint, cameraPos);

      let shouldUpdate = false;

      // W/S: 앞뒤 이동
      if (keysPressed["w"] || keysPressed["arrowup"]) {
        direction.normalize().multiplyScalar(moveSpeed);
        camera.position.add(direction);
        target.add(direction);
        shouldUpdate = true;
      }
      if (keysPressed["s"] || keysPressed["arrowdown"]) {
        direction.normalize().multiplyScalar(-moveSpeed);
        camera.position.add(direction);
        target.add(direction);
        shouldUpdate = true;
      }

      // A/D: 좌우 이동
      if (keysPressed["a"] || keysPressed["arrowleft"]) {
        const up = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, up).normalize();
        right.multiplyScalar(moveSpeed);
        camera.position.add(right);
        target.add(right);
        shouldUpdate = true;
      }
      if (keysPressed["d"] || keysPressed["arrowright"]) {
        const up = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, up).normalize();
        right.multiplyScalar(-moveSpeed);
        camera.position.add(right);
        target.add(right);
        shouldUpdate = true;
      }

      // 키 입력이 있을 때만 컨트롤 업데이트
      if (shouldUpdate) {
        (controls as unknown as { update: () => void }).update();
      }
    }

    // flyToTarget이 없으면 리턴
    if (!flyToTarget) return;

    // 🔻 로켓 추적 중이면 fly-to 무시 (항상 로켓 시점 우선)
    // 단, 행성 클릭으로 인한 카메라 이동은 허용
    if (followRocket && !isCameraMoving) return;

    const cur = camera.position;
    const [tx, ty, tz] = flyToTarget;

    // 카메라 이동 (부드러운 이동을 위해 속도 조정)
    const moveSpeed = 0.05; // 0.08에서 0.05로 감소
    cur.x += (tx - cur.x) * moveSpeed;
    cur.y += (ty - cur.y) * moveSpeed;
    cur.z += (tz - cur.z) * moveSpeed;

    if ((mode === "player" || mode === "expert") && controls) {
      // Expert 모드: OrbitControls 타겟을 행성으로 설정
      const orbitControls = controls as unknown as {
        target: Vector3;
        update: () => void;
      };

      // 항상 선택된 행성 또는 태양을 바라봄
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];
        orbitControls.target.set(px, py, pz);
      } else {
        orbitControls.target.set(0, 0, 0);
      }

      orbitControls.update();

      // 도착 확인 (외계행성은 더 큰 임계값 사용)
      const distance = Math.hypot(cur.x - tx, cur.y - ty, cur.z - tz);
      const threshold = selectedId && bodyPositions[selectedId] ? 2.0 : 0.2; // 외계행성은 2.0, 태양계 행성은 0.2

      if (distance < threshold) {
        camera.position.set(tx, ty, tz);

        // 도착 후에도 OrbitControls target을 행성에 유지
        if (selectedId && bodyPositions[selectedId]) {
          const [px, py, pz] = bodyPositions[selectedId];
          orbitControls.target.set(px, py, pz);
        }

        orbitControls.update();
        setFlyToTarget(undefined);
        setIsCameraMoving(false);
        console.log(
          "Arrived at target (Expert mode):",
          selectedId,
          "distance:",
          distance
        );
      }
    }
  });
  return null;
}

export default function Scene() {
  const [autoRotate, setAutoRotate] = useState(true);
  const {
    mode,
    selectedId,
    setSelectedId,
    planets,
    setFlyToTarget,
    flyToTarget,
    bodyPositions,
    setKeysPressed,
  } = useStore();
  const selectedPlanet = planets.find((p) => p.id === selectedId);
  // 외계행성인지 확인 (ra, dec가 undefined이거나 null이면 태양계 행성)
  const isExoplanet =
    selectedPlanet &&
    selectedPlanet.ra !== undefined &&
    selectedPlanet.dec !== undefined;

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키로 카메라 고정 해제 (선택은 유지)
      if (e.key === "Escape") {
        setFlyToTarget(undefined);
        return;
      }

      // Player 모드에서 스페이스바로 선택 해제
      if (mode === "player" && e.code === "Space") {
        e.preventDefault();
        setSelectedId(undefined);
        setFlyToTarget(undefined);
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
        setKeysPressed(key, true);
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
        setKeysPressed(key, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setFlyToTarget, setSelectedId, setKeysPressed]);

  return (
    <div className="relative h-screen w-full">
      {/* 모드 전환 UI - 최상단 중앙 */}
      <div className="pointer-events-none absolute top-3 left-0 right-0 z-50 flex justify-center px-4">
        <div className="pointer-events-auto">
          <ModeSwitch />
        </div>
      </div>

      {/* 좌측 상단 - Search planets & Favorites */}
      <div
        className={`pointer-events-none absolute top-16 left-3 z-50 w-80 overflow-y-auto space-y-3 ${
          mode === "expert"
            ? "max-h-[calc(100vh-12rem)]" // Expert 모드에서는 더 작은 높이
            : "max-h-[calc(100vh-8rem)]" // Player 모드에서는 기본 높이
        }`}
      >
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

      {/* 우측 하단 - Planet 정보 (모든 모드에서 표시) */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-40 space-y-3">
        <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-3 backdrop-blur-sm">
          <InfoPanel />
        </div>
        {/* ESC 키 안내 - 카메라가 고정되었을 때만 표시 */}
        {flyToTarget && (
          <div className="pointer-events-none bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 backdrop-blur-sm text-white text-xs sm:text-sm text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded border border-white/30 font-mono text-[10px] sm:text-xs">
              ESC
            </kbd>{" "}
            to release camera
          </div>
        )}
      </div>

      {/* Expert 모드 전용 패널들 - 우측 상단 */}
      {mode === "expert" && (
        <div className="pointer-events-none absolute top-16 right-3 z-50 w-80 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <div className="pointer-events-auto">
            <HyperparameterPanel />
          </div>
          <div className="pointer-events-auto">
            <ModelAccuracy />
          </div>
        </div>
      )}

      {/* Player 모드 - Expert 패널들 + 게임 HUD */}
      {mode === "player" && (
        <>
          {/* Expert 패널들 - 우측 상단 */}
          <div className="pointer-events-none absolute top-16 right-3 z-50 w-80 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <div className="pointer-events-auto">
              <HyperparameterPanel />
            </div>
            <div className="pointer-events-auto">
              <ModelAccuracy />
            </div>
          </div>

          {/* 게임 HUD - 좌하단 */}
          <GameHUD />
        </>
      )}

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

        {/* 모든 모드에서 OrbitControls 사용 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.1}
          maxDistance={500}
          zoomSpeed={1.0}
          rotateSpeed={1.0}
          panSpeed={1.0}
          dampingFactor={0.02}
          enableDamping={false}
          autoRotate={false}
        />

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
