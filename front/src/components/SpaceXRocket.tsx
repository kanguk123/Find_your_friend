"use client";

import React, { useMemo } from "react";
import { Group, Box3, Vector3 } from "three";
import { useGLTF } from "@react-three/drei";

type Props = {
  url?: string;
  /** 씬 유닛 기준 ‘보이는 높이’ */
  scaleToMeters?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export default function SpaceXRocket({
  url = "/models/falcon_heavy.glb",
  scaleToMeters = 0.2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Props) {
  const { scene } = useGLTF(url) as unknown as { scene: Group };

  const rocket = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.shadowSide = 2; // DoubleSide
      }
    });

    // 높이 정규화 + 바닥(y=0) 붙이기
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const h = size.y || 1;
    const s = scaleToMeters / h;
    clone.scale.setScalar(s);

    const after = new Box3().setFromObject(clone);
    clone.position.y -= after.min.y;

    return clone;
  }, [scene, scaleToMeters]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={rocket} />
    </group>
  );
}

useGLTF.preload("/models/falcon_heavy.glb");
