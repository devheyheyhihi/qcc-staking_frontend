// 지원되는 니모닉 길이
export const SUPPORTED_MNEMONIC_LENGTH = [12, 15, 18, 21, 24] as const;

// 니모닉 길이 타입
export type SupportedMnemonicLength = typeof SUPPORTED_MNEMONIC_LENGTH[number];

// 기본 니모닉 길이
export const DEFAULT_MNEMONIC_LENGTH: SupportedMnemonicLength = 12;

// 지갑 관련 상수
export const WALLET_CONSTANTS = {
  MIN_MNEMONIC_LENGTH: 12,
  MAX_MNEMONIC_LENGTH: 24,
  DEFAULT_DERIVATION_PATH: "m/44'/0'/0'/0/0",
  PRIVATE_KEY_LENGTH: 64,
  PUBLIC_KEY_LENGTH: 66,
  ADDRESS_LENGTH: 40,
} as const; 