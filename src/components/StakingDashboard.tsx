'use client';

import { FiTrendingUp, FiClock, FiDollarSign, FiActivity } from 'react-icons/fi';
import { StakingRecord, StakingStats } from '@/types/staking';
import { formatNumber, formatDate } from '@/utils/staking';

interface StakingDashboardProps {
  stakingRecords: StakingRecord[];
  stats: StakingStats;
}

export default function StakingDashboard({ stakingRecords, stats }: StakingDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'pending':
        return '대기중';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiDollarSign className="h-8 w-8 text-quantum-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 스테이킹</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalStaked)} QTC</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiTrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 수익</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(stats.totalRewards)} QTC</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiActivity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">진행중</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeStakings}개</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiClock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">완료</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completedStakings}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* 스테이킹 내역 테이블 */}
      <div className="card">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">스테이킹 내역</h3>
          <p className="text-gray-600">나의 스테이킹 현황을 확인하세요</p>
        </div>

        {stakingRecords.length === 0 ? (
          <div className="text-center py-12">
            <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">스테이킹 내역이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">첫 번째 스테이킹을 시작해보세요!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시작일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    만료일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예상 수익
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stakingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(record.amount)} QTC
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.period.name}</div>
                      <div className="text-sm text-gray-500">연 {record.period.apy}% APY</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        +{formatNumber(record.expectedReward)} QTC
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 