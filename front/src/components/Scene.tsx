"use client";

import { Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, TextureLoader, BackSide } from "three";
import Link from "next/link";
import SolarSystem from "./SolarSystem";
import SolarSearchSidebar from "./SolarSearchSidebar";
import ScoreSidebar from "./ScoreSidebar";
import Rocket from "./Rocket";
import GameHUD from "./GameHUD";
import ModeSwitch from "./ModeSwitch";
import FavoriteFilter from "./FavoriteFilter";
import HyperparameterPanel from "./HyperparameterPanel";
import ModelAccuracy from "./ModelAccuracy";
import ExoplanetPoints from "./ExoplanetPoints";
import PlanetListPanel from "./PlanetListPanel";
import PlanetCard from "./PlanetCard";
import { FloatingTextManager } from "./FloatingCoinText";
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
  const { camera, controls, gl } = useThree();
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
    cameraPosition,
    setCameraPosition,
  } = useStore();

  useEffect(() => {
    if (controls) {
      const onStart = () => {
        // flyToTarget이 활성화된 상태에서 사용자가 카메라를 조작하면 fly-to를 중단합니다.
        if (useStore.getState().flyToTarget) {
          useStore.getState().setFlyToTarget(undefined);
          useStore.getState().setIsCameraMoving(false);
        }
      };

      const orbitControls = controls as {
        addEventListener: (event: string, callback: () => void) => void;
        removeEventListener: (event: string, callback: () => void) => void;
      };
      orbitControls.addEventListener("start", onStart);
      return () => {
        orbitControls.removeEventListener("start", onStart);
      };
    }
  }, [controls]);

  useFrame(() => {
    // 디버그: keysPressed 상태 확인
    const currentKeysPressed = useStore.getState().keysPressed;
    const anyKey = Object.values(currentKeysPressed).some(v => v);
    if (anyKey && mode === "expert") {
      console.log("useFrame - keysPressed:", currentKeysPressed);
    }

    // 카메라 위치 직접 설정 (초기화)
    if (cameraPosition) {
      const [x, y, z] = cameraPosition;
      camera.position.set(x, y, z);
      if (controls) {
        const orbitControls = controls as unknown as {
          target: Vector3;
          update: () => void;
        };
        orbitControls.target.set(0, 0, 0);
        orbitControls.update();
      }
      setCameraPosition(undefined); // 한 번만 적용
      console.log("Camera position set to:", cameraPosition);
    }

    // Player 모드와 Expert 모드에서 카메라 제어
    // Expert 모드에서는 flyToTarget이 있어도 키보드 이동 허용
    if (
      (mode === "player" || mode === "expert") &&
      controls &&
      (mode === "expert" || !flyToTarget)
    ) {
      const orbitControls = controls as unknown as {
        target: Vector3;
        update: () => void;
      };
      const target = orbitControls.target;
      const cameraPos = camera.position;

      // 중심점 설정 (선택된 행성 또는 태양)
      const centerPoint = new Vector3(0, 0, 0);
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];
        centerPoint.set(px, py, pz);
      }

      // 키보드 입력에 따른 카메라/타겟 이동 플래그
      const moveSpeed = 0.5; // 이동 속도

      // input이 포커스되어 있으면 키보드 입력 무시
      const isInputFocused = document.body.dataset.inputFocused === 'true';

      // useFrame 내부에서는 최신 상태를 직접 가져와야 함
      const currentKeysPressed = useStore.getState().keysPressed;

      // 디버그: 어떤 키가 눌려있는지 확인
      const anyKeyPressed = Object.values(currentKeysPressed).some(v => v);
      if (anyKeyPressed) {
        console.log("Keys pressed:", currentKeysPressed, "mode:", mode, "isInputFocused:", isInputFocused, "dataset.inputFocused:", document.body.dataset.inputFocused);
      }

      if (mode === "expert" && !isInputFocused) {
        // Expert 모드: 로켓처럼 카메라 방향 기준으로 이동

        // 카메라가 바라보는 방향 벡터
        const forward = new Vector3()
          .subVectors(target, cameraPos)
          .normalize();

        // 카메라의 오른쪽 방향 벡터 (forward와 up의 외적)
        const up = new Vector3(0, 1, 0);
        const right = new Vector3()
          .crossVectors(forward, up)
          .normalize();

        let moved = false;

        // 이동 벡터 누적
        const totalMovement = new Vector3();

        // W/S: 카메라가 바라보는 방향으로 앞뒤 이동
        if (currentKeysPressed["w"] || currentKeysPressed["arrowup"]) {
          totalMovement.add(forward.clone().multiplyScalar(moveSpeed));
          moved = true;
        }
        if (currentKeysPressed["s"] || currentKeysPressed["arrowdown"]) {
          totalMovement.add(forward.clone().multiplyScalar(-moveSpeed));
          moved = true;
        }

        // A/D: 카메라 기준 좌우 이동
        if (currentKeysPressed["a"] || currentKeysPressed["arrowleft"]) {
          totalMovement.add(right.clone().multiplyScalar(-moveSpeed));
          moved = true;
        }
        if (currentKeysPressed["d"] || currentKeysPressed["arrowright"]) {
          totalMovement.add(right.clone().multiplyScalar(moveSpeed));
          moved = true;
        }

        // Q/E: 상하 이동
        if (currentKeysPressed["q"]) {
          totalMovement.add(up.clone().multiplyScalar(-moveSpeed));
          moved = true;
        }
        if (currentKeysPressed["e"]) {
          totalMovement.add(up.clone().multiplyScalar(moveSpeed));
          moved = true;
        }

        if (moved) {
          // 카메라와 타겟을 동시에 이동
          const newCameraPos = cameraPos.clone().add(totalMovement);
          const newTarget = target.clone().add(totalMovement);

          camera.position.copy(newCameraPos);
          target.copy(newTarget);

          console.log("Expert mode camera moved:", newCameraPos, "target:", newTarget);
        }

        // Expert 모드에서는 항상 OrbitControls 업데이트
        orbitControls.update();
      } else if (mode === "player" && !isInputFocused) {
        // Player 모드: 기존 상대 이동
        // W/S: 앞뒤 이동 (Panning)
        if (currentKeysPressed["w"] || currentKeysPressed["arrowup"]) {
          const direction = new Vector3()
            .subVectors(target, cameraPos)
            .normalize()
            .multiplyScalar(0.05);
          camera.position.add(direction);
          target.add(direction);
        }
        if (currentKeysPressed["s"] || currentKeysPressed["arrowdown"]) {
          const direction = new Vector3()
            .subVectors(target, cameraPos)
            .normalize()
            .multiplyScalar(-0.05);
          camera.position.add(direction);
          target.add(direction);
        }

        // A/D: 좌우 이동 (Panning)
        if (currentKeysPressed["a"] || currentKeysPressed["arrowleft"]) {
          const direction = new Vector3().subVectors(target, cameraPos);
          const up = new Vector3(0, 1, 0);
          const right = new Vector3()
            .crossVectors(direction, up)
            .normalize()
            .multiplyScalar(0.05);
          camera.position.add(right);
          target.add(right);
        }
        if (currentKeysPressed["d"] || currentKeysPressed["arrowright"]) {
          const direction = new Vector3().subVectors(target, cameraPos);
          const up = new Vector3(0, 1, 0);
          const right = new Vector3()
            .crossVectors(direction, up)
            .normalize()
            .multiplyScalar(-0.05);
          camera.position.add(right);
          target.add(right);
        }

        // Player 모드에서도 업데이트
        orbitControls.update();
      }

      // 키보드 이동 중이 아닐 때만 OrbitControls 업데이트
      if (mode !== "expert" && mode !== "player") {
        orbitControls.update();
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

      // 선택된 행성 확인
      if (selectedId && bodyPositions[selectedId]) {
        const [px, py, pz] = bodyPositions[selectedId];

        // 외계행성인지 확인 (planet-로 시작하면 외계행성)
        const isExoplanet = selectedId.startsWith("planet-");

        if (isExoplanet) {
          // 외계행성: 행성을 바라봄
          orbitControls.target.set(px, py, pz);
        } else {
          // 태양계 행성: 행성을 바라봄
          orbitControls.target.set(px, py, pz);
        }
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
  const [expandedPanel, setExpandedPanel] = useState<'hyperparameter' | 'model' | null>(null);
  const {
    mode,
    selectedId,
    setSelectedId,
    setFlyToTarget,
    flyToTarget,
    setKeysPressed,
    bumpReset,
    showPlanetCard,
    setShowPlanetCard,
    selectedPlanetData,
    setSelectedPlanetData,
    isCameraMoving,
  } = useStore();

  // 키보드 입력 처리
  useEffect(() => {
    // 초기값 설정
    if (!document.body.dataset.inputFocused) {
      document.body.dataset.inputFocused = 'false';
    }

    // Canvas 클릭 시 input focus 해제
    const handleCanvasClick = () => {
      document.body.dataset.inputFocused = 'false';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // input이나 textarea가 포커스되어 있으면 키보드 이벤트 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // ESC 키로 카메라 고정 해제 및 선택 해제 (2단계)
      if (e.key === "Escape") {
        const { setIsCameraMoving } = useStore.getState();

        // 1단계: 카메라가 움직이고 있으면 먼저 카메라 해제
        if (flyToTarget || isCameraMoving) {
          setFlyToTarget(undefined);
          setIsCameraMoving(false);
          console.log("ESC 1단계: 카메라 해제", {
            flyToTarget,
            isCameraMoving,
          });
          return;
        }

        // 2단계: 카메라가 해제된 상태에서 선택 해제
        if (selectedId) {
          setSelectedId(undefined);
          setShowPlanetCard(false);
          setSelectedPlanetData(null);
          console.log("ESC 2단계: 행성 선택 해제");
          return;
        }
      }

      // Player 모드에서 스페이스바 처리
      if (mode === "player" && e.code === "Space") {
        e.preventDefault();

        // 로켓 카메라 모드 상태 확인
        const { rocketCameraMode, setRocketCameraMode, setRocketCameraTarget } =
          useStore.getState();

        if (rocketCameraMode === "planet_view") {
          // 행성 뷰 모드에서 스페이스바: 로켓 시점으로 돌아가기
          setRocketCameraMode("follow");
          setRocketCameraTarget(undefined);
          setFlyToTarget(undefined);
          setSelectedId(undefined);
          console.log("Scene: 로켓 시점으로 돌아갑니다");
        } else {
          // 일반 모드에서 스페이스바: 선택 해제
          setSelectedId(undefined);
          setFlyToTarget(undefined);
        }
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
          "q",
          "e",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        console.log("Key pressed:", key, "mode:", mode);
        setKeysPressed(key, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // input이나 textarea가 포커스되어 있으면 키보드 이벤트 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "q",
          "e",
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
    window.addEventListener("click", handleCanvasClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleCanvasClick);
    };
  }, [
    setFlyToTarget,
    setSelectedId,
    setKeysPressed,
    flyToTarget,
    isCameraMoving,
    selectedId,
    mode,
    setShowPlanetCard,
    setSelectedPlanetData,
  ]);

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
        <div className="pointer-events-auto relative z-30 mt-2">
          <button
            onClick={() => bumpReset()}
            className="w-full px-3 py-2 text-sm rounded-lg bg-black/60 border border-white/15 hover:bg-white/10 whitespace-nowrap"
          >
            Reset to Earth
          </button>
        </div>
      </div>

      {/* 상단 중앙 UI */}
      <div className="pointer-events-none absolute top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
        <div className="pointer-events-auto">
          <ScoreSidebar />
        </div>
      </div>

      {/* Planet 정보 카드 */}
      {selectedId && (() => {
        // 외계행성: selectedPlanetData 사용
        if (showPlanetCard && selectedPlanetData) {
          return (
            <PlanetCard
              planet={selectedPlanetData}
              onClose={() => setShowPlanetCard(false)}
            />
          );
        }

        // 태양계 행성: planets에서 찾아서 표시
        if (!selectedId.startsWith("exo-")) {
          const { planets: storePlanets } = useStore.getState();
          const solarPlanet = storePlanets.find(p => p.id === selectedId);

          if (solarPlanet) {
            return (
              <PlanetCard
                planet={solarPlanet}
                onClose={() => {
                  setSelectedId(undefined);
                  setShowPlanetCard(false);
                }}
              />
            );
          }
        }

        return null;
      })()}

      {/* 좌측 하단 - ESC 키 안내 */}
      <div className="pointer-events-none absolute bottom-20 left-3 z-40 space-y-3">
        {/* ESC 키 안내 - 카메라가 고정되었을 때 또는 행성이 선택되었을 때 표시 */}
        {(flyToTarget || isCameraMoving || selectedId) && (
          <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 backdrop-blur-sm text-white text-xs sm:text-sm text-center">
            {flyToTarget || isCameraMoving ? (
              <>
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded border border-white/30 font-mono text-[10px] sm:text-xs">
                  ESC
                </kbd>{" "}
                to release camera
              </>
            ) : (
              <>
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded border border-white/30 font-mono text-[10px] sm:text-xs">
                  ESC
                </kbd>{" "}
                to deselect planet
              </>
            )}
          </div>
        )}
      </div>

      {/* Expert 모드 전용 패널들 - 우측 상단 */}
      {mode === "expert" && (
        <div className="pointer-events-none absolute top-16 right-3 z-50 w-80 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <div className="pointer-events-auto">
            <HyperparameterPanel
              isExpanded={expandedPanel === 'hyperparameter'}
              onToggle={() => setExpandedPanel(expandedPanel === 'hyperparameter' ? null : 'hyperparameter')}
            />
          </div>
          <div className="pointer-events-auto">
            <ModelAccuracy
              isExpanded={expandedPanel === 'model'}
              onToggle={() => setExpandedPanel(expandedPanel === 'model' ? null : 'model')}
            />
          </div>
        </div>
      )}

      {/* Player 모드 - 게임 HUD */}
      {mode === "player" && (
        <>
          {/* 게임 HUD - 좌하단 */}
          <GameHUD />
        </>
      )}

      {/* Data Training 버튼 - 하단 중앙 (Expert 모드에서만 표시) */}
      {mode === "expert" && (
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
          dampingFactor={mode === "expert" ? 0 : 0.02}
          enableDamping={mode !== "expert"}
          autoRotate={false}
        />

        <Suspense fallback={null}>
          <Skybox />
          <SolarSystem timeScale={60} />

          {/* 외계행성 표시 - 태양계 바깥쪽 */}
          <ExoplanetPoints radius={300} />

          {/* 로켓은 Player 모드에서만 표시 */}
          {mode === "player" && <Rocket />}
        </Suspense>

        {/* 행성 보기(flyTo) 전용 리그 (Player 모드에서만 작동) */}
        <CameraRig />

        {/* Floating coin text animations */}
        {mode === "player" && <FloatingTextManager />}
      </Canvas>

      {/* Coin counter display - Player mode only */}
      {mode === "player" && <CoinCounter />}
    </div>
  );
}

/**
 * CoinCounter - Displays current coin count and rocket level with animations
 */
function CoinCounter() {
  const { coinCount, rocketLevel } = useStore();
  const [prevCoinCount, setPrevCoinCount] = useState(coinCount);
  const [showPulse, setShowPulse] = useState(false);
  const [showCoinFloat, setShowCoinFloat] = useState(false);

  useEffect(() => {
    if (coinCount > prevCoinCount) {
      // Coin collected animation
      setShowPulse(true);
      setShowCoinFloat(true);

      const pulseTimeout = setTimeout(() => setShowPulse(false), 500);
      const floatTimeout = setTimeout(() => setShowCoinFloat(false), 1000);

      setPrevCoinCount(coinCount);

      return () => {
        clearTimeout(pulseTimeout);
        clearTimeout(floatTimeout);
      };
    }
  }, [coinCount, prevCoinCount]);

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-50">
      <div className={`pointer-events-auto bg-black/70 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-sm transition-all duration-300 ${showPulse ? 'scale-110 border-yellow-400' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 relative">
            <span className={`text-3xl transition-transform duration-300 ${showPulse ? 'scale-125 rotate-12' : ''}`}>🪙</span>
            {showCoinFloat && (
              <div className="absolute top-0 left-0 animate-coin-float pointer-events-none">
                <span className="text-2xl">+1</span>
              </div>
            )}
            <div>
              <div className={`text-yellow-400 text-2xl font-bold transition-all duration-300 ${showPulse ? 'scale-110' : ''}`}>
                {coinCount}
              </div>
              <div className="text-white/60 text-xs">Coins</div>
            </div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-3xl">🚀</span>
            <div>
              <div className="text-blue-400 text-2xl font-bold">
                Level {rocketLevel}
              </div>
              <div className="text-white/60 text-xs">
                {rocketLevel === 1 && "Next: 3 coins"}
                {rocketLevel === 2 && "Next: 6 coins"}
                {rocketLevel === 3 && "Max level!"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes coin-float {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(1.5);
          }
        }

        .animate-coin-float {
          animation: coin-float 1s ease-out forwards;
          color: #FFD700;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }
      `}</style>
    </div>
  );
}
