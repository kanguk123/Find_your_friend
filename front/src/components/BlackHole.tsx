"use client";

import { useEffect, useRef } from "react";
import { Color, Group, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/state/useStore";

const TMP = new Vector3();

export default function BlackHole({
                                      pos = [6, 0, 0],
                                      eventHorizon = 0.35,
                                      pullRadius = 4.0,
                                      strength = 18.0,
                                  }: {
    pos?: [number, number, number];
    eventHorizon?: number;
    pullRadius?: number;
    strength?: number;
}) {
    const ref = useRef<Group>(null!);
    const { camera } = useThree();
    const setRocketAlive = useStore((s) => s.setRocketAlive);
    const bumpReset = useStore((s) => s.bumpReset);
    const alive = useStore((s) => s.rocketAlive);

    const triggered = useRef(false);

    // 다시 살아나면 트리거 초기화
    useEffect(() => {
        if (alive) triggered.current = false;
    }, [alive]);

    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;

        TMP.copy(g.position).sub(camera.position);
        const dist = TMP.length();

        // 흡인
        if (dist < pullRadius && dist > eventHorizon) {
            TMP.normalize();
            camera.position.addScaledVector(
                TMP,
                strength * dt * (1 / Math.max(0.4, dist))
            );
        }

        // 이벤트 호라이즌: 한 번만 트리거
        if (dist <= eventHorizon && !triggered.current) {
            triggered.current = true;
            setRocketAlive(false);
            bumpReset();
        }
    });

    return (
        <group ref={ref} position={pos}>
            <mesh>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh>
                <ringGeometry args={[0.24, 0.34, 64]} />
                <meshBasicMaterial color={new Color("#5236ff")} transparent opacity={0.35} />
            </mesh>
        </group>
    );
}
