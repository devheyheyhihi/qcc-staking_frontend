'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StakingForm from '@/components/StakingForm';
import StakingDashboard from '@/components/StakingDashboard';
import InterestRateInfo from '@/components/InterestRateInfo';
import { useWallet } from '@/lib/WalletContext';
import { StakingFormData, StakingRecord, StakingStats } from '@/types/staking';
import { 
  getStakingPeriods,
  calculateReward,
  formatNumber,
  formatDate
} from '@/utils/staking';
import { stakingApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiExternalLink } from 'react-icons/fi';

export default function Home() {
  const { walletState } = useWallet();
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'staking' | 'dashboard' | 'rates'>('staking');
  const [stakingRecords, setStakingRecords] = useState<StakingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지갑 연결 시 스테이킹 기록 로드
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      loadStakingRecords();
    }
  }, [walletState.isConnected, walletState.address]);

  // 스테이킹 기록 로드
  const loadStakingRecords = async () => {
    if (!walletState.address) return;

    try {
      setLoading(true);
      
      // 실제 이자율 데이터를 API에서 가져오기
      const stakingPeriods = await getStakingPeriods();
      const response = await stakingApi.getStakingsByWallet(walletState.address);
      
      if (response.success) {
        // API 응답을 StakingRecord 형식으로 변환 (실제 API 이자율 사용)
        const records: StakingRecord[] = response.data.map(item => {
          // 실제 API에서 가져온 이자율 데이터에서 해당 기간을 찾기
          const period = stakingPeriods.find(p => p.id === item.stakingPeriod.toString()) || {
            id: item.stakingPeriod.toString(),
            name: `${item.stakingPeriod}일`,
            days: item.stakingPeriod,
            apy: item.interestRate, // DB에서 가져온 실제 이자율 사용
          };
          
          return {
            id: item.id.toString(),
            amount: item.stakedAmount,
            period: period,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            status: item.status as 'pending' | 'active' | 'completed' | 'cancelled',
            expectedReward: item.expectedReward,
            actualReward: item.actualReward,
          };
        });
        
        setStakingRecords(records);
      }
    } catch (err) {
      console.error('스테이킹 기록 로드 실패:', err);
      setError('스테이킹 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 스테이킹 신청 (블록체인 전송 + DB 저장)
  const handleStakingSubmit = async (data: StakingFormData & { transactionHash: string }) => {
    if (!walletState.address) {
      alert('지갑 주소가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // API 요청 데이터 준비 (transactionHash 포함)
      const stakingData = {
        walletAddress: walletState.address,
        stakedAmount: data.amount,
        stakingPeriod: parseInt(data.periodId),
        transactionHash: data.transactionHash, // 블록체인 전송 해시 추가
      };

      // 백엔드 API 호출
      const response = await stakingApi.createStaking(stakingData);

      if (response.success) {
        // 성공 메시지를 더 예쁜 UI로 표시
        const successToast = toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      스테이킹 신청 완료! 🎉
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {data.amount} QCC 스테이킹이 성공적으로 신청되었습니다.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      트랜잭션: {data.transactionHash.slice(0, 20)}...
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    setActiveTab('dashboard'); // 대시보드로 이동
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-quantum-600 hover:text-quantum-500 focus:outline-none focus:ring-2 focus:ring-quantum-500"
                >
                  대시보드 보기
                  <FiExternalLink className="ml-1 w-3 h-3" />
                </button>
              </div>
            </div>
          ),
          {
            duration: 6000, // 6초 동안 표시
            position: 'top-center',
          }
        );
        
        // 스테이킹 기록 새로고침
        await loadStakingRecords();
        
        // 추가 성공 효과
        setTimeout(() => {
          toast.success('스테이킹 내역이 업데이트되었습니다!', {
            icon: '📊',
            duration: 3000,
          });
        }, 1000);
      } else {
        throw new Error('스테이킹 신청 실패');
      }
    } catch (err: any) {
      console.error('스테이킹 신청 실패:', err);
      setError(err.message || '스테이킹 신청에 실패했습니다.');
      
      // 에러 메시지도 더 예쁜 UI로
      toast.error(
        `스테이킹 신청 실패: ${err.message || '알 수 없는 오류가 발생했습니다.'}`,
        {
          duration: 5000,
          icon: '⚠️',
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // localStorage에서 privateKey 가져오기
  const getPrivateKey = (): string => {
    try {
      const walletData = localStorage.getItem('wallet');
      if (walletData) {
        const wallet = JSON.parse(walletData);
        return wallet.privateKey || wallet.private_key || '';
      }
      return '';
    } catch (error) {
      console.error('Private key 가져오기 실패:', error);
      return '';
    }
  };

  // 통계 계산
  const stats: StakingStats = {
    totalStaked: stakingRecords.reduce((sum, record) => sum + record.amount, 0),
    totalRewards: stakingRecords.reduce((sum, record) => sum + record.expectedReward, 0),
    activeStakings: stakingRecords.filter(record => record.status === 'active').length,
    completedStakings: stakingRecords.filter(record => record.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quantum-50 to-quantum-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">처리 중...</p>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('staking')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'staking'
                    ? 'border-quantum-500 text-quantum-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                스테이킹
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-quantum-500 text-quantum-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveTab('rates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rates'
                    ? 'border-quantum-500 text-quantum-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                이자율 정보
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'staking' && (
          <div>
            {!walletState.isConnected ? (
              <div className="card max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">지갑을 연결해주세요</h2>
                <p className="text-gray-600 mb-6">스테이킹을 시작하려면 먼저 지갑을 연결해야 합니다.</p>
              </div>
            ) : (
              <StakingForm
                walletBalance={walletState.balance}
                walletAddress={walletState.address || ''}
                privateKey={getPrivateKey()}
                onSubmit={handleStakingSubmit}
              />
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            {!walletState.isConnected ? (
              <div className="card max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">지갑을 연결해주세요</h2>
                <p className="text-gray-600 mb-6">대시보드를 확인하려면 먼저 지갑을 연결해야 합니다.</p>
              </div>
            ) : (
              <StakingDashboard
                stakingRecords={stakingRecords}
                stats={stats}
              />
            )}
          </div>
        )}

        {activeTab === 'rates' && <InterestRateInfo />}
      </main>
    </div>
  );
} 