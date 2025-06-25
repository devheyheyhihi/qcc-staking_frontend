'use client';

import React, { useState } from 'react';
import { X, Copy, Eye, EyeOff, LogOut, Wallet, RefreshCw } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import toast from 'react-hot-toast';

interface WalletSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletSidebar({ isOpen, onClose }: WalletSidebarProps) {
  const { walletState, disconnectWallet, updateBalance } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  if (!isOpen || !walletState.isConnected || !walletState.address) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}이(가) 클립보드에 복사되었습니다.`);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
    toast.success('지갑 연결이 해제되었습니다.');
  };

  const handleRefreshBalance = async () => {
    await updateBalance();
    toast.success('잔액이 업데이트되었습니다.');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-quantum-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-quantum-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">지갑 정보</h2>
                <p className="text-sm text-gray-500">Quantum Chain</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-r from-quantum-500 to-quantum-600 rounded-xl p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-quantum-100 text-sm font-medium">총 잔액</p>
                <p className="text-3xl font-bold">
                  {formatBalance(walletState.balance)} QTC
                </p>
              </div>
              <button
                onClick={handleRefreshBalance}
                className="text-white hover:text-quantum-100 transition-colors"
                title="잔액 새로고침"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Wallet Details */}
          <div className="space-y-4">
            {/* Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">지갑 주소</span>
                <button
                  onClick={() => copyToClipboard(walletState.address!, '주소')}
                  className="text-quantum-600 hover:text-quantum-700 transition-colors"
                  title="주소 복사"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="bg-white rounded-md p-3 border">
                <p className="text-sm font-mono text-gray-800 break-all leading-relaxed">
                {walletState.address}
              </p>
            </div>
            </div>

            {/* Private Key */}
            {walletState.privateKey && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">개인키</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title={showPrivateKey ? '개인키 숨기기' : '개인키 보기'}
                  >
                    {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {showPrivateKey && (
                    <button
                      onClick={() => copyToClipboard(walletState.privateKey!, '개인키')}
                        className="text-quantum-600 hover:text-quantum-700 transition-colors"
                        title="개인키 복사"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              </div>
                <div className="bg-white rounded-md p-3 border">
                  <p className="text-sm font-mono text-gray-800 break-all leading-relaxed">
                {showPrivateKey 
                  ? walletState.privateKey 
                      : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                }
              </p>
            </div>
              </div>
            )}

            {/* Mnemonic */}
            {walletState.mnemonic && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">복구 구문</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowMnemonic(!showMnemonic)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title={showMnemonic ? '복구 구문 숨기기' : '복구 구문 보기'}
                    >
                      {showMnemonic ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {showMnemonic && (
                  <button
                    onClick={() => copyToClipboard(walletState.mnemonic!, '복구 구문')}
                        className="text-quantum-600 hover:text-quantum-700 transition-colors"
                        title="복구 구문 복사"
                  >
                    <Copy size={16} />
                  </button>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-md p-3 border">
                  {showMnemonic ? (
                    <div className="grid grid-cols-3 gap-2">
                      {walletState.mnemonic.split(' ').map((word, index) => (
                        <div key={index} className="bg-gray-100 rounded px-2 py-1 text-center">
                          <span className="text-xs text-gray-500">{index + 1}</span>
                          <p className="text-sm font-medium text-gray-800">{word}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      복구 구문을 보려면 👁️ 버튼을 클릭하세요
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              <span>지갑 연결 해제</span>
            </button>
          </div>

          {/* Security Warning */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-1">보안 주의사항</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• 개인키와 복구 구문을 절대 타인과 공유하지 마세요</li>
                  <li>• 정기적으로 지갑을 백업하세요</li>
                  <li>• 안전한 장소에 복구 구문을 보관하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}