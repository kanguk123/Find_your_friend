"use client";

/**
 * FloatingCoinText - Animated +1 Coin text that appears near clicked planets
 *
 * Features:
 * - Floats upward from planet position
 * - Fades out over time
 * - Auto-removes from store after animation
 * - Uses HTML overlay for crisp text rendering
 * - Rendered outside Canvas to avoid R3F errors
 */

import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";
import { useStore } from "@/state/useStore";

interface FloatingTextProps {
  id: string;
  text: string;
  position: [number, number, number];
  timestamp: number;
}

const ANIMATION_DURATION = 2000; // 2 seconds
const FLOAT_SPEED = 0.5; // Units per second

/**
 * FloatingCoinText - Individual floating text (inside Canvas using Html from drei)
 */
function FloatingCoinText({ id, text, position, timestamp }: FloatingTextProps) {
  const removeFloatingText = useStore((s) => s.removeFloatingText);
  const positionRef = useRef(new Vector3(position[0], position[1], position[2]));

  useEffect(() => {
    const timeout = setTimeout(() => {
      removeFloatingText(id);
    }, ANIMATION_DURATION);
    return () => clearTimeout(timeout);
  }, [id, removeFloatingText]);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      positionRef.current.y += FLOAT_SPEED / 60;
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const age = Date.now() - timestamp;
  const progress = Math.min(age / ANIMATION_DURATION, 1);
  const opacity = Math.max(1 - progress, 0);

  return (
    <group position={[positionRef.current.x, positionRef.current.y, positionRef.current.z]}>
      <Html
        center
        distanceFactor={10}
        zIndexRange={[1000, 0]}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#FFD700",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)",
            whiteSpace: "nowrap",
            opacity: opacity,
            transition: "opacity 0.1s linear",
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

/**
 * FloatingTextManager - Renders all active floating texts
 * Must be placed INSIDE Canvas
 */
export function FloatingTextManager() {
  const floatingTexts = useStore((s) => s.floatingTexts);

  return (
    <>
      {floatingTexts.map((ft) => (
        <FloatingCoinText
          key={ft.id}
          id={ft.id}
          text={ft.text}
          position={ft.position}
          timestamp={ft.timestamp}
        />
      ))}
    </>
  );
}
