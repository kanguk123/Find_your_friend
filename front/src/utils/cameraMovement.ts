import { useStore, type Planet, type Vec3 } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";

/**
 * Player 모드에서 행성 클릭 시 카메라 이동 로직
 * @param planetPosition 행성의 현재 3D 위치 [x, y, z]
 * @param rocketPosition 로켓의 현재 위치 [x, y, z]
 * @param planetRadius 행성의 렌더링 반경
 * @param options 추가 옵션
 * @returns 카메라 목표 위치 [x, y, z]
 */
export function calculatePlayerModeCameraPosition(
  planetPosition: Vec3,
  rocketPosition: Vec3,
  planetRadius: number,
  options?: {
    isExoplanet?: boolean;
    exoplanetRadius?: number;
    sphereRadius?: number; // 외계행성이 배치된 구의 반경 (기본 30)
  }
): Vec3 {
  const [planetX, planetY, planetZ] = planetPosition;

  console.log("Player mode - Planet position:", planetPosition);

  // 카메라 거리 계산
  let cameraDistance: number;
  if (options?.isExoplanet) {
    // 외계행성: 행성에 가까이 배치 (행성 크기의 5배 거리)
    const exoplanetVisualRadius = options.exoplanetRadius || 0.6;
    cameraDistance = exoplanetVisualRadius * 5; // 외계행성을 잘 볼 수 있는 거리
  } else {
    cameraDistance = planetRadius * 4.5; // 태양계 행성
  }

  let camX: number, camY: number, camZ: number;

  if (options?.isExoplanet) {
    // 외계행성: 행성 위치 기준으로 카메라 배치 (행성에서 원점 방향으로)
    const len = Math.hypot(planetX, planetY, planetZ) || 1;
    const normalX = planetX / len;
    const normalY = planetY / len;
    const normalZ = planetZ / len;

    // 행성에서 원점 방향으로 cameraDistance만큼 떨어진 위치
    camX = planetX - normalX * cameraDistance;
    camY = planetY - normalY * cameraDistance;
    camZ = planetZ - normalZ * cameraDistance;
  } else {
    // 태양계 행성: Expert 모드와 동일하게 태양 기준으로 카메라 배치
    const dirX = planetX;
    const dirZ = planetZ;
    const len = Math.hypot(dirX, dirZ) || 1;
    const normalX = dirX / len;
    const normalZ = dirZ / len;

    // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
    camX = planetX + normalX * cameraDistance;
    camY = planetY + cameraDistance * 0.15;
    camZ = planetZ + normalZ * cameraDistance;
  }

  return [camX, camY, camZ];
}

/**
 * Expert 모드에서 행성 클릭 시 카메라 이동 로직
 * @param planetPosition 행성의 현재 3D 위치 [x, y, z]
 * @param planetRadius 행성의 렌더링 반경
 * @param options 추가 옵션
 * @returns 카메라 목표 위치 [x, y, z]
 */
export function calculateExpertModeCameraPosition(
  planetPosition: Vec3,
  planetRadius: number,
  options?: {
    isExoplanet?: boolean;
    exoplanetRadius?: number;
    sphereRadius?: number; // 외계행성이 배치된 구의 반경 (기본 30)
  }
): Vec3 {
  const [planetX, planetY, planetZ] = planetPosition;

  // 카메라 거리 계산
  let cameraDistance: number;
  if (options?.isExoplanet) {
    // 외계행성: 구의 반경 기준으로 거리 계산
    const sphereRadius = options.sphereRadius || 30;
    cameraDistance = sphereRadius * 1.2; // 외계행성은 원점에서 멀리 떨어져 있음
  } else {
    cameraDistance = planetRadius * 4.5; // 태양계 행성
  }

  let camX: number, camY: number, camZ: number;

  if (options?.isExoplanet) {
    // 외계행성: 원점 기준으로 카메라 배치
    const len = Math.hypot(planetX, planetY, planetZ) || 1;
    const normalX = planetX / len;
    const normalY = planetY / len;
    const normalZ = planetZ / len;

    // 원점에서 행성 방향으로 cameraDistance만큼 떨어진 위치
    camX = normalX * cameraDistance;
    camY = normalY * cameraDistance;
    camZ = normalZ * cameraDistance;
  } else {
    // 태양계 행성: 태양 기준
    const dirX = planetX;
    const dirZ = planetZ;
    const len = Math.hypot(dirX, dirZ) || 1;
    const normalX = dirX / len;
    const normalZ = dirZ / len;

    camX = planetX + normalX * cameraDistance;
    camY = planetY + cameraDistance * 0.15;
    camZ = planetZ + normalZ * cameraDistance;
  }

  return [camX, camY, camZ];
}

