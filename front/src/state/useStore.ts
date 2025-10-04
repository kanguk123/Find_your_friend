"use client";

import { create } from "zustand";

export type Vec3 = [number, number, number];

export type AppMode = "player" | "expert";

export type Planet = {
  id: string;
  name: string;
  ra?: number;
  dec?: number;
  teq?: number;
  score?: number;
  // Expert 모드용 피처 값들
  features?: {
    mass?: number;
    radius?: number;
    orbital_period?: number;
    stellar_flux?: number;
    [key: string]: number | undefined;
  };
};

type Store = {
  // === 앱 모드 ===
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // === 즐겨찾기 ===
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (v: boolean) => void;

  // === 데이터 / 필터 ===
  planets: Planet[];
  setPlanets: (ps: Planet[]) => void;

  threshold: number; // 0~100 (%)
  setThreshold: (v: number) => void;

  selectedId?: string;
  setSelectedId: (id?: string) => void;

  // === 카메라 이동 상태 ===
  isCameraMoving: boolean;
  setIsCameraMoving: (v: boolean) => void;

  // === 키 입력 상태 ===
  keysPressed: Record<string, boolean>;
  setKeysPressed: (key: string, pressed: boolean) => void;

  // === 카메라 fly-to (행성 보기/점프) ===
  flyToTarget?: Vec3;
  setFlyToTarget: (v?: Vec3) => void;

  // === 카메라 위치 직접 설정 ===
  cameraPosition?: Vec3;
  setCameraPosition: (pos?: Vec3) => void;

  // === 로켓 추적 여부 (true면 카메라가 로켓을 따라감)
  followRocket: boolean;
  setFollowRocket: (v: boolean) => void;

  // === 로켓 카메라 상태 ===
  rocketCameraMode: "follow" | "planet_view";
  setRocketCameraMode: (mode: "follow" | "planet_view") => void;
  rocketCameraTarget?: string; // 현재 보고 있는 행성 ID
  setRocketCameraTarget: (target?: string) => void;

  // === 게임 상태 (리셋 등)
  rocketAlive: boolean;
  setRocketAlive: (v: boolean) => void;

  requestReset: number;
  bumpReset: () => void;

  // === 천체 최신 위치 (행성 보기용) ===
  bodyPositions: Record<string, Vec3>;
  setBodyPositions: (m: Record<string, Vec3>) => void;

  // === 로켓 위치 ===
  rocketPosition: Vec3;
  setRocketPosition: (pos: Vec3) => void;

  // === Expert 모드 하이퍼파라미터 ===
  hyperparameters: {
    learningRate: number;
    epochs: number;
    batchSize: number;
    hiddenLayers: number;
    dropout: number;
    momentum: number;
  };
  setHyperparameters: (params: Partial<Store["hyperparameters"]>) => void;

  // === PlanetCard 상태 ===
  showPlanetCard: boolean;
  setShowPlanetCard: (show: boolean) => void;
  selectedPlanetData: any | null;
  setSelectedPlanetData: (data: any | null) => void;

  // === Coin & Rocket Evolution System ===
  coinCount: number;
  rocketLevel: number;
  collectCoin: () => void;
  setRocketLevel: (level: number) => void;
  floatingTexts: Array<{ id: string; text: string; position: Vec3; timestamp: number }>;
  addFloatingText: (text: string, position: Vec3) => void;
  removeFloatingText: (id: string) => void;
};

