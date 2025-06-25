'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiCopy, FiCheck, FiArrowRight, FiLoader } from 'react-icons/fi';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';
import { StakingFormData, StakingPeriod } from '@/types/staking';
import { getStakingPeriods, calculateReward, calculateTotalReturn, formatNumber, getStakingWalletAddress } from '@/utils/staking';
import { sendTransaction } from '@/api/transaction';
import { useWallet } from '@/lib/WalletContext';

interface StakingFormProps {
  walletBalance: number;
  walletAddress: string;
  privateKey: string;
  onSubmit: (data: StakingFormData & { transactionHash: string }) => void;
}

export default function StakingForm({ walletBalance, walletAddress, privateKey, onSubmit }: StakingFormProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stakingWalletAddress, setStakingWalletAddress] = useState<string>('');
  const [stakingPeriods, setStakingPeriods] = useState<StakingPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState<boolean>(true);
  const { updateBalance } = useWallet();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StakingFormData>({
    defaultValues: {
      periodId: '30',
      walletAddress: '',
    }
  });

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // 스테이킹 기간 로드
        setPeriodsLoading(true);
        const periods = await getStakingPeriods();
        setStakingPeriods(periods);
        
        // 첫 번째 기간을 기본값으로 설정
        if (periods.length > 0) {
          setValue('periodId', periods[0].id);
        }

        // 스테이킹 지갑 주소 로드
        const address = await getStakingWalletAddress();
        setStakingWalletAddress(address);
        setValue('walletAddress', address);
      } catch (error) {
        console.error('설정 로드 실패:', error);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setPeriodsLoading(false);
      }
    };

    loadConfiguration();
  }, [setValue]);

  const watchAmount = watch('amount', 0);
  const watchPeriodId = watch('periodId');

  // 현재 선택된 기간 계산
  const selectedPeriod = stakingPeriods.find(p => p.id === watchPeriodId) || stakingPeriods[0];

  // 지갑 주소 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(stakingWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 예상 수익 계산
  const amountNumber = Number(watchAmount) || 0;
  const expectedReward = selectedPeriod ? calculateReward(amountNumber, selectedPeriod.apy, selectedPeriod.days) : 0;
  const totalReturn = selectedPeriod ? calculateTotalReturn(amountNumber, selectedPeriod.apy, selectedPeriod.days) : amountNumber;

  const onFormSubmit = async (data: StakingFormData) => {
    if (!stakingWalletAddress) {
      toast.error('스테이킹 지갑 주소를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('블록체인으로 코인 전송 중...');
    
    try {
      console.log('스테이킹 데이터:', data);
      console.log('전송 정보:', {
        privateKey: privateKey ? '존재함' : '없음',
        toAddress: stakingWalletAddress,
        amount: data.amount.toString()
      });

      // 1. 먼저 실제 블록체인으로 코인 전송
      const txResult = await sendTransaction({
        privateKey: privateKey,
        toAddress: stakingWalletAddress,
        amount: data.amount.toString()
      });

      console.log('블록체인 전송 결과:', txResult);

      toast.dismiss(loadingToast);
      
      // 트랜잭션 해시 추출 (다양한 경로 확인)
      const transactionHash = txResult.txHash || 
                             txResult.data?.txhash || 
                             txResult.data?.txHash || 
                             txResult.data?.txid || 
                             txResult.data?.result?.txid;
      
      console.log('추출된 트랜잭션 해시:', transactionHash);
      
      if (transactionHash && transactionHash !== 'unknown') {
        toast.success(`블록체인 전송 성공! 트랜잭션: ${transactionHash.slice(0, 10)}...`);
        
        // 2. 전송 성공 시 스테이킹 데이터 제출 및 지갑 잔액 업데이트
        onSubmit({
          ...data,
          amount: Number(data.amount),
          transactionHash: transactionHash
        });
        
        // 3. 지갑 잔액 업데이트 (비동기로 실행)
        setTimeout(async () => {
          try {
            await updateBalance();
            console.log('지갑 잔액 업데이트 완료');
          } catch (error) {
            console.error('지갑 잔액 업데이트 실패:', error);
          }
        }, 3000); // 3초 후 잔액 업데이트 (블록체인 반영 시간 고려)
      } else {
        console.error('해시 추출 실패 - txResult:', txResult);
        throw new Error('트랜잭션 해시를 찾을 수 없습니다.');
      }

    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('블록체인 전송 실패:', error);
      console.error('에러 상세:', error.stack);
      toast.error(`전송 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때 표시
  if (periodsLoading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-600 mx-auto mb-4"></div>
            <p className="text-quantum-700">스테이킹 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">스테이킹 신청</h2>
        <p className="text-gray-600">Quantum Chain 코인을 스테이킹하여 수익을 얻으세요</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* 스테이킹 기간 선택 */}
        <div>
          <label className="label">스테이킹 기간</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stakingPeriods.map((period) => (
              <label
                key={period.id}
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  watchPeriodId === period.id
                    ? 'border-quantum-500 bg-quantum-50'
                    : 'border-gray-200 hover:border-quantum-300'
                }`}
              >
                <input
                  type="radio"
                  value={period.id}
                  {...register('periodId', { required: '스테이킹 기간을 선택해주세요' })}
                  className="sr-only"
                />
                <span className="text-lg font-semibold text-gray-900">{period.name}</span>
                <span className="text-sm text-quantum-600 font-medium">연 {period.apy}% APY</span>
              </label>
            ))}
          </div>
          {errors.periodId && (
            <p className="mt-1 text-sm text-red-600">{errors.periodId.message}</p>
          )}
        </div>

        {/* 스테이킹 금액 입력 */}
        <div>
          <label className="label">스테이킹 금액 (QCC)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="1"
              max={walletBalance}
              placeholder="스테이킹할 QCC 수량을 입력하세요"
              {...register('amount', {
                required: '스테이킹 금액을 입력해주세요',
                min: { value: 1, message: '최소 1 QCC 이상 입력해주세요' },
                max: { value: walletBalance, message: '보유 잔액을 초과할 수 없습니다' },
              })}
              className="input-field pr-20"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 text-sm">QCC</span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-gray-500">보유 잔액: {formatNumber(walletBalance)} QCC</span>
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                if (input) input.value = walletBalance.toString();
              }}
              className="text-quantum-600 hover:text-quantum-700 font-medium"
            >
              전액 사용
            </button>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* 예상 수익 정보 */}
        {amountNumber > 0 && (
          <div className="bg-quantum-50 rounded-lg p-4 border border-quantum-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">예상 수익</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">스테이킹 금액</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(amountNumber)} QCC</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">예상 이자</p>
                <p className="text-xl font-bold text-quantum-600">{formatNumber(expectedReward)} QCC</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">총 수령액</p>
                <p className="text-xl font-bold text-green-600">{formatNumber(totalReturn)} QCC</p>
              </div>
            </div>
          </div>
        )}

        {/* 스테이킹 지갑 주소 */}
        <div>
          <label className="label">스테이킹 지갑 주소</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">전송할 주소</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="text-quantum-600 hover:text-quantum-700 text-sm font-medium"
                >
                  {showQR ? 'QR 숨기기' : 'QR 보기'}
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-quantum-600 hover:text-quantum-700 text-sm font-medium"
                >
                  {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded p-3 border border-gray-200 font-mono text-sm break-all">
              {stakingWalletAddress}
            </div>
            {showQR && (
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <QRCode value={stakingWalletAddress} size={150} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={!amountNumber || amountNumber <= 0 || isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>블록체인 전송 중...</span>
            </>
          ) : (
            <>
              <span>스테이킹 신청</span>
              <FiArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* 주의사항 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">주의사항</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 스테이킹 신청 시 실제 블록체인으로 코인이 전송됩니다</li>
          <li>• 스테이킹 기간 동안 코인을 인출할 수 없습니다</li>
          <li>• 만기일에 원금과 이자가 자동으로 지급됩니다</li>
          <li>• 블록체인 전송 수수료가 별도로 발생할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
} 