/**
 * 태양계 행성 클릭 시 카메라 이동
 * @param planet 선택된 행성
 * @param planetPosition 행성의 현재 3D 위치 [x, y, z]
 * @param planetRadius 행성의 렌더링 반경
 */
export function moveSelectedPlanet(
  planet: Planet,
  planetPosition: Vec3,
  planetRadius: number
) {
  const {
    setFlyToTarget,
    setFollowRocket,
    setIsCameraMoving,
    setRocketCameraMode,
    setRocketCameraTarget,
    mode,
    rocketPosition,
  } = useStore.getState();

  // 로켓 카메라 모드로 전환
  setRocketCameraMode("planet_view");
  setRocketCameraTarget(planet.id);
  console.log("로켓 카메라 모드로 전환:", planet.name);

  setIsCameraMoving(true);

  console.log("Planet actual position:", planetPosition);

  // Expert 모드의 초기 카메라 위치를 사용하여 계산
  const INITIAL_CAMERA_POSITION: Vec3 = [0, 0, 4.2];

  // 모드에 따라 카메라 위치 계산
  let cameraPosition: Vec3;
  if (mode === "player") {
    // Player 모드에서도 초기 위치 기준으로 계산
    cameraPosition = calculatePlayerModeCameraPosition(
      planetPosition,
      INITIAL_CAMERA_POSITION,
      planetRadius
    );
  } else {
    cameraPosition = calculateExpertModeCameraPosition(
      planetPosition,
      planetRadius
    );
  }

  console.log("Camera target position:", cameraPosition);

  setFlyToTarget(cameraPosition);
  setFollowRocket(false);
}

/**
 * 외계행성 클릭 시 카메라 이동
 * @param planet 선택된 외계행성
 * @param planetPosition 행성의 현재 3D 위치 [x, y, z]
 * @param exoplanetRadius 외계행성의 렌더링 반경
 * @param sphereRadius 외계행성이 배치된 구의 반경 (기본 30)
 */
export function moveSelectedExoplanet(
  planet: Planet,
  planetPosition: Vec3,
  exoplanetRadius: number,
  sphereRadius: number = 30
) {
  const {
    setFlyToTarget,
    setFollowRocket,
    setIsCameraMoving,
    setRocketCameraMode,
    setRocketCameraTarget,
    setCameraPosition,
    mode,
    rocketPosition,
  } = useStore.getState();

  // 로켓 카메라 모드로 전환
  setRocketCameraMode("planet_view");
  setRocketCameraTarget(planet.id);
  console.log("로켓 카메라 모드로 전환:", planet.name);

  setIsCameraMoving(true);

  console.log("Exoplanet actual position:", planetPosition);

  // Expert 모드의 초기 카메라 위치
  const INITIAL_CAMERA_POSITION: Vec3 = [0, 0, 4.2];

  // 카메라를 초기 위치로 즉시 설정
  if (setCameraPosition) {
    setCameraPosition(INITIAL_CAMERA_POSITION);
    console.log("Camera position reset to:", INITIAL_CAMERA_POSITION);
  }

  // 모드에 따라 카메라 위치 계산
  let cameraPosition: Vec3;
  if (mode === "player") {
    // Player 모드에서도 초기 위치 기준으로 계산
    cameraPosition = calculatePlayerModeCameraPosition(
      planetPosition,
      INITIAL_CAMERA_POSITION,
      exoplanetRadius,
      { isExoplanet: true, exoplanetRadius, sphereRadius }
    );
  } else {
    cameraPosition = calculateExpertModeCameraPosition(
      planetPosition,
      exoplanetRadius,
      { isExoplanet: true, exoplanetRadius, sphereRadius }
    );
  }

  console.log("Camera target position:", cameraPosition);

  setFlyToTarget(cameraPosition);
  setFollowRocket(false);
}

/**
 * 태양 클릭 시 카메라 이동
 */
export function moveCameraToSun() {
  const { setFlyToTarget, setFollowRocket, setIsCameraMoving } =
    useStore.getState();

  setIsCameraMoving(true);
  // 태양은 중심에 있으므로 적당한 거리에서 보기
  setFlyToTarget([0, 0, 4]);
  setFollowRocket(false);
}
