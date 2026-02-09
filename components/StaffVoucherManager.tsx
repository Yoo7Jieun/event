'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Distribution = {
  id: string
  quantity: number
  distributedAt: string
  staffConfirmed: boolean
  distributor: {
    name: string
  }
}

type Return = {
  id: string
  quantity: number
  distributedQty: number
  returnedAt: string
  confirmedBy: string | null
  confirmer: {
    name: string
  } | null
}

type Props = {
  userId: string
  userName: string
}

export default function StaffVoucherManager({ userId, userName }: Props) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState('')
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [returnQuantity, setReturnQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // 한국 시간 기준 현재 날짜
    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const year = kstTime.getFullYear()
    const month = String(kstTime.getMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`
    setCurrentDate(date)
  }, [])

  useEffect(() => {
    if (!currentDate) return
    loadData()
  }, [currentDate])

  const loadData = async () => {
    if (!currentDate) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/vouchers/my?date=${currentDate}`)
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

  const handleConfirmDistribution = async (distributionId: string) => {
    try {
      const response = await fetch('/api/vouchers/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '확인 실패')
        return
      }

      alert('수령 확인되었습니다.')
      loadData()
      router.refresh()
    } catch (error) {
      alert('확인 처리 실패')
    }
  }

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!returnQuantity || parseInt(returnQuantity) <= 0) {
      alert('반납 매수를 입력해주세요.')
      return
    }

    const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
    const returnQty = parseInt(returnQuantity)

    if (returnQty > totalReceived) {
      alert(`당일 수령한 매수(${totalReceived}매)보다 많이 반납할 수 없습니다.`)
      return
    }

    if (!confirm(`${returnQty}매를 반납하시겠습니까?\n배부 매수: ${totalReceived - returnQty}매`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vouchers/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: returnQty,
          date: currentDate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '반납 실패')
        return
      }

      const result = await response.json()
      alert(`반납되었습니다.\n배부 매수: ${result.distributedQty}매`)
      setReturnQuantity('')
      loadData()
      router.refresh()
    } catch (error) {
      alert('반납 처리 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
  const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0)
  const totalDistributed = returns.reduce((sum, r) => sum + r.distributedQty, 0)

  const formatDateTime = (dateTimeStr: string) => {
    const dt = new Date(dateTimeStr)
    const month = dt.getMonth() + 1
    const day = dt.getDate()
    const hour = String(dt.getHours()).padStart(2, '0')
    const minute = String(dt.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  }

  if (!currentDate) return null

  const dateObj = new Date(currentDate)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const displayDate = `${currentDate.split('-')[1]}/${currentDate.split('-')[2]}(${weekdays[dateObj.getDay()]})`

  return (
    <div className="space-y-6">
      {/* 날짜 표시 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-lg font-bold text-gray-900">{displayDate} 상품권 현황</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          로딩 중...
        </div>
      ) : (
        <>
          {/* 수령 확인 섹션 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-900">수령 확인</h3>
              <p className="text-sm text-gray-600 mt-1">관리자가 입력한 지급 정보를 확인해주세요</p>
            </div>
            <div className="p-6">
              {distributions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">오늘 지급된 상품권이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {distributions.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">{formatDateTime(d.distributedAt)}</p>
                        <p className="text-lg font-bold text-blue-600">{d.quantity}매 지급</p>
                        <p className="text-xs text-gray-500">지급자: {d.distributor.name}</p>
                      </div>
                      {d.staffConfirmed ? (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                          ✓ 확인완료
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirmDistribution(d.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          수령 확인
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 반납하기 섹션 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-900">반납하기</h3>
              <p className="text-sm text-gray-600 mt-1">배부 후 남은 상품권을 반납해주세요</p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">오늘 수령</p>
                    <p className="text-xl font-bold text-blue-600">{totalReceived}매</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">반납</p>
                    <p className="text-xl font-bold text-red-600">{totalReturned}매</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">배부</p>
                    <p className="text-xl font-bold text-green-600">{totalDistributed}매</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    반납 매수
                  </label>
                  <input
                    type="number"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    min="1"
                    max={totalReceived}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-lg"
                    placeholder="반납할 매수를 입력하세요"
                    disabled={isSubmitting || totalReceived === 0}
                  />
                  {returnQuantity && (
                    <p className="mt-2 text-sm text-gray-600">
                      배부 매수: <span className="font-bold text-green-600">{totalReceived - parseInt(returnQuantity || '0')}매</span>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || totalReceived === 0}
                  className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '처리중...' : '반납하기'}
                </button>
              </form>
            </div>
          </div>

          {/* 반납 내역 */}
          {returns.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-bold text-gray-900">반납 내역</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {returns.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">{formatDateTime(r.returnedAt)}</p>
                        <p className="text-base">
                          <span className="font-bold text-red-600">반납 {r.quantity}매</span>
                          {' / '}
                          <span className="font-bold text-green-600">배부 {r.distributedQty}매</span>
                        </p>
                      </div>
                      {r.confirmedBy ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                          ✓ 회수완료
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                          회수대기
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
