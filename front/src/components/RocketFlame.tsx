"use client";

/**
 * FLICKER-FREE Rocket Flame Component
 *
 * Anti-Flickering Architecture:
 * 1. React.memo prevents unnecessary re-renders
 * 2. Materials/geometries created ONCE with useMemo (empty deps)
 * 3. useRef for all mutable state (no useState for frame data)
 * 4. Only uniforms updated in useFrame (no material recreation)
 * 5. GPU-based particle system (all math on GPU)
 * 6. Stable render order for proper transparency
 */

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RocketFlameProps {
  intensity: number; // 0-1, controls flame visibility and size
  position?: [number, number, number];
}

const PARTICLE_COUNT = 800; // Optimized count for performance

// Simplex noise function for GPU (compact version)
const noiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = `
${noiseGLSL}

uniform float uTime;
uniform float uIntensity;
attribute float aLifetime;
attribute float aSize;
attribute vec3 aVelocity;
attribute float aSeed;

varying float vAge;
varying float vSeed;

void main() {
  vSeed = aSeed;

  // Calculate particle age (looping animation)
  float age = mod(uTime * (1.5 + aSeed * 0.5), aLifetime);
  vAge = age / aLifetime; // Normalized 0-1

  // Particle position with turbulent noise
  vec3 particlePos = position;

  // Turbulence using simplex noise
  float noiseScale = 2.0;
  float noiseStrength = 0.25 * vAge; // Increases with age
  vec3 noisePos = particlePos * noiseScale + vec3(uTime * 0.5, uTime * 0.3, uTime * 0.4);
  float noise = snoise(noisePos);

  vec3 turbulence = vec3(
    snoise(noisePos + vec3(0.0, 0.0, 0.0)),
    snoise(noisePos + vec3(5.2, 1.3, 0.0)),
    snoise(noisePos + vec3(1.7, 9.2, 0.0))
  ) * noiseStrength;

  // Particle movement (backward trail)
  vec3 movement = aVelocity * vAge * (0.3 + uIntensity * 1.2);
  particlePos += movement + turbulence;

  // Transform to screen space
  vec4 mvPosition = modelViewMatrix * vec4(particlePos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size calculation (fade out with age, scale with intensity)
  float fadeFactor = 1.0 - vAge;
  float sizeFactor = aSize * fadeFactor * (0.5 + vAge * 0.3);
  float intensityScale = 0.3 + uIntensity * 0.7;
  gl_PointSize = sizeFactor * intensityScale * (150.0 / -mvPosition.z);
}
`;

const fragmentShader = `
uniform float uIntensity;
varying float vAge;
varying float vSeed;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  // Soft circular gradient
  float alpha = smoothstep(0.5, 0.0, dist);

  // Color gradient based on distance from center
  vec3 coreColor = vec3(1.0, 1.0, 0.95);    // White-yellow
  vec3 midColor = vec3(1.0, 0.6, 0.1);      // Orange
  vec3 outerColor = vec3(0.9, 0.2, 0.05);   // Red-orange

  vec3 color;
  if (dist < 0.15) {
    color = coreColor;
  } else if (dist < 0.35) {
    float t = (dist - 0.15) / 0.2;
    color = mix(coreColor, midColor, t);
  } else {
    float t = (dist - 0.35) / 0.15;
    color = mix(midColor, outerColor, t);
  }

  // Add variation based on seed
  color *= (0.85 + vSeed * 0.3);

  // Fade with age
  alpha *= (1.0 - vAge * 0.6);

  // Scale alpha with intensity
  alpha *= (0.3 + uIntensity * 0.7);

  gl_FragColor = vec4(color, alpha);
}
`;

function RocketFlameComponent({ intensity, position = [0, 0, 0.1] }: RocketFlameProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const targetIntensityRef = useRef(intensity);
  const currentIntensityRef = useRef(0);

  // Create particle system ONCE - never recreated
  const particleSystem = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const lifetimes = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Spawn position (slight radial spread)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.015;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = 0;

      // Lifetime (0.2-0.6 seconds)
      lifetimes[i] = 0.2 + Math.random() * 0.4;

      // Size
      sizes[i] = 0.4 + Math.random() * 0.8;

      // Velocity (backward with spread)
      const spreadX = (Math.random() - 0.5) * 0.15;
      const spreadY = (Math.random() - 0.5) * 0.15;
      const spreadZ = 0.4 + Math.random() * 0.5;
      velocities[i3] = spreadX;
      velocities[i3 + 1] = spreadY;
      velocities[i3 + 2] = spreadZ;

      // Random seed for variation
      seeds[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return { geometry, material };
  }, []); // Empty deps = created ONCE

  // Update uniforms only (no material recreation)
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    // Update time
    timeRef.current += delta;
    particleSystem.material.uniforms.uTime.value = timeRef.current;

    // Smooth intensity interpolation
    targetIntensityRef.current = intensity;
    const lerpSpeed = 8.0; // Fast response
    currentIntensityRef.current = THREE.MathUtils.lerp(
      currentIntensityRef.current,
      targetIntensityRef.current,
      delta * lerpSpeed
    );
    particleSystem.material.uniforms.uIntensity.value = currentIntensityRef.current;
  });

  return (
    <points
      ref={pointsRef}
      position={position}
      geometry={particleSystem.geometry}
      material={particleSystem.material}
      renderOrder={1000} // Render after other objects
    />
  );
}

// Export memoized version to prevent re-renders
export default memo(RocketFlameComponent, (prev, next) => {
  // Only re-render if intensity or position actually changed
  return prev.intensity === next.intensity &&
         prev.position?.[0] === next.position?.[0] &&
         prev.position?.[1] === next.position?.[1] &&
         prev.position?.[2] === next.position?.[2];
});
