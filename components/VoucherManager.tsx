'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type VoucherRecord = {
  id: string
  staffId: string
  managerConfirmed: boolean
  createdAt: Date
  staff: {
    id: string
    number: number | null
    name: string
  }
  receives: Array<{
    id: string
    quantity: number
    createdAt: Date
    createdByUser: {
      name: string
    }
  }>
  returns: Array<{
    id: string
    quantity: number
    createdAt: Date
    createdByUser: {
      name: string
    }
  }>
}

type Props = {
  currentUser: {
    id: string
    name: string
    role: string
  }
  records: VoucherRecord[]
}

export default function VoucherManager({ currentUser, records }: Props) {
  const [receiveQuantity, setReceiveQuantity] = useState<Record<string, string>>({})
  const [returnQuantity, setReturnQuantity] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const isAdmin = currentUser.role === 'admin'
  const isManager = currentUser.role === 'manager'
  const canConfirm = isAdmin || isManager

  // 자신의 레코드 찾기 (스태프용)
  const myRecord = records.find(r => r.staffId === currentUser.id)

  const handleAddReceive = async (recordId: string) => {
    const qty = parseInt(receiveQuantity[recordId] || '0')
    if (qty <= 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/vouchers/${recordId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '수령 기록 추가 실패')
        return
      }

      setReceiveQuantity({ ...receiveQuantity, [recordId]: '' })
      router.refresh()
    } catch (error) {
      alert('수령 기록 추가 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddReturn = async (recordId: string) => {
    const qty = parseInt(returnQuantity[recordId] || '0')
    if (qty <= 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/vouchers/${recordId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '반납 기록 추가 실패')
        return
      }

      setReturnQuantity({ ...returnQuantity, [recordId]: '' })
      router.refresh()
    } catch (error) {
      alert('반납 기록 추가 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirm = async (recordId: string) => {
    if (!confirm('이 레코드를 확인 처리하시겠습니까?')) return

    try {
      const response = await fetch(`/api/vouchers/${recordId}/confirm`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '확인 처리 실패')
        return
      }

      router.refresh()
    } catch (error) {
      alert('확인 처리 실패')
    }
  }

  const handleCreateRecord = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '레코드 생성 실패')
        return
      }

      router.refresh()
    } catch (error) {
      alert('레코드 생성 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateTotals = (record: VoucherRecord) => {
    const totalReceived = record.receives.reduce((sum, r) => sum + r.quantity, 0)
    const totalReturned = record.returns.reduce((sum, r) => sum + r.quantity, 0)
    const balance = totalReceived - totalReturned
    return { totalReceived, totalReturned, balance }
  }

  if (!isAdmin && !myRecord) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-gray-600 mb-4">아직 상품권 레코드가 생성되지 않았습니다.</p>
        <button
          onClick={handleCreateRecord}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 font-medium"
        >
          {isSubmitting ? '생성 중...' : '레코드 생성'}
        </button>
      </div>
    )
  }

  const displayRecords = isAdmin ? records : myRecord ? [myRecord] : []

  return (
    <div className="space-y-4 sm:space-y-6">
      {displayRecords.map((record) => {
        const { totalReceived, totalReturned, balance } = calculateTotals(record)
        const isOwner = record.staffId === currentUser.id

        return (
          <div key={record.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
            {/* 헤더 */}
            <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {record.staff.name}
                  {record.staff.number && (
                    <span className="text-gray-500 ml-2 text-sm sm:text-base font-normal block sm:inline">
                      (번호: {record.staff.number})
                    </span>
                  )}
                </h3>
                <div className="flex-shrink-0">
                  {record.managerConfirmed ? (
                    <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs sm:text-sm font-medium rounded whitespace-nowrap">
                      ✓ 확인
                    </span>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium rounded whitespace-nowrap text-center">
                        미확인
                      </span>
                      {canConfirm && (
                        <button
                          onClick={() => handleConfirm(record.id)}
                          className="px-2 sm:px-4 py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 active:bg-green-800 whitespace-nowrap"
                        >
                          확인
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                <span className="text-gray-600">
                  수령: <span className="font-semibold text-blue-600">{totalReceived}매</span>
                </span>
                <span className="text-gray-600">
                  반납: <span className="font-semibold text-green-600">{totalReturned}매</span>
                </span>
                <span className="text-gray-600">
                  잔액: <span className={`font-semibold ${balance > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {balance}매
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 수령 내역 */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">수령 내역</h4>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {record.receives.length === 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm py-2">수령 내역이 없습니다.</p>
                  ) : (
                    record.receives.map((receive) => (
                      <div key={receive.id} className="flex justify-between text-xs sm:text-sm bg-blue-50 p-2 rounded gap-2">
                        <span className="font-medium">{receive.quantity}매</span>
                        <span className="text-gray-600 text-right truncate">
                          {receive.createdByUser.name} · {new Date(receive.createdAt).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                
                {isOwner && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={receiveQuantity[record.id] || ''}
                      onChange={(e) => setReceiveQuantity({ ...receiveQuantity, [record.id]: e.target.value })}
                      placeholder="수령 매수"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleAddReceive(record.id)}
                      disabled={!receiveQuantity[record.id] || isSubmitting}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 font-medium text-sm whitespace-nowrap"
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>

              {/* 반납 내역 */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">반납 내역</h4>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {record.returns.length === 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm py-2">반납 내역이 없습니다.</p>
                  ) : (
                    record.returns.map((ret) => (
                      <div key={ret.id} className="flex justify-between text-xs sm:text-sm bg-green-50 p-2 rounded gap-2">
                        <span className="font-medium">{ret.quantity}매</span>
                        <span className="text-gray-600 text-right truncate">
                          {ret.createdByUser.name} · {new Date(ret.createdAt).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                
                {isOwner && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={returnQuantity[record.id] || ''}
                      onChange={(e) => setReturnQuantity({ ...returnQuantity, [record.id]: e.target.value })}
                      placeholder="반납 매수"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => handleAddReturn(record.id)}
                      disabled={!returnQuantity[record.id] || isSubmitting}
                      className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 font-medium text-sm whitespace-nowrap"
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
