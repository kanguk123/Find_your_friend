import { useStore } from "@/state/useStore";
import { Planet } from "@/state/useStore";

export abstract class PlanetClickHandler {
  protected store = useStore.getState();

  // 공통 클릭 로직
  handleClick(planet: Planet): void {
    const currentSelectedId = this.store.selectedId;

    // 행성 선택 및 카드 표시
    this.store.setSelectedId(planet.id);
    this.store.setShowPlanetCard(true);
    this.store.setSelectedPlanetData(planet);

    // 첫 번째 클릭: 행성 선택 (하이라이트)
    if (currentSelectedId !== planet.id) {
      this.store.setIsCameraMoving(false);
      return;
    }

    // 두 번째 클릭: 카메라 이동 (이미 선택된 행성을 다시 클릭)
    if (this.store.isCameraMoving) {
      // 이미 카메라가 이동 중이면 무시
      return;
    }

    this.store.setIsCameraMoving(true);
    this.moveCamera(planet);
  }

  // 행성 타입별 카메라 이동 로직 (추상 메서드)
  protected abstract moveCamera(planet: Planet): void;

  // 공통 시각적 상태 계산
  getVisualState(planet: Planet) {
    const isSelected = this.store.selectedId === planet.id;
    const isMoving = isSelected && this.store.isCameraMoving;
    const isOtherSelected =
      this.store.selectedId && this.store.selectedId !== planet.id;

    return {
      isSelected,
      isMoving,
      isOtherSelected,
      opacity: isOtherSelected ? 0.3 : 1.0,
      renderOrder: isSelected ? 1 : isOtherSelected ? -1 : 0,
    };
  }
}

// 태양계 행성 클릭 핸들러
export class SolarPlanetClickHandler extends PlanetClickHandler {
  protected moveCamera(planet: Planet): void {
    // 태양계 행성의 카메라 이동 로직은 각 컴포넌트에서 구현
    // 여기서는 기본적인 로직만 제공
    console.log("Moving camera to solar planet:", planet.name);
  }
}

// 외계행성 클릭 핸들러
export class ExoplanetClickHandler extends PlanetClickHandler {
  protected moveCamera(planet: Planet): void {
    // 외계행성의 카메라 이동 로직은 각 컴포넌트에서 구현
    // 여기서는 기본적인 로직만 제공
    console.log("Moving camera to exoplanet:", planet.name);
  }

  // 외계행성용 카메라 거리 계산 (작은 크기 고려)
  getCameraDistance(baseRadius: number): number {
    return baseRadius * 1.2; // 외계행성은 작으므로 더 멀리서 관찰
  }
}
