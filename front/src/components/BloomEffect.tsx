"use client";

/**
 * STABLE Bloom Effect Component
 *
 * Anti-Flickering Architecture:
 * 1. NEVER conditionally mounts/unmounts (causes canvas reset)
 * 2. Always rendered, controlled by intensity prop
 * 3. EffectComposer replaces default render loop (single render pass)
 * 4. Waits for scene initialization before mounting
 * 5. Uses proper blend function for additive glow
 */

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface BloomEffectProps {
  enabled?: boolean;
}

export default function BloomEffect({ enabled = true }: BloomEffectProps) {
  const { scene, gl, camera } = useThree();
  const [isReady, setIsReady] = useState(false);

  // Wait for scene to be fully initialized
  useEffect(() => {
    if (scene && gl && camera) {
      // Delay to ensure scene children are populated
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [scene, gl, camera]);

  // Don't render EffectComposer until scene is ready
  if (!isReady) return null;

  // Control bloom with intensity instead of mounting/unmounting
  const bloomIntensity = enabled ? 1.2 : 0;

  return (
    <EffectComposer
      multisampling={4} // MSAA anti-aliasing
      stencilBuffer={false} // Performance optimization
    >
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.4} // Only bright areas glow
        luminanceSmoothing={0.9}
        radius={0.6} // Compact glow
        blendFunction={BlendFunction.SCREEN} // Proper additive blending
      />
    </EffectComposer>
  );
}
