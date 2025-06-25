// 스테이킹 설정은 이제 API에서 동적으로 가져옵니다
// getStakingConfig() 함수를 사용하세요

export const STAKING_INTEREST_RATES = {
  30: 5.0,   // 30일: 5%
  60: 8.0,   // 60일: 8%
  90: 12.0,  // 90일: 12%
  180: 20.0, // 180일: 20%
  365: 35.0  // 365일: 35%
} as const;

export type StakingPeriod = keyof typeof STAKING_INTEREST_RATES;