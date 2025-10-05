
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { MeshStandardMaterial } from "three";

interface StarModelProps {
  color: string;
  radius: number;
}

export default function StarModel({ color, radius }: StarModelProps) {
  const { scene } = useGLTF("/models/star_effect.glb");

  const coloredScene = useMemo(() => {
    const newScene = scene.clone();
    const material = new MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.2,
    });

    newScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
      }
    });

    return newScene;
  }, [scene, color]);

  return <primitive object={coloredScene} scale={radius * 2} />;
}

useGLTF.preload("/models/star_effect.glb");
