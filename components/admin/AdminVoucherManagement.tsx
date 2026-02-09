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

type Props = {
  staffList: Staff[]
}

export default function AdminVoucherManagement({ staffList }: Props) {
  const router = useRouter()
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 날짜 탭
  const dates = ['2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-14']
  const [selectedDate, setSelectedDate] = useState(dates[0])
  
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
  const grandTotalDistributed = distributions.reduce((sum, d) => sum + d.quantity, 0)
  const grandTotalReturned = returns.reduce((sum, r) => sum + r.quantity, 0)
  const grandTotalDelivered = returns.reduce((sum, r) => sum + r.distributedQty, 0)

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
          onClick={() => setShowDistributeModal(true)}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          지급
        </button>
      </div>

      {/* 지급 모달 */}
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
          {dates.map(date => {
            const dateObj = new Date(date)
            const display = `${date.split('-')[1]}/${date.split('-')[2]}(${weekdays[dateObj.getDay()]})`
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {display}
              </button>
            )
          })}
        </div>
      </div>

      {/* 총 합계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">총 지급 수량</p>
            <p className="text-3xl font-bold text-blue-600">{grandTotalDistributed}매</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">총 반납 수량</p>
            <p className="text-3xl font-bold text-red-600">{grandTotalReturned}매</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">총 배부 수량</p>
            <p className="text-3xl font-bold text-green-600">{grandTotalDelivered}매</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">금액 환산 (1만원/매)</p>
              <p className="text-xl font-bold text-blue-700">{(grandTotalDistributed * 10000).toLocaleString()}원</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">금액 환산 (1만원/매)</p>
              <p className="text-xl font-bold text-red-700">{(grandTotalReturned * 10000).toLocaleString()}원</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">금액 환산 (1만원/매)</p>
              <p className="text-xl font-bold text-green-700">{(grandTotalDelivered * 10000).toLocaleString()}원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 지급 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-bold text-gray-900">지급 목록</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : groupedData.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}
