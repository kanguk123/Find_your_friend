"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useStore } from "@/state/useStore";
import * as THREE from "three";

// 2D 외계인 이미지 컴포넌트
function AlienModel({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 2D 외계인 이미지 로드
  const texture = useTexture("/models/2d_alien.png");

  // 배경 제거를 위한 텍스처 처리
  const processedTexture = useMemo(() => {
    if (!texture) return texture;

    // 텍스처 복사
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    if (ctx) {
      ctx.drawImage(texture.image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 배경 제거 (흰색/밝은 색상 투명 처리)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 밝은 배경색을 투명으로 처리
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0; // alpha를 0으로 설정
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

    return texture;
  }, [texture]);

  // 외계인 애니메이션 (부드러운 회전과 떠다니는 효과)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[0.167, 0.167]} />
      <meshBasicMaterial
        map={processedTexture}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

// 외계인 사냥꾼 컴포넌트
export default function AlienHunters() {
  const { mode, planets } = useStore();
  const [alienPositions, setAlienPositions] = useState<
    Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      planetId: string;
    }>
  >([]);

  // 외계인 위치 생성 헬퍼 함수
  const createAlienPosition = (
    planet: any,
    planetPos: [number, number, number]
  ) => {
    // ExoplanetPointsAPI의 행성 크기 (EARTH_RENDER_SIZE * 4)
    const EARTH_RENDER_SIZE = 0.13 * 0.62;
    const planetRadius = EARTH_RENDER_SIZE * 4;

    // 구면 좌표계에서 랜덤 위치 생성
    const theta = Math.random() * Math.PI * 2; // 0 to 2π
    const phi = Math.random() * Math.PI; // 0 to π

    // 행성 표면 위의 위치 계산
    const surfaceOffset = 0.05; // 표면에서 약간 띄움
    const x = planetPos[0] + (planetRadius + surfaceOffset) * Math.sin(phi) * Math.cos(theta);
    const y = planetPos[1] + (planetRadius + surfaceOffset) * Math.cos(phi);
    const z = planetPos[2] + (planetRadius + surfaceOffset) * Math.sin(phi) * Math.sin(theta);

    return {
      position: [x, y, z] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      planetId: planet.id,
    };
  };

  // 랜덤 행성 선택 및 외계인 배치
  useEffect(() => {
    if (mode !== "player" || planets.length === 0) {
      setAlienPositions([]);
      return;
    }

    // API에서 로드된 외계행성들만 필터링 (coordinates_3d가 있는 행성)
    const exoplanets = planets.filter((p) => {
      const isExoplanet = p.id.startsWith("exo-") && p.coordinates_3d;
      return isExoplanet;
    });

    if (exoplanets.length === 0) {
      console.log("⚠️ 외계행성이 없어서 외계인을 배치할 수 없습니다.");
      setAlienPositions([]);
      return;
    }

    console.log(`🎯 렌더링된 외계행성들: ${exoplanets.length}개`);

    // 각 행성마다 1마리씩 외계인 배치 (최대 100개 행성)
    const aliensToPlace = exoplanets.slice(0, Math.min(100, exoplanets.length));

    const aliens = aliensToPlace.map((planet) => {
      // coordinates_3d를 직접 사용 (이미 필터링에서 확인됨)
      const coords = planet.coordinates_3d!;
      const planetPos: [number, number, number] = [
        coords.x,
        coords.y,
        coords.z,
      ];

      return createAlienPosition(planet, planetPos);
    });

    // 외계인 위치 설정
    setAlienPositions(aliens);

    console.log(
      `🎮 Player 모드: 정확히 ${aliens.length}마리의 외계인이 외계행성에 숨어있습니다!`
    );

    // 각 외계인이 어느 행성에 숨어있는지 상세 로그
    setTimeout(() => {
      aliens.slice(0, 10).forEach((alien, index) => {
        const planet = aliensToPlace[index];
        console.log(
          `👽 외계인 ${index + 1}번: 행성 ID "${alien.planetId}" (${
            planet.name || "이름없음"
          })에 숨어있습니다!`
        );
      });

      console.log(
        `👽 외계인 사냥꾼 게임 시작! 외계행성에서 숨어있는 외계인들을 찾아보세요!`
      );
    }, 100);
  }, [mode, planets]);

  // Player 모드에서만 렌더링
  if (mode !== "player") {
    return null;
  }

  return (
    <group>
      {alienPositions.map((alien, index) => (
        <AlienModel key={`alien-${index}`} position={alien.position} />
      ))}
    </group>
  );
}
