export interface StakingPeriod {
  id: string;
  name: string;
  days: number;
  apy: number; // Annual Percentage Yield
}

export interface StakingFormData {
  amount: number;
  periodId: string;
  walletAddress: string;
}

export interface StakingRecord {
  id: string;
  amount: number;
  period: StakingPeriod;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  expectedReward: number;
  actualReward?: number | null;
  transactionHash?: string;
}

export interface WalletInfo {
  address: string;
  balance: number;
  isConnected: boolean;
}

export interface StakingStats {
  totalStaked: number;
  totalRewards: number;
  activeStakings: number;
  completedStakings: number;
} 