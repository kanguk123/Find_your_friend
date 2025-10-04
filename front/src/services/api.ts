/**
 * API 서비스 - 백엔드와의 통신을 담당
 */

const API_BASE_URL = "http://localhost:8000";

export interface PlanetData {
  id: number;
  rowid: number;
  ra: number;
  dec: number;
  r: number;
  m?: number; // mass
  per?: number; // period
  flux?: number; // stellar flux
  teq?: number; // equilibrium temperature
  disposition: "CANDIDATE" | "FALSE POSITIVE" | "CONFIRMED";
  ai_probability: number;
  prediction_label: string | null;
  coordinates_3d: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiService {
  private static async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * 모든 행성 데이터를 가져옵니다
   */
  static async getPlanets(page: number = 1, pageSize: number = 50): Promise<ApiResponse<PlanetData[]>> {
    return this.request<ApiResponse<PlanetData[]>>(`/planets?page=${page}&page_size=${pageSize}`);
  }

  /**
   * 특정 행성의 AI 예측을 요청합니다
   */
  static async predictPlanet(planetId: number): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/predict/${planetId}`);
  }

  /**
   * 서버 상태를 확인합니다
   */
  static async getStatus(): Promise<any> {
    return this.request<any>("/");
  }
}
