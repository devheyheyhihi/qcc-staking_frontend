'use client';

import { useState } from 'react';
import { FiUser, FiMenu, FiX, FiCreditCard } from 'react-icons/fi';
import { useWallet } from '@/lib/WalletContext';
import WalletConnectModal from './wallet/WalletConnectModal';
import WalletSidebar from './wallet/WalletSidebar';

export default function Header() {
  const { walletState } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletSidebarOpen, setIsWalletSidebarOpen] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-quantum-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button 
                onClick={() => window.location.reload()}
                className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity cursor-pointer"
              >
                Quantum Chain Staking
              </button>
            </div>
          </div>

          {/* 데스크톱 지갑 연결 버튼 */}
          <div className="hidden md:block">
            {walletState.isConnected && walletState.address ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatBalance(walletState.balance)} QCC
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatAddress(walletState.address)}
                  </div>
                </div>
                <button
                  onClick={() => setIsWalletSidebarOpen(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FiCreditCard className="w-4 h-4" />
                  <span>지갑</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <FiUser className="w-4 h-4" />
                <span>지갑 연결</span>
              </button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-quantum-600 p-2"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 지갑 연결 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-quantum-100">
            <div className="pt-4 pb-3">
              {walletState.isConnected && walletState.address ? (
                <div className="px-3 space-y-3">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {formatBalance(walletState.balance)} QCC
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatAddress(walletState.address)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsWalletSidebarOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="btn-primary flex items-center space-x-2 w-full justify-center"
                  >
                    <FiCreditCard className="w-4 h-4" />
                    <span>지갑 관리</span>
                  </button>
                </div>
              ) : (
                <div className="px-3">
                  <button
                    onClick={() => {
                      setIsWalletModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="btn-primary flex items-center space-x-2 w-full justify-center"
                  >
                    <FiUser className="w-4 h-4" />
                    <span>지갑 연결</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 지갑 연결 모달 */}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />

      {/* 지갑 사이드바 */}
      <WalletSidebar 
        isOpen={isWalletSidebarOpen} 
        onClose={() => setIsWalletSidebarOpen(false)} 
      />
    </header>
  );
} 