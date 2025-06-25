// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
}

// 스테이킹 관련 API 함수들
export const stakingApi = {
  // 이자율 정보 조회
  getInterestRates: () => 
    apiRequest<{
      success: boolean;
      data: Array<{
        period: number;
        rate: number;
        name: string;
      }>;
    }>('/staking/rates'),

  // 스테이킹 신청 (블록체인 전송 해시 포함)
  createStaking: (data: {
    walletAddress: string;
    stakedAmount: number;
    stakingPeriod: number;
    transactionHash?: string; // 블록체인 전송 해시 추가
  }) =>
    apiRequest<{
      success: boolean;
      data: {
        id: number;
        walletAddress: string;
        stakedAmount: number;
        stakingPeriod: number;
        interestRate: number;
        startDate: string;
        endDate: string;
        expectedReward: number;
        status: string;
      };
      message: string;
    }>('/staking', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 특정 지갑의 스테이킹 목록 조회
  getStakingsByWallet: (walletAddress: string) =>
    apiRequest<{
      success: boolean;
      data: Array<{
        id: number;
        walletAddress: string;
        stakedAmount: number;
        stakingPeriod: number;
        interestRate: number;
        startDate: string;
        endDate: string;
        expectedReward: number;
        actualReward: number | null;
        status: string;
        createdAt: string;
      }>;
    }>(`/staking/wallet/${encodeURIComponent(walletAddress)}`),

  // 특정 스테이킹 상세 조회
  getStakingById: (id: number) =>
    apiRequest<{
      success: boolean;
      data: {
        id: number;
        walletAddress: string;
        stakedAmount: number;
        stakingPeriod: number;
        interestRate: number;
        startDate: string;
        endDate: string;
        expectedReward: number;
        actualReward: number | null;
        status: string;
        createdAt: string;
      };
    }>(`/staking/${id}`),

  // 스테이킹 취소 (중도 해지)
  cancelStaking: (id: number) =>
    apiRequest<{
      success: boolean;
      message: string;
    }>(`/staking/${id}/cancel`, {
      method: 'PUT',
    }),

  // 스테이킹 통계 조회
  getStakingStats: () =>
    apiRequest<{
      success: boolean;
      data: {
        totalStaked: number;
        totalRewards: number;
        activeStakings: number;
        completedStakings: number;
      };
    }>('/staking/stats'),
};

export default stakingApi; 