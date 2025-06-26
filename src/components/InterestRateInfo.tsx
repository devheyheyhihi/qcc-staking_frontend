'use client';

import { useState, useEffect } from 'react';
import { FiSettings, FiTrendingUp } from 'react-icons/fi';
import { StakingPeriod } from '@/types/staking';
import { getStakingPeriods, calculateReward, calculateTotalReturn, formatNumber } from '@/utils/staking';

export default function InterestRateInfo() {
  const [calculatorAmount, setCalculatorAmount] = useState<number>(1000);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('30');
  const [stakingPeriods, setStakingPeriods] = useState<StakingPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 이자율 데이터 로드
  useEffect(() => {
    const loadStakingPeriods = async () => {
      try {
        setLoading(true);
        const periods = await getStakingPeriods();
        setStakingPeriods(periods);
        
        // 첫 번째 기간을 기본 선택값으로 설정
        if (periods.length > 0) {
          setSelectedPeriodId(periods[0].id);
        }
      } catch (error) {
        console.error('이자율 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStakingPeriods();
  }, []);

  const selectedPeriod = stakingPeriods.find(p => p.id === selectedPeriodId) || stakingPeriods[0];
  const calculatedReward = selectedPeriod ? calculateReward(calculatorAmount, selectedPeriod.apy, selectedPeriod.days) : 0;
  const totalReturn = selectedPeriod ? calculateTotalReturn(calculatorAmount, selectedPeriod.apy, selectedPeriod.days) : calculatorAmount;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-600 mx-auto mb-4"></div>
              <p className="text-quantum-700">이자율 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 이자율 안내 */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">스테이킹 이자율</h2>
          <p className="text-gray-600">기간별 연이율(APY)을 확인하고 수익을 계산해보세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stakingPeriods.map((period) => (
            <div key={period.id} className="bg-gradient-to-br from-quantum-50 to-quantum-100 rounded-lg p-6 border border-quantum-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{period.name}</h3>
                <div className="text-3xl font-bold text-quantum-600 mb-2">연 {period.apy}%</div>
                <p className="text-sm text-gray-600">연이율 (APY)</p>
              </div>
              <div className="mt-4 pt-4 border-t border-quantum-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">최소 금액:</span>
                  <span className="font-medium">1 QCC</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">락업 기간:</span>
                  <span className="font-medium">{period.days}일</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 수익 계산기 */}
      <div className="card">
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <FiSettings className="w-6 h-6 text-quantum-600" />
            <h3 className="text-xl font-bold text-gray-900">수익 계산기</h3>
          </div>
          <p className="text-gray-600 mt-1">스테이킹 금액과 기간을 선택하여 예상 수익을 계산해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 입력 폼 */}
          <div className="space-y-4">
            <div>
              <label className="label">스테이킹 금액 (QCC)</label>
              <input
                type="number"
                value={calculatorAmount || ''}
                onChange={(e) => setCalculatorAmount(Number(e.target.value) || 0)}
                min="1"
                step="1"
                className="input-field"
                placeholder="스테이킹할 QCC 수량을 입력하세요"
              />
            </div>

            <div>
              <label className="label">스테이킹 기간</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="input-field"
              >
                {stakingPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} (연 {period.apy}% APY)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 계산 결과 */}
          <div className="bg-gradient-to-br from-quantum-50 to-quantum-100 rounded-lg p-6 border border-quantum-200">
            <div className="flex items-center space-x-2 mb-4">
              <FiTrendingUp className="w-5 h-5 text-quantum-600" />
              <h4 className="text-lg font-semibold text-gray-900">예상 수익</h4>
            </div>

            {selectedPeriod && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">스테이킹 금액:</span>
                  <span className="text-lg font-semibold text-gray-900">{formatNumber(calculatorAmount)} QCC</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">스테이킹 기간:</span>
                  <span className="text-lg font-semibold text-gray-900">{selectedPeriod.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">연이율 (APY):</span>
                  <span className="text-lg font-semibold text-quantum-600">연 {selectedPeriod.apy}%</span>
                </div>

                <div className="border-t border-quantum-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">예상 이자:</span>
                    <span className="text-xl font-bold text-green-600">+{formatNumber(calculatedReward)} QCC</span>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-900 font-medium">총 수령액:</span>
                    <span className="text-2xl font-bold text-quantum-600">{formatNumber(totalReturn)} QCC</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 스테이킹 안내 */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">스테이킹 안내</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">스테이킹 방법</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-quantum-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>지갑을 연결하고 QCC 잔액을 확인합니다</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-quantum-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>스테이킹 기간과 금액을 선택합니다</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-quantum-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>스테이킹 지갑 주소로 QCC를 전송합니다</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-quantum-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>만기일에 원금과 이자를 자동으로 받습니다</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">주요 특징</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>높은 연이율로 안정적인 수익 창출</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>기간별 차등 이자율 적용</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>만기일 자동 원금 및 이자 지급</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>투명한 블록체인 기반 거래</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span>24/7 실시간 스테이킹 현황 확인</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 