export const useStore = create<Store>((set) => ({
  // === 앱 모드 ===
  mode: "player",
  setMode: (mode) => set({ mode }),

  // === 즐겨찾기 ===
  favorites: new Set<string>(),
  toggleFavorite: (id) =>
    set((state) => {
      const newFavorites = new Set(state.favorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return { favorites: newFavorites };
    }),
  showOnlyFavorites: false,
  setShowOnlyFavorites: (v) => set({ showOnlyFavorites: v }),

  // === 데이터 / 필터 ===
  planets: [],
  setPlanets: (ps) => set({ planets: ps }),

  threshold: 0,
  setThreshold: (v) => set({ threshold: Math.max(0, Math.min(100, v)) }),

  selectedId: undefined,
  setSelectedId: (id) => set({ selectedId: id }),

  // === 카메라 이동 상태 ===
  isCameraMoving: false,
  setIsCameraMoving: (v) => set({ isCameraMoving: v }),

  // === 키 입력 상태 ===
  keysPressed: {},
  setKeysPressed: (key, pressed) =>
    set((state) => ({
      keysPressed: { ...state.keysPressed, [key]: pressed },
    })),

  // === 카메라 fly-to ===
  flyToTarget: undefined,
  setFlyToTarget: (v) => {
    // 같은 좌표로 이미 이동 중이면 무시
    const current = useStore.getState().flyToTarget;
    if (current && v) {
      const [cx, cy, cz] = current;
      const [vx, vy, vz] = v;
      const distance = Math.hypot(cx - vx, cy - vy, cz - vz);
      // 거리가 0.01 이내면 같은 위치로 간주
      if (distance < 0.01) return;
    }
    set({ flyToTarget: v });
  },

  // === 카메라 위치 직접 설정 ===
  cameraPosition: undefined,
  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  // === 로켓 추적 여부 ===
  followRocket: true,
  setFollowRocket: (v) => set({ followRocket: v }),

  // === 로켓 카메라 상태 ===
  rocketCameraMode: "follow" as const,
  setRocketCameraMode: (mode) => set({ rocketCameraMode: mode }),
  rocketCameraTarget: undefined,
  setRocketCameraTarget: (target) => set({ rocketCameraTarget: target }),

  // === 게임 ===
  rocketAlive: true,
  setRocketAlive: (v) => set({ rocketAlive: v }),

  requestReset: 0,
  bumpReset: () => set((s) => ({ requestReset: s.requestReset + 1 })),

  bodyPositions: {},
  setBodyPositions: (m) => set({ bodyPositions: m }),

  // === 로켓 위치 ===
  rocketPosition: [0, 0, 0] as Vec3,
  setRocketPosition: (pos) => set({ rocketPosition: pos }),

  // === Expert 모드 하이퍼파라미터 ===
  hyperparameters: {
    learningRate: 0.001,
    epochs: 100,
    batchSize: 32,
    hiddenLayers: 3,
    dropout: 0.2,
    momentum: 0.9,
  },
  setHyperparameters: (params) =>
    set((state) => ({
      hyperparameters: { ...state.hyperparameters, ...params },
    })),

  // === PlanetCard 상태 ===
  showPlanetCard: false,
  setShowPlanetCard: (show) => set({ showPlanetCard: show }),
  selectedPlanetData: null,
  setSelectedPlanetData: (data) => set({ selectedPlanetData: data }),

  // === Coin & Rocket Evolution System ===
  coinCount: 0,
  rocketLevel: 1,
  collectCoin: () =>
    set((state) => {
      const newCoinCount = state.coinCount + 1;
      console.log(`🪙 Coin collected! Total: ${newCoinCount}`);

      // Auto-upgrade rocket at milestones
      let newRocketLevel = state.rocketLevel;
      if (newCoinCount === 3 && state.rocketLevel === 1) {
        newRocketLevel = 2;
        console.log(`🚀 Upgrading to level 2!`);
      } else if (newCoinCount === 6 && state.rocketLevel === 2) {
        newRocketLevel = 3;
        console.log(`🚀 Upgrading to level 3!`);
      }

      return { coinCount: newCoinCount, rocketLevel: newRocketLevel };
    }),
  setRocketLevel: (level) => set({ rocketLevel: level }),
  floatingTexts: [],
  addFloatingText: (text, position) =>
    set((state) => ({
      floatingTexts: [
        ...state.floatingTexts,
        { id: `${Date.now()}-${Math.random()}`, text, position, timestamp: Date.now() },
      ],
    })),
  removeFloatingText: (id) =>
    set((state) => ({
      floatingTexts: state.floatingTexts.filter((ft) => ft.id !== id),
    })),
}));
