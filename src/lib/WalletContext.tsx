"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as bip39 from 'bip39';
import { WalletState, WalletContextType } from './wallet-types';
import { 
  saveWalletToStorage, 
  loadWalletFromStorage, 
  clearWalletFromStorage,
  restoreWalletFromMnemonic,
  importWallet
} from './wallet-utils';
import { getAddressBalance } from './balance-api';
import toast from 'react-hot-toast';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0,
    privateKey: null,
    mnemonic: null,
    isLoading: false,
  });

  // 컴포넌트 마운트 시 저장된 지갑 정보 로드
  useEffect(() => {
    const loadSavedWallet = async () => {
      try {
        const savedWallet = await loadWalletFromStorage();
    if (savedWallet) {
          setWalletState(savedWallet);
          
          // 저장된 지갑이 있으면 실제 잔액 조회
          if (savedWallet.address) {
            try {
              const balance = await getAddressBalance(savedWallet.address);
              setWalletState(prev => ({
                ...prev,
                balance: parseFloat(balance)
              }));
            } catch (balanceError) {
              console.error('Failed to fetch balance for saved wallet:', balanceError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load saved wallet:', error);
      }
    };

    loadSavedWallet();
  }, []);

  // 지갑 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (walletState.isConnected) {
      saveWalletToStorage(walletState);
    }
  }, [walletState]);

  // 새 지갑 생성
  const createWallet = async (): Promise<WalletState | null> => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));

      // 12개 단어 복구 구문 생성
      const mnemonic = bip39.generateMnemonic();
      const walletInfo = await restoreWalletFromMnemonic(mnemonic);

      const newWallet: WalletState = {
        isConnected: true,
        address: walletInfo.wallet.address,
        balance: 0, // 초기값은 0으로 설정
        privateKey: walletInfo.wallet.private_key,
        mnemonic: walletInfo.wallet.mnemonic,
        isLoading: false,
      };

      setWalletState(newWallet);
      
      // 실제 잔액 조회
      try {
        const balance = await getAddressBalance(walletInfo.wallet.address);
        setWalletState(prev => ({
          ...prev,
          balance: parseFloat(balance)
        }));
      } catch (balanceError) {
        console.error('Failed to fetch initial balance:', balanceError);
      }
      
      toast.success('새 지갑이 생성되었습니다!');
      return newWallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      toast.error('지갑 생성에 실패했습니다.');
      return null;
    }
  };

  // 복구 구문으로 지갑 가져오기
  const importFromMnemonic = async (mnemonic: string): Promise<WalletState | null> => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      const walletInfo = await restoreWalletFromMnemonic(mnemonic);

      const importedWallet: WalletState = {
        isConnected: true,
        address: walletInfo.wallet.address,
        balance: 0, // 초기값은 0으로 설정
        privateKey: walletInfo.wallet.private_key,
        mnemonic: walletInfo.wallet.mnemonic,
        isLoading: false,
      };

      setWalletState(importedWallet);
      
      // 실제 잔액 조회
      try {
        const balance = await getAddressBalance(walletInfo.wallet.address);
        setWalletState(prev => ({
          ...prev,
          balance: parseFloat(balance)
        }));
      } catch (balanceError) {
        console.error('Failed to fetch initial balance:', balanceError);
      }
      
      toast.success('지갑을 성공적으로 복구했습니다!');
      return importedWallet;
    } catch (error) {
      console.error('Failed to import wallet from mnemonic:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      toast.error('복구 구문이 올바르지 않습니다.');
      return null;
    }
  };

  // 키파일로 지갑 가져오기
  const importFromKeyFile = async (file: File): Promise<WalletState | null> => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));

      // 파일 확장자 검증
      if (!file.name.endsWith('.qcc')) {
        toast.error('올바른 키파일을 선택해주세요. (.qcc)');
        setWalletState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const walletInfo = await importWallet(file);
      if (!walletInfo) {
        throw new Error('Invalid key file');
      }

      const importedWallet: WalletState = {
        isConnected: true,
        address: walletInfo.wallet.address,
        balance: 0, // 초기값은 0으로 설정
        privateKey: walletInfo.wallet.private_key,
        mnemonic: walletInfo.wallet.mnemonic,
        isLoading: false,
      };

      setWalletState(importedWallet);
      
      // 실제 잔액 조회
      try {
        const balance = await getAddressBalance(walletInfo.wallet.address);
        setWalletState(prev => ({
          ...prev,
          balance: parseFloat(balance)
        }));
      } catch (balanceError) {
        console.error('Failed to fetch initial balance:', balanceError);
      }
      
      toast.success('키파일에서 지갑을 성공적으로 가져왔습니다!');
      return importedWallet;
    } catch (error) {
      console.error('Failed to import wallet from key file:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      toast.error('키파일이 올바르지 않습니다.');
      return null;
    }
  };

  // 지갑 연결 (통합 함수)
  const connectWallet = async (
    method: 'create' | 'import',
    options?: { mnemonic?: string; privateKey?: string; keyFile?: File }
  ): Promise<WalletState | null> => {
    if (method === 'create') {
      return await createWallet();
    } else if (method === 'import') {
      if (options?.mnemonic) {
        return await importFromMnemonic(options.mnemonic);
      } else if (options?.keyFile) {
        return await importFromKeyFile(options.keyFile);
      } else {
        toast.error('가져오기 옵션을 선택해주세요.');
        return null;
      }
    }
    return null;
  };

  // 지갑 연결 해제
  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: 0,
      privateKey: null,
      mnemonic: null,
      isLoading: false,
    });
    clearWalletFromStorage();
  };

  // 잔액 업데이트 (실제 블록체인 API 호출)
  const updateBalance = async () => {
    if (!walletState.address) return;
    
    try {
      const balance = await getAddressBalance(walletState.address);
      
      setWalletState(prev => ({
        ...prev,
        balance: parseFloat(balance)
      }));
    } catch (error) {
      console.error('Failed to update balance:', error);
      toast.error('잔액 업데이트에 실패했습니다.');
    }
  };

  const value: WalletContextType = {
    walletState,
    connectWallet,
    disconnectWallet,
    updateBalance,
    createWallet,
    importFromMnemonic,
    importFromKeyFile,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};