"use client";

import { useMemo } from "react";
import { MeshBasicMaterial, SRGBColorSpace, Texture, BackSide } from "three";
import { useTexture } from "@react-three/drei";

const TEX_PATH = "/textures/galaxy.jpg";   // 이미 프로젝트에 존재
const SKY_RADIUS = 50;                      // 넉넉한 반경 (카메라/포인트보다 훨씬 큼)

export default function GalaxySkyDome() {
    const tex = useTexture(TEX_PATH) as Texture;

    const mat = useMemo(() => {
        tex.colorSpace = SRGBColorSpace;
        // 내부에서 보는 돔: BackSide
        const m = new MeshBasicMaterial({ map: tex, side: BackSide });
        // 톤매핑 영향 없고 라이트 영향도 없음
        m.toneMapped = false;
        return m;
    }, [tex]);

    return (
        // ✅ 클릭 차단 (점 피킹 방해 금지)
        <mesh raycast={() => {}}>
            <sphereGeometry args={[SKY_RADIUS, 64, 64]} />
            <primitive object={mat} attach="material" />
        </mesh>
    );
}
