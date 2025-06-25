'use client';

import React, { useState, useRef } from 'react';
import { X, Wallet, Key, FileText, Upload, Plus } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import toast from 'react-hot-toast';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { createWallet, importFromMnemonic, importFromKeyFile, walletState } = useWallet();
  const [activeTab, setActiveTab] = useState<'connect' | 'create' | 'import'>('connect');
  const [importMethod, setImportMethod] = useState<'mnemonic' | 'keyfile'>('mnemonic');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateWallet = async () => {
    try {
      const newWallet = await createWallet();
      if (newWallet) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleImportMnemonic = async () => {
    if (!mnemonicInput.trim()) {
      toast.error('복구 구문을 입력해주세요.');
      return;
    }

    try {
      const wallet = await importFromMnemonic(mnemonicInput.trim());
      if (wallet) {
        setMnemonicInput('');
        onClose();
      }
    } catch (error) {
      console.error('Failed to import from mnemonic:', error);
    }
  };

  const handleKeyFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    if (!file.name.endsWith('.qcc')) {
      toast.error('올바른 키파일을 선택해주세요. (.qcc)');
      return;
    }

    try {
      const wallet = await importFromKeyFile(file);
      if (wallet) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to import from key file:', error);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setMnemonicInput('');
    setImportMethod('mnemonic');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (tab: 'connect' | 'create' | 'import') => {
    setActiveTab(tab);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quantum Chain 지갑</h2>
          <button
            onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

          {/* 탭 네비게이션 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'connect'
                  ? 'bg-white text-quantum-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
              onClick={() => handleTabChange('connect')}
          >
              시작하기
          </button>
          <button
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                  ? 'bg-white text-quantum-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
              onClick={() => handleTabChange('create')}
          >
              새 지갑
          </button>
          <button
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                  ? 'bg-white text-quantum-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
              onClick={() => handleTabChange('import')}
          >
            가져오기
          </button>
        </div>

          {/* 시작하기 탭 */}
        {activeTab === 'connect' && (
          <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-quantum-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-quantum-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quantum Chain 스테이킹에 오신 것을 환영합니다
                </h3>
                <p className="text-gray-600 text-sm">
                  지갑을 연결하여 QCC 토큰을 스테이킹하고 보상을 받아보세요.
            </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('create')}
                  className="w-full flex items-center justify-center space-x-3 bg-quantum-600 text-white py-3 px-4 rounded-lg hover:bg-quantum-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>새 지갑 생성</span>
                </button>
            <button
                  onClick={() => setActiveTab('import')}
                  className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
                  <Upload size={20} />
                  <span>기존 지갑 가져오기</span>
            </button>
              </div>
          </div>
        )}

          {/* 새 지갑 생성 탭 */}
        {activeTab === 'create' && (
          <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  새 지갑 생성
                </h3>
                <p className="text-gray-600 text-sm">
                  새로운 Quantum Chain 지갑을 생성합니다. 12개 단어의 복구 구문이 생성됩니다.
            </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">중요한 안내</h4>
                    <p className="text-xs text-yellow-700">
                      생성된 복구 구문은 안전한 곳에 보관하세요. 복구 구문을 잃어버리면 지갑에 접근할 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>

            <button
              onClick={handleCreateWallet}
                disabled={walletState.isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Wallet size={20} />
                <span>{walletState.isLoading ? '생성 중...' : '지갑 생성'}</span>
            </button>
          </div>
        )}

          {/* 지갑 가져오기 탭 */}
        {activeTab === 'import' && (
          <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  지갑 가져오기
                </h3>
                <p className="text-gray-600 text-sm">
                  기존 지갑을 복구 구문이나 키파일로 가져오세요.
            </p>
              </div>

              {/* 가져오기 방법 선택 */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'mnemonic'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setImportMethod('mnemonic')}
                >
                  복구 구문
            </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'keyfile'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setImportMethod('keyfile')}
                >
                  키파일
                </button>
              </div>

              {/* 복구 구문으로 가져오기 */}
              {importMethod === 'mnemonic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      복구 구문 (12개 단어)
                    </label>
                    <textarea
                      value={mnemonicInput}
                      onChange={(e) => setMnemonicInput(e.target.value)}
                      placeholder="12개 단어를 공백으로 구분하여 입력하세요"
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
            <button
              onClick={handleImportMnemonic}
                    disabled={walletState.isLoading || !mnemonicInput.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText size={20} />
                    <span>{walletState.isLoading ? '가져오는 중...' : '복구 구문으로 가져오기'}</span>
            </button>
          </div>
        )}

              {/* 키파일로 가져오기 */}
              {importMethod === 'keyfile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      키파일 (.qcc)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".qcc"
                      onChange={handleKeyFileUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={walletState.isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quantum Chain 키파일 (.qcc)을 선택하세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}