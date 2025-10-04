"use client";

import { useEffect, useMemo, useState } from "react";
import { useTexture } from "@react-three/drei";
import { MeshBasicMaterial, SRGBColorSpace, Texture } from "three";

const TEX_PATH = "/textures/galaxy.jpg";
const RADIUS = 1.6;

export default function GlobeBase() {
    const [exists, setExists] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch(TEX_PATH, { method: "HEAD" })
            .then((r) => mounted && setExists(r.ok))
            .catch(() => mounted && setExists(false));
        return () => {
            mounted = false;
        };
    }, []);

    if (exists === true) return <TexturedGlobe />;
    if (exists === false) return <PlainGlobe />;
    return <PlainGlobe />;
}

function TexturedGlobe() {
    const tex = useTexture(TEX_PATH) as Texture;
    const material = useMemo(() => {
        tex.colorSpace = SRGBColorSpace;
        return new MeshBasicMaterial({ map: tex }); // 조명 영향 X
    }, [tex]);

    return (
        // ✅ 구는 레이캐스트 제외(점 클릭 방해 금지)
        <mesh raycast={() => {}}>
            <sphereGeometry args={[RADIUS, 64, 64]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

function PlainGlobe() {
    return (
        <mesh raycast={() => {}}>
            <sphereGeometry args={[RADIUS, 64, 64]} />
            <meshBasicMaterial color="#111217" />
        </mesh>
    );
}
