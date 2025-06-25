import axios from "axios";

const createApiClient = (baseURL: string) => {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });
};

export const api = createApiClient("https://qcc-backend.com");

// 백엔드 API 클라이언트 - 환경 변수 사용
export const backendApi = createApiClient(
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:3001"
);

// 설정 조회 함수
export const getStakingConfig = async () => {
  try {
    const response = await backendApi.get("/api/config");
    return response.data;
  } catch (error) {
    console.error("설정 조회 실패:", error);
    throw error;
  }
};