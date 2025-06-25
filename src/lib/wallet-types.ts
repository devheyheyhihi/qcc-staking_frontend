// 지갑 상태 인터페이스
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  privateKey: string | null;
  mnemonic?: string | null;
  isLoading: boolean;
}

// 지갑 정보 인터페이스
export interface WalletInfo {
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic?: string;
}

// 암호화된 지갑 데이터 인터페이스
export interface EncryptedWalletData {
  wallet: {
  private_key: string;
  public_key: string;
  address: string;
  mnemonic: string;
  symbol: string;
  };
  timestamp: number;
}

// 지갑 컨텍스트 타입
export interface WalletContextType {
  walletState: WalletState;
  connectWallet: (
    method: 'create' | 'import',
    options?: { mnemonic?: string; privateKey?: string; keyFile?: File }
  ) => Promise<WalletState | null>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
  createWallet: () => Promise<WalletState | null>;
  importFromMnemonic: (mnemonic: string) => Promise<WalletState | null>;
  importFromKeyFile: (file: File) => Promise<WalletState | null>;
}