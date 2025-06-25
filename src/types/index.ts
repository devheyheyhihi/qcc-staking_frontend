// Wallet 인터페이스
export interface Wallet {
  privateKey: string;
  publicKey: string;
  address?: string;
  mnemonic: string;
}

// 키 쌍 인터페이스
export interface KeyPair {
  privateKey: string;
  publicKey: string;
  address?: string;
}

// 트랜잭션 관련 타입
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 에러 타입
export interface AppError {
  code: string;
  message: string;
  details?: any;
} 