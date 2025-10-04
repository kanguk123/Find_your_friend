"use client";

import { Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, TextureLoader, BackSide } from "three";
import Link from "next/link";
import SolarSystem from "./SolarSystem";
import SolarSearchSidebar from "./SolarSearchSidebar";
import ScoreSidebar from "./ScoreSidebar";
import ExoplanetPointsAPI from "./ExoplanetPointsAPI";
import PlanetListPanel from "./PlanetListPanel";
import PlanetCard from "./PlanetCard";
import InfoPanel from "./InfoPanel";
import HyperparameterPanel from "./HyperparameterPanel";
import ModelAccuracy from "./ModelAccuracy";
import { useStore, type AppMode } from "../state/useStore";

// ... (rest of the file content would be here, but I'm just showing the fixed section)

{
  /* 우측 하단 - Planet 정보 (모든 모드에서 표시) */
}
<div className="pointer-events-none absolute bottom-3 right-3 z-40 space-y-3">
  <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-3 backdrop-blur-sm">
    <InfoPanel />
  </div>
  {/* ESC 키 안내 - 카메라가 고정되었을 때 또는 행성이 선택되었을 때 표시 */}
  {(flyToTarget || isCameraMoving || selectedId) && (
    <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 backdrop-blur-sm text-white text-xs sm:text-sm text-center">
      Press{" "}
      <kbd className="px-1.5 py-0.5 bg-white/20 rounded border border-white/30 font-mono text-[10px] sm:text-xs">
        ESC
      </kbd>{" "}
      to {flyToTarget || isCameraMoving ? "release camera" : "deselect planet"}
    </div>
  )}
</div>;

// ... (rest of the file content)
