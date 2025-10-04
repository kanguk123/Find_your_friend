"use client";

import { useMemo } from "react";
import { MeshBasicMaterial, SRGBColorSpace, Texture, BackSide } from "three";
import { useTexture } from "@react-three/drei";

// 👉 여기에 파일만 두면 됨: public/textures/sky_custom.jpg
const SKY_TEX = "/textures/sky_custom.jpg";
const SKY_RADIUS = 500; // 장면 전체를 감싸도록 충분히 크게

export default function BackgroundSkyDome() {
    const tex = useTexture(SKY_TEX) as Texture;
    const mat = useMemo(() => {
        tex.colorSpace = SRGBColorSpace;
        const m = new MeshBasicMaterial({ map: tex, side: BackSide });
        m.toneMapped = false; // 톤매핑 영향 제거(원본에 가깝게)
        return m;
    }, [tex]);

    return (
        // 클릭 차단(오브젝트 피킹 방해 금지)
        <mesh raycast={() => {}}>
            <sphereGeometry args={[SKY_RADIUS, 64, 64]} />
            <primitive attach="material" object={mat} />
        </mesh>
    );
}
