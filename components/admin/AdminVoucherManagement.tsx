'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Staff = {
  id: string
  number: number | null
  name: string
  role: string
}

type Distribution = {
  id: string
  quantity: number
  distributedAt: string
  staffConfirmed: boolean
  staff: {
    id: string
    name: string
    number: number | null
  }
  distributor: {
    name: string
  }
  createdAt: string
}

type Return = {
  id: string
  quantity: number
  distributedQty: number
  returnedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
  staff: {
    id: string
    name: string
    number: number | null
  }
  confirmer: {
    name: string
  } | null
}

type AdminReceive = {
  id: string
  quantity: number
  receivedAt: string
}

type AdminReturn = {
  id: string
  quantity: number
  returnedAt: string
}

type Props = {
  staffList: Staff[]
}

export default function AdminVoucherManagement({ staffList }: Props) {
  const router = useRouter()
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 현재 한국 시간 기준 날짜
  const getCurrentKSTDate = () => {
    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const year = kstTime.getFullYear()
    const month = String(kstTime.getMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 날짜 탭 (오늘 날짜를 기준으로 정렬)
  const allDates = ['2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-14']
  const currentDate = getCurrentKSTDate()
  
  // 오늘 날짜를 찾아서 앞으로 이동, 지난 날짜는 뒤로
  const sortedDates = (() => {
    const todayIndex = allDates.indexOf(currentDate)
    if (todayIndex === -1) {
      // 오늘 날짜가 리스트에 없으면 원래대로
      return allDates
    }
    // 오늘 날짜부터 시작하고, 지난 날짜는 뒤에 추가
    return [...allDates.slice(todayIndex), ...allDates.slice(0, todayIndex)]
  })()
  
  const [selectedDate, setSelectedDate] = useState(sortedDates[0])
  
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [adminReceives, setAdminReceives] = useState<AdminReceive[]>([])
  const [adminReturns, setAdminReturns] = useState<AdminReturn[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // 보기 모드
  const [viewMode, setViewMode] = useState<'time' | 'staff'>('time')
  
  // 매수 수정
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState('')

  // 날짜별 데이터 로드
  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/vouchers/list?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setDistributions(data.distributions || [])
        setReturns(data.returns || [])
        setAdminReceives(data.adminReceives || [])
        setAdminReturns(data.adminReturns || [])
      }
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStaffId || !quantity) {
      alert('스태프와 매수를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/vouchers/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaffId,
          quantity: parseInt(quantity)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '지급 실패')
        return
      }

      alert('지급되었습니다.')
      setShowDistributeModal(false)
      setSelectedStaffId('')
      setQuantity('')
      loadData()
      router.refresh()
    } catch (error) {
      alert('지급 처리 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmReturn = async (returnId: string) => {
    if (!confirm('회수를 확인하시겠습니까?')) return

    try {
      const response = await fetch('/api/admin/vouchers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '회수 확인 실패')
        return
      }

      alert('회수 확인되었습니다.')
      loadData()
      router.refresh()
    } catch (error) {
      alert('회수 확인 실패')
    }
  }

  const handleUpdateQuantity = async (distributionId: string) => {
    if (!editQuantity || parseInt(editQuantity) <= 0) {
      alert('매수를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/admin/vouchers/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributionId,
          quantity: parseInt(editQuantity)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '수정 실패')
        return
      }

      alert('수정되었습니다.')
      setEditingId(null)
      setEditQuantity('')
      loadData()
      router.refresh()
    } catch (error) {
      alert('수정 실패')
    }
  }

  // 스태프별로 그룹화
  const groupedData = staffList.map(staff => {
    const staffDistributions = distributions.filter(d => d.staff.id === staff.id)
    const staffReturns = returns.filter(r => r.staff.id === staff.id)
    
    const totalReceived = staffDistributions.reduce((sum, d) => sum + d.quantity, 0)
    const totalReturned = staffReturns.reduce((sum, r) => sum + r.quantity, 0)
    const totalDistributed = staffReturns.reduce((sum, r) => sum + r.distributedQty, 0)

    return {
      staff,
      distributions: staffDistributions,
      returns: staffReturns,
      totalReceived,
      totalReturned,
      totalDistributed
    }
  }).filter(item => item.distributions.length > 0 || item.returns.length > 0)

  // 전체 합계
  const totalAdminReceived = adminReceives.reduce((sum, r) => sum + r.quantity, 0) // 상인회에서 받은 수량
  const totalDistributedToStaff = distributions.reduce((sum, d) => sum + d.quantity, 0) // 스태프에게 배부한 수량
  const totalStaffReturned = returns.reduce((sum, r) => sum + r.quantity, 0) // 스태프가 반납한 수량
  const totalCustomerDelivered = returns.reduce((sum, r) => sum + r.distributedQty, 0) // 고객에게 배부한 수량
  const totalAdminReturned = adminReturns.reduce((sum, r) => sum + r.quantity, 0) // 상인회에 반납한 수량
  const currentRemaining = totalAdminReceived - totalDistributedToStaff - totalAdminReturned // 현재 남은 수량

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  
  const formatDateTime = (dateTimeStr: string) => {
    const dt = new Date(dateTimeStr)
    const month = dt.getMonth() + 1
    const day = dt.getDate()
    const hour = String(dt.getHours()).padStart(2, '0')
    const minute = String(dt.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  }

  return (
    <div className="space-y-6">
      {/* 상단 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowReceiveModal(true)}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
        >
          주최측 수령
        </button>
        <button
          onClick={() => setShowReturnModal(true)}
          className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
        >
          주최측 반납
        </button>
        <button
          onClick={() => setShowDistributeModal(true)}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          스태프 지급
        </button>
      </div>

      {/* 주최측 수령 모달 */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">주최측 수령</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!quantity || parseInt(quantity) <= 0) {
                alert('매수를 입력해주세요.')
                return
              }
              setIsSubmitting(true)
              try {
                const response = await fetch('/api/admin/vouchers/receive', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quantity: parseInt(quantity) })
                })
                if (!response.ok) {
                  const error = await response.json()
                  alert(error.error || '수령 실패')
                  return
                }
                alert('수령되었습니다.')
                setShowReceiveModal(false)
                setQuantity('')
                loadData()
                router.refresh()
              } catch (error) {
                alert('수령 처리 실패')
              } finally {
                setIsSubmitting(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수령 매수
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
                  placeholder="매수 입력"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? '처리중...' : '수령'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiveModal(false)
                    setQuantity('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 주최측 반납 모달 */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">주최측 반납</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!quantity || parseInt(quantity) <= 0) {
                alert('매수를 입력해주세요.')
                return
              }
              setIsSubmitting(true)
              try {
                const response = await fetch('/api/admin/vouchers/return-to-organizer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quantity: parseInt(quantity) })
                })
                if (!response.ok) {
                  const error = await response.json()
                  alert(error.error || '반납 실패')
                  return
                }
                alert('반납되었습니다.')
                setShowReturnModal(false)
                setQuantity('')
                loadData()
                router.refresh()
              } catch (error) {
                alert('반납 처리 실패')
              } finally {
                setIsSubmitting(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반납 매수
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  placeholder="매수 입력"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? '처리중...' : '반납'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false)
                    setQuantity('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스태프 지급 모달 */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">상품권 지급</h3>
            <form onSubmit={handleDistribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  스태프 선택
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={isSubmitting}
                  required
                >
                  <option value="">선택해주세요</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} {staff.number && `(${staff.number})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지급 매수
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="매수 입력"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? '처리중...' : '지급'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDistributeModal(false)
                    setSelectedStaffId('')
                    setQuantity('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 날짜 탭 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {sortedDates.map(date => {
            const dateObj = new Date(date)
            const display = `${date.split('-')[1]}/${date.split('-')[2]}(${weekdays[dateObj.getDay()]})`
            const isToday = date === currentDate
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white'
                    : isToday
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isToday ? `${display} [오늘]` : display}
              </button>
            )
          })}
        </div>
      </div>

      {/* 총 합계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* 첫 번째 줄 */}
          <div className="flex items-center justify-center gap-4 text-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">현재까지 상인회에서 받은 수량</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalAdminReceived}매
                <span className="block text-sm text-gray-500 mt-1">({(totalAdminReceived * 10000).toLocaleString()}원)</span>
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-400">-</span>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">스태프에게 배부한 수량</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalDistributedToStaff}매
                <span className="block text-sm text-gray-500 mt-1">({(totalDistributedToStaff * 10000).toLocaleString()}원)</span>
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-400">-</span>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">상인회에 반납한 수량</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalAdminReturned}매
                <span className="block text-sm text-gray-500 mt-1">({(totalAdminReturned * 10000).toLocaleString()}원)</span>
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-400">=</span>
            <div className="text-center bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">현재 남은 수량</p>
              <p className="text-3xl font-bold text-green-600">
                {currentRemaining}매
                <span className="block text-sm text-gray-500 mt-1">({(currentRemaining * 10000).toLocaleString()}원)</span>
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* 두 번째 줄 */}
            <div className="flex items-center justify-center gap-4 text-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">현재까지 스태프에게 배부한 수량</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalDistributedToStaff}매
                  <span className="block text-sm text-gray-500 mt-1">({(totalDistributedToStaff * 10000).toLocaleString()}원)</span>
                </p>
              </div>
              <span className="text-2xl font-bold text-gray-400">-</span>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">스태프가 반납한 수량</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalStaffReturned}매
                  <span className="block text-sm text-gray-500 mt-1">({(totalStaffReturned * 10000).toLocaleString()}원)</span>
                </p>
              </div>
              <span className="text-2xl font-bold text-gray-400">=</span>
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">고객에게 배부한 수량</p>
                <p className="text-3xl font-bold text-green-600">
                  {totalCustomerDelivered}매
                  <span className="block text-sm text-gray-500 mt-1">({(totalCustomerDelivered * 10000).toLocaleString()}원)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 지급 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">지급 목록</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('time')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'time'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              기본 보기
            </button>
            <button
              onClick={() => setViewMode('staff')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'staff'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              스태프별 모아보기
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : viewMode === 'time' ? (
          // 기본 보기 (시간순)
          distributions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">해당 날짜에 기록이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">지급일시</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">매수</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">스태프</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">번호</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">수령확인</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distributions.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDateTime(d.distributedAt)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingId === d.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              min="1"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-black"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(d.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditQuantity('')
                              }}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600">{d.quantity}매</span>
                            <button
                              onClick={() => {
                                setEditingId(d.id)
                                setEditQuantity(d.quantity.toString())
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              수정
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{d.staff.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{d.staff.number || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.staffConfirmed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                            수령확인
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                            수령미확인
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // 스태프별 모아보기
          groupedData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">해당 날짜에 기록이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">스태프</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">지급 내역</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">반납 내역</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">합계</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedData.map(item => (
                    <tr key={item.staff.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{item.staff.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{item.staff.number || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {item.distributions.map(d => (
                            <div key={d.id} className="text-xs flex items-center gap-2">
                              <span className="text-gray-600">{formatDateTime(d.distributedAt)}</span>
                              <span className="font-medium text-blue-600">{d.quantity}매</span>
                              {d.staffConfirmed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                                  수령확인
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                                  수령미확인
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {item.returns.map(r => (
                            <div key={r.id} className="text-xs flex items-center gap-2">
                              <span className="text-gray-600">{formatDateTime(r.returnedAt)}</span>
                              <span className="font-medium text-blue-600">반납 {r.quantity}매</span>
                              <span className="text-blue-400">(배부 {r.distributedQty}매)</span>
                              {r.confirmedBy ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                                  회수완료
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConfirmReturn(r.id)}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition"
                                >
                                  회수대기
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600">수령:</span>{' '}
                            <span className="font-medium text-blue-600">{item.totalReceived}매</span>
                          </div>
                          <div>
                            <span className="text-gray-600">반납:</span>{' '}
                            <span className="font-medium text-red-600">{item.totalReturned}매</span>
                          </div>
                          <div>
                            <span className="text-gray-600">배부:</span>{' '}
                            <span className="font-medium text-green-600">{item.totalDistributed}매</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
