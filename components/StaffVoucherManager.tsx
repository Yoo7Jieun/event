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
  returnedAt: string
  confirmedBy: string | null
  confirmer: {
    name: string
  } | null
}

type SystemDistribution = {
  id: string
  quantity: number
  updatedAt: string
} | null

type Props = {
  userId: string
  userName: string
}

export default function StaffVoucherManager({ userId, userName }: Props) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState('')
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [systemDistribution, setSystemDistribution] = useState<SystemDistribution>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 시스템상 배부
  const [systemDistributedQty, setSystemDistributedQty] = useState('')
  const [isSavingSystem, setIsSavingSystem] = useState(false)
  
  // 반납
  const [returnQuantity, setReturnQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 수정
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState('')

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
        setSystemDistribution(data.systemDistribution || null)
        // DB에서 가져온 값으로 설정
        if (data.systemDistribution) {
          setSystemDistributedQty(data.systemDistribution.quantity.toString())
        } else {
          setSystemDistributedQty('')
        }
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

  const handleCancelConfirm = async (distributionId: string) => {
    if (!confirm('수령 확인을 취소하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/vouchers/confirm', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '취소 실패')
        return
      }

      alert('확인이 취소되었습니다.')
      loadData()
      router.refresh()
    } catch (error) {
      alert('취소 처리 실패')
    }
  }

  const handleSaveSystemDistribution = async () => {
    if (!systemDistributedQty || parseInt(systemDistributedQty) < 0) {
      alert('시스템상 배부 매수를 입력해주세요.')
      return
    }

    setIsSavingSystem(true)
    try {
      const response = await fetch('/api/vouchers/system-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(systemDistributedQty),
          date: currentDate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '저장 실패')
        return
      }

      alert('저장되었습니다.')
      loadData()
      router.refresh()
    } catch (error) {
      alert('저장 처리 실패')
    } finally {
      setIsSavingSystem(false)
    }
  }

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!returnQuantity || parseInt(returnQuantity) < 0) {
      alert('반납 예정 매수를 입력해주세요.')
      return
    }

    const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
    const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0)
    const systemQty = parseInt(systemDistributedQty || '0')
    const returnQty = parseInt(returnQuantity)
    const shouldRemain = totalReceived - totalReturned - systemQty
    const diff = returnQty - shouldRemain

    let diffMsg = ''
    if (diff === 0) {
      diffMsg = '✓ 정확합니다!'
    } else if (diff < 0) {
      diffMsg = `${Math.abs(diff)}장이 부족해요!`
    } else {
      diffMsg = `${diff}장이 더 많아요!`
    }

    if (!confirm(`반납 예정: ${returnQty}장\n남아있어야 할: ${shouldRemain}장\n${diffMsg}\n\n입력하시겠습니까?`)) {
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

      alert('반납되었습니다.')
      setReturnQuantity('')
      loadData()
      router.refresh()
    } catch (error) {
      alert('반납 처리 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditReturn = async (returnId: string) => {
    if (!editQuantity || parseInt(editQuantity) < 0) {
      alert('반납 예정 매수를 입력해주세요.')
      return
    }

    const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
    const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0)
    const systemQty = parseInt(systemDistributedQty || '0')
    const returnQty = parseInt(editQuantity)
    const shouldRemain = totalReceived - totalReturned - systemQty
    const diff = returnQty - shouldRemain

    let diffMsg = ''
    if (diff === 0) {
      diffMsg = '✓ 정확합니다!'
    } else if (diff < 0) {
      diffMsg = `${Math.abs(diff)}장이 부족해요!`
    } else {
      diffMsg = `${diff}장이 더 많아요!`
    }

    if (!confirm(`반납 예정: ${returnQty}장\n남아있어야 할: ${shouldRemain}장\n${diffMsg}\n\n수정하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch('/api/vouchers/return', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId,
          quantity: returnQty
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '수정 실패')
        return
      }

      alert('수정되었습니다.')
      setEditingReturnId(null)
      setEditQuantity('')
      loadData()
      router.refresh()
    } catch (error) {
      alert('수정 처리 실패')
    }
  }

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('반납 내역을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/vouchers/return', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '삭제 실패')
        return
      }

      alert('삭제되었습니다.')
      loadData()
      router.refresh()
    } catch (error) {
      alert('삭제 처리 실패')
    }
  }

  const startEditReturn = (returnItem: Return) => {
    setEditingReturnId(returnItem.id)
    setEditQuantity(returnItem.quantity.toString())
  }

  const cancelEditReturn = () => {
    setEditingReturnId(null)
    setEditQuantity('')
  }

  const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
  const totalReturned = returns.reduce((sum, r) => sum + r.quantity, 0)
  const systemQty = parseInt(systemDistributedQty || '0')
  const shouldRemain = totalReceived - totalReturned - systemQty
  const currentRemaining = totalReceived - totalReturned

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
              <h3 className="text-lg font-bold text-gray-900">받은 상품권 확인</h3>
              <p className="text-sm text-gray-600 mt-1">받으신 상품권 수량 확인 후 [확인] 버튼을 눌러주세요</p>
            </div>
            <div className="p-6">
              {distributions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">오늘 지급된 상품권이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {distributions.map(d => (
                    <div key={d.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{formatDateTime(d.distributedAt)}</p>
                          <p className="text-lg font-bold text-blue-600">{d.quantity}장</p>
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
                            확인
                          </button>
                        )}
                      </div>
                      {d.staffConfirmed && (
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => handleCancelConfirm(d.id)}
                            className="text-xs text-gray-500 hover:text-red-600 underline"
                          >
                            확인취소
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 수령 & 반납 총합 & 시스템상 배부 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-gray-700 mb-1">현재까지 수령한 총 매수</p>
                    <p className="text-3xl font-bold text-blue-600">{totalReceived}장</p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-gray-700 mb-1">현재까지 반납한 총 매수</p>
                    <p className="text-3xl font-bold text-red-600">{totalReturned}장</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      현재 시스템상 배부 매수 (중간확인용)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={systemDistributedQty}
                        onChange={(e) => setSystemDistributedQty(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        min="0"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="숫자 입력"
                      />
                      <button
                        onClick={handleSaveSystemDistribution}
                        disabled={isSavingSystem || !systemDistributedQty || systemDistributedQty === (systemDistribution?.quantity.toString() || '')}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isSavingSystem ? '저장중...' : '저장'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">(환급 어플에서 확인)</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-center">
                    {systemDistributedQty ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-1">현재</p>
                        <p className="text-3xl font-bold text-red-600">{totalReceived - totalReturned - parseInt(systemDistributedQty)}장</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">남아야!</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">시스템상 배부 매수를<br/>입력해주세요</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 반납하기 섹션 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-900">반납하기</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    반납 예정 매수 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(현재 가지고 있는 매수)</span>
                  </label>
                  <input
                    type="number"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="현재 몇 장 남았나요?"
                    disabled={isSubmitting || totalReceived === 0}
                  />
                </div>

                {systemDistributedQty && returnQuantity && (
                  <div className={`border-2 rounded-lg p-4 ${
                    parseInt(returnQuantity || '0') - shouldRemain === 0 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <p className="text-base font-medium text-gray-900">
                      {(() => {
                        const diff = parseInt(returnQuantity || '0') - shouldRemain
                        if (diff === 0) {
                          return <span className="text-green-600">✓ 정확합니다!</span>
                        } else if (diff < 0) {
                          return <span className="text-red-600 text-lg font-bold">{Math.abs(diff)}장이 부족해요!</span>
                        } else {
                          return <span className="text-red-600 text-lg font-bold">{diff}장이 더 많아요!</span>
                        }
                      })()}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || totalReceived === 0}
                  className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '처리중...' : '확인(반납하기)'}
                </button>
              </form>
            </div>
          </div>

          {/* 반납 내역 */}
          {returns.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">반납 내역</h3>
                <div className="text-sm">
                  <span className="text-gray-600">총 반납: </span>
                  <span className="font-bold text-red-600">{totalReturned}장</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {returns.map(r => (
                    <div key={r.id} className="p-4 bg-gray-50 rounded-lg">
                      {editingReturnId === r.id ? (
                        // 수정 모드
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              반납 예정 매수
                            </label>
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              min="0"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="현재 몇 장 남았나요?"
                            />
                          </div>
                          {systemDistributedQty && editQuantity && (
                            <div className={`border-2 rounded-lg p-3 ${
                              parseInt(editQuantity || '0') - shouldRemain === 0 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-red-50 border-red-300'
                            }`}>
                              <p className="text-sm font-medium text-gray-900">
                                {(() => {
                                  const diff = parseInt(editQuantity || '0') - shouldRemain
                                  if (diff === 0) {
                                    return <span className="text-green-600">✓ 정확합니다!</span>
                                  } else if (diff < 0) {
                                    return <span className="text-red-600 font-bold">{Math.abs(diff)}장이 부족해요!</span>
                                  } else {
                                    return <span className="text-red-600 font-bold">{diff}장이 더 많아요!</span>
                                  }
                                })()}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditReturn(r.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditReturn}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 일반 모드
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">{formatDateTime(r.returnedAt)}</p>
                            <p className="text-base">
                              <span className="font-bold text-blue-600">반납 {r.quantity}장</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.confirmedBy ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                                ✓ 회수완료
                              </span>
                            ) : (
                              <>
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                                  회수대기
                                </span>
                                <button
                                  onClick={() => startEditReturn(r)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteReturn(r.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 최종 정산 (합계) */}
          {returns.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-bold text-gray-900">최종 정산</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-600 mb-1">오늘 총 수령</p>
                      <p className="text-2xl font-bold text-blue-600">{totalReceived}장</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-600 mb-1">시스템상 배부</p>
                      <p className="text-2xl font-bold text-green-600">{systemQty}장</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-600 mb-1">오늘 총 반납</p>
                      <p className="text-2xl font-bold text-red-600">{totalReturned}장</p>
                      {systemDistributedQty && (
                        <p className="text-xs font-medium text-red-600 mt-2">
                          {(() => {
                            const finalShouldRemain = totalReceived - systemQty
                            const diff = totalReturned - finalShouldRemain
                            if (diff === 0) {
                              return <span className="text-green-600">✓ 정확</span>
                            } else if (diff < 0) {
                              return <span>{Math.abs(diff)}장 부족</span>
                            } else {
                              return <span>{diff}장 더 많음</span>
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
