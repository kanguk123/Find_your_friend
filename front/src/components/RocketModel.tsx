"use client";

/**
 * RocketModel - Manages rocket model loading and upgrades with smooth transitions
 *
 * Features:
 * - Model caching to prevent re-downloading
 * - Smooth fade-in/fade-out transitions
 * - Error handling with fallback
 * - Prevents duplicate loads
 * - Debug logging for tracking
 */

import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { Group, Box3, Vector3 } from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/state/useStore";

/**
 * Error Boundary for model loading failures
 */
class RocketErrorBoundary extends Component<
  { children: React.ReactNode; level: number },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; level: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ Failed to load rocket level ${this.props.level}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fail silently - rocket just won't render
    }

    return this.props.children;
  }
}

type Props = {
  scaleToMeters?: number;
  rotation?: [number, number, number];
};

// Model paths for each rocket level
const ROCKET_MODELS = {
  1: "/models/falcon_heavy.glb",
  2: "/models/2nd_level.glb",
  3: "/models/3rd_level.glb",
} as const;

// Cache for loaded models (prevents re-downloading)
const modelCache = new Map<number, Group>();

/**
 * Hook to load and cache rocket models
 */
function useRocketModel(level: number) {
  const modelPath = ROCKET_MODELS[level as keyof typeof ROCKET_MODELS] || ROCKET_MODELS[1];

  // useGLTF handles errors internally with Suspense
  const { scene } = useGLTF(modelPath) as unknown as { scene: Group };

  useEffect(() => {
    if (scene && !modelCache.has(level)) {
      modelCache.set(level, scene.clone(true));
      console.log(`✅ Rocket level ${level} model loaded successfully from ${modelPath}`);
    }
  }, [level, scene, modelPath]);

  return { scene };
}

/**
 * RocketModel Component - Renders the current rocket level with transitions
 */
function RocketModelInner({ scaleToMeters = 0.2, rotation = [0, 0, 0] }: Props) {
  const rocketLevel = useStore((s) => s.rocketLevel);
  const [displayLevel, setDisplayLevel] = useState(rocketLevel);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const opacityRef = useRef(1);
  const groupRef = useRef<Group>(null);

  // Load current model
  const { scene } = useRocketModel(displayLevel);

  // Handle level changes with transitions
  useEffect(() => {
    if (rocketLevel !== displayLevel && !isTransitioning) {
      console.log(`🚀 Upgrading rocket from level ${displayLevel} to level ${rocketLevel}`);
      setIsTransitioning(true);
    }
  }, [rocketLevel, displayLevel, isTransitioning]);

  // Animate transitions
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isTransitioning) {
      // Fade out
      opacityRef.current = Math.max(0, opacityRef.current - delta * 2);

      if (opacityRef.current <= 0) {
        // Switch model and fade in
        setDisplayLevel(rocketLevel);
        setIsTransitioning(false);
        opacityRef.current = 0;
      }
    } else if (opacityRef.current < 1) {
      // Fade in
      opacityRef.current = Math.min(1, opacityRef.current + delta * 2);
    }

    // Apply opacity to all materials
    groupRef.current.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            mat.transparent = true;
            mat.opacity = opacityRef.current;
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = opacityRef.current;
        }
      }
    });
  });

  // Create normalized and scaled rocket mesh
  const rocket = useMemo(() => {
    if (!scene) return null;

    const clone = scene.clone(true);
    clone.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.shadowSide = 2; // DoubleSide
      }
    });

    // Height normalization + ground alignment
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const h = size.y || 1;
    const s = scaleToMeters / h;
    clone.scale.setScalar(s);

    const after = new Box3().setFromObject(clone);
    clone.position.y -= after.min.y;

    return clone;
  }, [scene, scaleToMeters, displayLevel]);

  if (!rocket) {
    console.warn("RocketModel: Rocket mesh not ready yet");
    return null;
  }

  return (
    <group ref={groupRef} rotation={rotation}>
      <primitive object={rocket} />
    </group>
  );
}

/**
 * RocketModel with Error Boundary wrapper
 */
export default function RocketModel(props: Props) {
  const rocketLevel = useStore((s) => s.rocketLevel);

  return (
    <RocketErrorBoundary level={rocketLevel}>
      <RocketModelInner {...props} />
    </RocketErrorBoundary>
  );
}

// Preload all rocket models
if (typeof window !== "undefined") {
  Object.values(ROCKET_MODELS).forEach((path) => {
    try {
      useGLTF.preload(path);
      console.log(`🔄 Preloading rocket model: ${path}`);
    } catch (err) {
      console.warn(`⚠️ Could not preload ${path}:`, err);
    }
  });
}
