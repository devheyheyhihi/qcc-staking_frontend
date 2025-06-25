'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Staking {
  id: number
  walletAddress: string
  stakedAmount: number
  stakingPeriod: number
  interestRate: number
  startDate: string
  endDate: string
  expectedReward: number
  actualReward?: number
  transactionHash: string
  returnTransactionHash?: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface ApiResponse {
  success: boolean
  data: Staking[]
  pagination: PaginationInfo
  count: number
}

interface InterestRate {
  period: number
  rate: number
  name: string
  label: string
}

interface InterestRateResponse {
  success: boolean
  data: InterestRate[]
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS = {
  active: '활성',
  completed: '완료',
  cancelled: '취소됨'
}

// 관리자 로그인 컴포넌트
function AdminLoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('관리자 비밀번호를 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      
      // 관리자 인증 API 호출
      const response = await fetch(`${API_BASE_URL}/staking/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('관리자 인증이 완료되었습니다.')
        sessionStorage.setItem('admin_authenticated', 'true')
        onLogin()
      } else {
        toast.error(data.message || '관리자 비밀번호가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('관리자 인증 오류:', error)
      toast.error('인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quantum-50 to-quantum-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-quantum-100">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 인증
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자 대시보드에 접근하려면 비밀번호를 입력해주세요
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="password" className="sr-only">
              관리자 비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-quantum-500 focus:border-quantum-500 focus:z-10 sm:text-sm"
              placeholder="관리자 비밀번호"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-quantum-600 hover:bg-quantum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  인증 중...
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="font-medium text-yellow-800 mb-1">💡 기본 관리자 계정</p>
              <p>비밀번호: <code className="bg-yellow-100 px-1 rounded">Test123!</code></p>
              <p className="mt-1">보안을 위해 로그인 후 비밀번호를 변경해주세요.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// 스테이킹 목록 탭 컴포넌트
function StakingListTab() {
  const [stakings, setStakings] = useState<Staking[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [limit, setLimit] = useState(20)

  const fetchStakings = async (page: number, status?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (status) {
        params.append('status', status)
      }

      const response = await fetch(`${API_BASE_URL}/staking/all?${params}`)
      const data: ApiResponse = await response.json()

      if (data.success) {
        setStakings(data.data)
        setPagination(data.pagination)
      } else {
        toast.error('스테이킹 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('스테이킹 목록 조회 오류:', error)
      toast.error('스테이킹 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStakings(currentPage, statusFilter || undefined)
  }, [currentPage, statusFilter, limit])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(6)
  }

  const truncateHash = (hash: string) => {
    if (!hash) return '-'
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-600 mx-auto mb-4"></div>
          <p className="text-quantum-700">스테이킹 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 필터 및 설정 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">상태 필터:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
            >
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">페이지당 항목:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="50">50개</option>
            </select>
          </div>

          {pagination && (
            <div className="text-sm text-gray-600">
              총 {pagination.totalItems}개 중 {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, pagination.totalItems)}개 표시
            </div>
          )}
        </div>
      </div>

      {/* 스테이킹 테이블 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지갑 주소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스테이킹 금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이자율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예상/실제 보상</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금 해시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반환 해시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stakings.map((staking) => (
                <tr key={staking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{staking.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs">
                      {truncateHash(staking.walletAddress)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(staking.stakedAmount)} QTC
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staking.stakingPeriod}일
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staking.interestRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-gray-600">예상: {formatAmount(staking.expectedReward)} QTC</div>
                      {staking.actualReward && (
                        <div className="text-green-600 font-medium">실제: {formatAmount(staking.actualReward)} QTC</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[staking.status]}`}>
                      {STATUS_LABELS[staking.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs">
                      {truncateHash(staking.transactionHash)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs">
                      {truncateHash(staking.returnTransactionHash || '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(staking.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
                  <span className="font-medium">{((currentPage - 1) * limit) + 1}</span>-
                  <span className="font-medium">{Math.min(currentPage * limit, pagination.totalItems)}</span>개 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-quantum-50 border-quantum-500 text-quantum-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 빈 상태 */}
      {stakings.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">스테이킹 데이터가 없습니다</h3>
          <p className="text-gray-500">
            {statusFilter ? `'${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}' 상태의 스테이킹이 없습니다.` : '아직 생성된 스테이킹이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  )
}

// 이자율 관리 탭 컴포넌트
function InterestRateTab() {
  const [rates, setRates] = useState<InterestRate[]>([])
  const [formRates, setFormRates] = useState<Record<string, string>>({})
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchInterestRates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/staking/rates`)
      const data: InterestRateResponse = await response.json()

      if (data.success) {
        setRates(data.data)
        // 폼 초기값 설정
        const initialRates: Record<string, string> = {}
        data.data.forEach(rate => {
          initialRates[rate.period.toString()] = rate.rate.toString()
        })
        setFormRates(initialRates)
      } else {
        toast.error('이자율 정보를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('이자율 조회 오류:', error)
      toast.error('이자율 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRates = async () => {
    if (!password.trim()) {
      toast.error('관리자 패스워드를 입력해주세요.')
      return
    }

    // 이자율 유효성 검사 및 변환
    const numericRates: Record<string, number> = {}
    for (const [period, rate] of Object.entries(formRates)) {
      const numRate = parseFloat(rate)
      if (isNaN(numRate) || numRate < 0) {
        toast.error(`${period}일 기간의 이자율을 올바르게 입력해주세요.`)
        return
      }
      numericRates[period] = numRate
    }

    try {
      setSaving(true)
      const response = await fetch(`${API_BASE_URL}/staking/rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          rates: numericRates
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('이자율이 성공적으로 업데이트되었습니다.')
        setPassword('')
        fetchInterestRates() // 최신 데이터 다시 불러오기
      } else {
        toast.error(data.message || '이자율 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('이자율 업데이트 오류:', error)
      toast.error('이자율 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleRateChange = (period: string, value: string) => {
    setFormRates(prev => ({
      ...prev,
      [period]: value
    }))
  }

  useEffect(() => {
    fetchInterestRates()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-600 mx-auto mb-4"></div>
          <p className="text-quantum-700">이자율 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">이자율 설정</h3>
        
        {/* 현재 이자율 표시 */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-700 mb-4">현재 이자율</h4>
          <div className="grid grid-cols-2 gap-4">
            {rates.map((rate) => (
              <div key={rate.period} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">{rate.label}</div>
                <div className="text-lg font-semibold text-quantum-600">{rate.rate}% APY</div>
              </div>
            ))}
          </div>
        </div>

        {/* 이자율 수정 폼 */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">이자율 수정</h4>
          
          <div className="space-y-4">
            {rates.map((rate) => (
              <div key={rate.period} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 w-24">
                  {rate.label}:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formRates[rate.period.toString()] || ''}
                    onChange={(e) => handleRateChange(rate.period.toString(), e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
                    placeholder="0.0"
                  />
                  <span className="text-sm text-gray-500">% APY</span>
                </div>
              </div>
            ))}
          </div>

          {/* 관리자 패스워드 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관리자 패스워드
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
              placeholder="관리자 패스워드를 입력하세요"
            />
          </div>

          {/* 저장 버튼 */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setPassword('')
                fetchInterestRates()
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500"
            >
              취소
            </button>
            <button
              onClick={handleSaveRates}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-quantum-600 hover:bg-quantum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 관리자 비밀번호 변경 탭 컴포넌트
function AdminPasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminStatus, setAdminStatus] = useState<any>(null)

  const fetchAdminStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staking/admin/status`)
      const data = await response.json()

      if (data.success) {
        setAdminStatus(data.data)
      }
    } catch (error) {
      console.error('관리자 상태 조회 오류:', error)
    }
  }

  const handleChangePassword = async () => {
    // 입력값 검증
    if (!currentPassword.trim()) {
      toast.error('현재 비밀번호를 입력해주세요.')
      return
    }

    if (!newPassword.trim()) {
      toast.error('새 비밀번호를 입력해주세요.')
      return
    }

    if (newPassword.length < 8) {
      toast.error('새 비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/staking/admin/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('관리자 비밀번호가 성공적으로 변경되었습니다.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        fetchAdminStatus() // 상태 업데이트
      } else {
        toast.error(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      toast.error('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  useEffect(() => {
    fetchAdminStatus()
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">관리자 비밀번호 변경</h3>
        
        {/* 관리자 계정 상태 */}
        {adminStatus && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-blue-900 mb-2">관리자 계정 정보</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>계정 설정 상태: {adminStatus.isSetup ? '✅ 설정됨' : '❌ 미설정'}</div>
              {adminStatus.createdAt && (
                <div>계정 생성일: {new Date(adminStatus.createdAt).toLocaleString('ko-KR')}</div>
              )}
              {adminStatus.updatedAt && (
                <div>마지막 변경일: {new Date(adminStatus.updatedAt).toLocaleString('ko-KR')}</div>
              )}
            </div>
          </div>
        )}

        {/* 보안 안내 */}
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>보안 안내:</strong> 
                <br />• 새 비밀번호는 최소 8자 이상이어야 합니다.
                <br />• 영문, 숫자, 특수문자를 조합하여 사용하는 것을 권장합니다.
                <br />• 정기적으로 비밀번호를 변경해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 폼 */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
              placeholder="현재 비밀번호를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
              placeholder="새 비밀번호를 입력하세요 (최소 8자)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-quantum-500"
              placeholder="새 비밀번호를 다시 입력하세요"
            />
          </div>

          {/* 비밀번호 강도 표시 */}
          {newPassword && (
            <div className="text-sm">
              <div className="text-gray-600 mb-1">비밀번호 강도:</div>
              <div className="flex space-x-1">
                <div className={`h-2 w-full rounded ${newPassword.length >= 8 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-full rounded ${/[A-Z]/.test(newPassword) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-full rounded ${/[0-9]/.test(newPassword) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-full rounded ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                길이 8자 이상, 대문자, 숫자, 특수문자 포함 권장
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500"
            >
              초기화
            </button>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-quantum-600 hover:bg-quantum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AllStakingsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'rates' | 'password'>('list')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = sessionStorage.getItem('admin_authenticated')
      setIsAuthenticated(authenticated === 'true')
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  // 로그아웃 처리
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    setIsAuthenticated(false)
    toast.success('로그아웃되었습니다.')
  }

  // 로그인 처리
  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quantum-50 to-quantum-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-600 mx-auto mb-4"></div>
          <p className="text-quantum-700">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return <AdminLoginForm onLogin={handleLogin} />
  }

  const tabs = [
    { id: 'list', name: '스테이킹 목록', icon: '📊' },
    { id: 'rates', name: '이자율 설정', icon: '⚙️' },
    { id: 'password', name: '비밀번호 변경', icon: '🔐' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-quantum-50 to-quantum-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-quantum-900 mb-2">관리 대시보드</h1>
            <p className="text-quantum-600">스테이킹 현황 및 설정을 관리할 수 있습니다.</p>
          </div>
          
          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            🔓 로그아웃
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'rates' | 'password')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-quantum-500 text-quantum-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === 'list' && <StakingListTab />}
          {activeTab === 'rates' && <InterestRateTab />}
          {activeTab === 'password' && <AdminPasswordTab />}
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-quantum-300 rounded-md shadow-sm text-sm font-medium text-quantum-700 bg-white hover:bg-quantum-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>
    </div>
  )
} 