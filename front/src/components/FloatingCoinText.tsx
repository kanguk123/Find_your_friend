"use client";

/**
 * FloatingCoinText - Animated +1 Coin text that appears near clicked planets
 *
 * Features:
 * - Floats upward from planet position
 * - Fades out over time
 * - Auto-removes from store after animation
 * - Uses HTML overlay for crisp text rendering
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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

export default function FloatingCoinText({ id, text, position, timestamp }: FloatingTextProps) {
  const { camera, gl } = useThree();
  const removeFloatingText = useStore((s) => s.removeFloatingText);
  const positionRef = useRef(new Vector3(position[0], position[1], position[2]));
  const htmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-remove after animation duration
    const timeout = setTimeout(() => {
      console.log(`Removing floating text: ${id}`);
      removeFloatingText(id);
    }, ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [id, removeFloatingText]);

  useFrame((_, delta) => {
    if (!htmlRef.current) return;

    // Update position (float upward)
    positionRef.current.y += FLOAT_SPEED * delta;

    // Calculate screen position
    const screenPos = positionRef.current.clone().project(camera);

    // Check if position is in front of camera
    if (screenPos.z > 1) {
      htmlRef.current.style.display = "none";
      return;
    }

    // Convert to screen coordinates
    const canvas = gl.domElement;
    const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * canvas.clientHeight;

    // Calculate opacity based on age
    const age = Date.now() - timestamp;
    const progress = Math.min(age / ANIMATION_DURATION, 1);
    const opacity = Math.max(1 - progress, 0);

    // Apply styles
    htmlRef.current.style.display = "block";
    htmlRef.current.style.left = `${x}px`;
    htmlRef.current.style.top = `${y}px`;
    htmlRef.current.style.opacity = `${opacity}`;
  });

  return (
    <div
      ref={htmlRef}
      style={{
        position: "fixed",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 1000,
        fontSize: "24px",
        fontWeight: "bold",
        color: "#FFD700",
        textShadow: "0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

/**
 * FloatingTextManager - Renders all active floating texts
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
