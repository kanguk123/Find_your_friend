export type Planet = {
  id: string;
  name: string;
  ra: number;   // degrees
  dec: number;  // degrees
  teq?: number;
  score?: number; // 0..1
  // Expert 모드용 피처 값들
  features?: {
    mass?: number;
    radius?: number;
    orbital_period?: number;
    stellar_flux?: number;
    [key: string]: number | undefined;
  };
};
