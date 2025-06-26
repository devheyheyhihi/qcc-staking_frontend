import { StakingPeriod } from '@/types/staking';
import { getStakingConfig } from '@/api/client';

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 기본 스테이킹 기간 옵션 (폴백용)
const DEFAULT_STAKING_PERIODS: StakingPeriod[] = [
  {
    id: '30',
    name: '30일',
    days: 30,
    apy: 3.0,
  },
  {
    id: '90',
    name: '90일',
    days: 90,
    apy: 6.0,
  },
  {
    id: '180',
    name: '180일',
    days: 180,
    apy: 10.0,
  },
  {
    id: '365',
    name: '365일',
    days: 365,
    apy: 15.0,
  },
];

// DB에서 이자율을 가져오는 함수
export const fetchInterestRates = async (): Promise<StakingPeriod[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/staking/rates`);
    const data = await response.json();

    if (data.success) {
      return data.data.map((rate: any) => ({
        id: rate.period.toString(),
        name: rate.name,
        days: rate.period,
        apy: rate.rate,
      }));
    } else {
      console.error('이자율 조회 실패:', data.message);
      return DEFAULT_STAKING_PERIODS;
    }
  } catch (error) {
    console.error('이자율 조회 오류:', error);
    return DEFAULT_STAKING_PERIODS;
  }
};

// 캐시된 스테이킹 기간 (성능 최적화)
let cachedStakingPeriods: StakingPeriod[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 스테이킹 기간 가져오기 (캐시 포함)
export const getStakingPeriods = async (): Promise<StakingPeriod[]> => {
  const now = Date.now();
  
  if (cachedStakingPeriods && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedStakingPeriods;
  }

  try {
    const periods = await fetchInterestRates();
    cachedStakingPeriods = periods;
    lastFetchTime = now;
    return periods;
  } catch (error) {
    console.error('스테이킹 기간 조회 실패:', error);
    return DEFAULT_STAKING_PERIODS;
  }
};

// 하위 호환성을 위한 STAKING_PERIODS (기본값 사용)
export const STAKING_PERIODS: StakingPeriod[] = DEFAULT_STAKING_PERIODS;

// 스테이킹 지갑 주소를 API에서 가져오는 함수
export const getStakingWalletAddress = async (): Promise<string> => {
  try {
    const config = await getStakingConfig();
    return config.data.stakingWalletAddress;
  } catch (error) {
    console.error('스테이킹 지갑 주소 조회 실패:', error);
    // 폴백 값 (개발 환경용)
    return 'dde0b5f4a236f209d62efe7354e73ca2f52a2dc78cca';
  }
};

// 이자 계산 함수
export const calculateReward = (amount: number, apy: number, days: number): number => {
  const dailyRate = apy / 365 / 100;
  return amount * dailyRate * days;
};

// 총 수익 계산 (원금 + 이자)
export const calculateTotalReturn = (amount: number, apy: number, days: number): number => {
  return amount + calculateReward(amount, apy, days);
};

// 날짜 포맷팅
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// 숫자 포맷팅 (천 단위 콤마)
export const formatNumber = (num: number): string => {
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat('ko-KR').format(num);
  }
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(num);
};

// 지갑 주소 축약
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 스테이킹 기간 찾기 (동적 데이터 지원)
export const findStakingPeriod = async (periodId: string): Promise<StakingPeriod | undefined> => {
  const periods = await getStakingPeriods();
  return periods.find(period => period.id === periodId);
};

// 동기 버전 (기존 코드 호환성)
export const findStakingPeriodSync = (periodId: string): StakingPeriod | undefined => {
  return STAKING_PERIODS.find(period => period.id === periodId);
}; 