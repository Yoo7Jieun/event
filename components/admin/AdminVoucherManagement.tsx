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
  
  // 인라인 입력 폼
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [distributeStaffId, setDistributeStaffId] = useState('')
  const [distributeQuantity, setDistributeQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 실제 반납 수량 입력
  const [actualRemaining, setActualRemaining] = useState('')
  const [isEditingReturn, setIsEditingReturn] = useState(false)

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
  
  // 필터
  const [activityFilter, setActivityFilter] = useState<'all' | 'admin' | 'staff'>('all')
  
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

  // 통합 활동 리스트 생성
  type Activity = {
    id: string
    type: 'admin_receive' | 'staff_distribute' | 'staff_return' | 'admin_return'
    timestamp: Date
    quantity: number
    staffName: string
    staffNumber: number | null
    confirmed: boolean
    confirmedBy?: string | null
  }

  const allActivities: Activity[] = [
    ...adminReceives.map(r => ({
      id: r.id,
      type: 'admin_receive' as const,
      timestamp: new Date(r.receivedAt),
      quantity: r.quantity,
      staffName: '관리자',
      staffNumber: null,
      confirmed: true
    })),
    ...distributions.map(d => ({
      id: d.id,
      type: 'staff_distribute' as const,
      timestamp: new Date(d.distributedAt),
      quantity: d.quantity,
      staffName: d.staff.name,
      staffNumber: d.staff.number,
      confirmed: d.staffConfirmed
    })),
    ...returns.map(r => ({
      id: r.id,
      type: 'staff_return' as const,
      timestamp: new Date(r.returnedAt),
      quantity: r.quantity,
      staffName: r.staff.name,
      staffNumber: r.staff.number,
      confirmed: !!r.confirmedBy,
      confirmedBy: r.confirmedBy
    })),
    ...adminReturns.map(r => ({
      id: r.id,
      type: 'admin_return' as const,
      timestamp: new Date(r.returnedAt),
      quantity: r.quantity,
      staffName: '관리자',
      staffNumber: null,
      confirmed: true
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // 필터링된 활동
  const filteredActivities = allActivities.filter(activity => {
    if (activityFilter === 'admin') {
      return activity.type === 'admin_receive' || activity.type === 'admin_return'
    }
    if (activityFilter === 'staff') {
      return activity.type === 'staff_distribute' || activity.type === 'staff_return'
    }
    return true
  })

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'admin_receive': return '팀장수령'
      case 'staff_distribute': return '스태프배부'
      case 'staff_return': return '스태프반납'
      case 'admin_return': return '팀장반납'
    }
  }

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'admin_receive': return 'bg-purple-100 text-purple-700'
      case 'staff_distribute': return 'bg-blue-100 text-blue-700'
      case 'staff_return': return 'bg-red-100 text-red-700'
      case 'admin_return': return 'bg-orange-100 text-orange-700'
    }
  }

  const handleDelete = async (activity: Activity) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return

    let endpoint = ''
    let body = {}

    switch (activity.type) {
      case 'admin_receive':
        endpoint = '/api/admin/vouchers/delete-receive'
        body = { receiveId: activity.id }
        break
      case 'staff_distribute':
        endpoint = '/api/admin/vouchers/delete-distribution'
        body = { distributionId: activity.id }
        break
      case 'staff_return':
        endpoint = '/api/admin/vouchers/delete-staff-return'
        body = { returnId: activity.id }
        break
      case 'admin_return':
        endpoint = '/api/admin/vouchers/delete-return'
        body = { returnId: activity.id }
        break
    }

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
      alert('삭제 실패')
    }
  }

  // 스태프별로 그룹화 (관리자 행 추가)
  const adminGroupData = {
    staff: { id: 'admin', name: '관리자(팀장)', number: null },
    distributions: adminReceives,
    returns: adminReturns,
    totalReceived: adminReceives.reduce((sum, r) => sum + r.quantity, 0),
    totalReturned: adminReturns.reduce((sum, r) => sum + r.quantity, 0),
    totalDistributed: 0
  }

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
  const totalAdminReceived = adminReceives.reduce((sum, r) => sum + r.quantity, 0) // 총 수령
  const totalDistributedToStaff = distributions.reduce((sum, d) => sum + d.quantity, 0) // 스태프 배부
  const totalStaffReturned = returns.reduce((sum, r) => sum + r.quantity, 0) // 스태프 반납
  const totalCustomerDelivered = returns.reduce((sum, r) => sum + r.distributedQty, 0) // 고객 배부
  const totalAdminReturned = adminReturns.reduce((sum, r) => sum + r.quantity, 0) // 실제 반납한 수량
  const currentRemaining = totalAdminReceived - totalDistributedToStaff + totalStaffReturned // 현재 남은 수량(반납예정)
  const difference = totalAdminReturned - currentRemaining // 오차 (실제 - 남은수량)

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
      {/* 날짜 탭 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 overflow-x-auto mb-4">
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

        {/* 인라인 입력 폼 */}
        <div className="border-t pt-4 space-y-3">
          {/* 수령 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-16">수령</label>
            <input
              type="number"
              value={receiveQuantity}
              onChange={(e) => setReceiveQuantity(e.target.value)}
              min="1"
              placeholder="매수"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
              disabled={isSubmitting}
            />
            <button
              onClick={async () => {
                if (!receiveQuantity || parseInt(receiveQuantity) <= 0) {
                  alert('매수를 입력해주세요.')
                  return
                }
                setIsSubmitting(true)
                try {
                  const response = await fetch('/api/admin/vouchers/receive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: parseInt(receiveQuantity) })
                  })
                  if (!response.ok) {
                    const error = await response.json()
                    alert(error.error || '수령 실패')
                    return
                  }
                  alert('수령되었습니다.')
                  setReceiveQuantity('')
                  loadData()
                  router.refresh()
                } catch (error) {
                  alert('수령 처리 실패')
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting || !receiveQuantity}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
            >
              저장
            </button>
          </div>

          {/* 지급 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-16">지급</label>
            <select
              value={distributeStaffId}
              onChange={(e) => setDistributeStaffId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
              disabled={isSubmitting}
            >
              <option value="">스태프 선택</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} {staff.number && `(${staff.number})`}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={distributeQuantity}
              onChange={(e) => setDistributeQuantity(e.target.value)}
              min="1"
              placeholder="매수"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
              disabled={isSubmitting}
            />
            <button
              onClick={async () => {
                if (!distributeStaffId || !distributeQuantity || parseInt(distributeQuantity) <= 0) {
                  alert('스태프와 매수를 입력해주세요.')
                  return
                }
                setIsSubmitting(true)
                try {
                  const response = await fetch('/api/admin/vouchers/distribute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      staffId: distributeStaffId,
                      quantity: parseInt(distributeQuantity)
                    })
                  })
                  if (!response.ok) {
                    const error = await response.json()
                    alert(error.error || '지급 실패')
                    return
                  }
                  alert('지급되었습니다.')
                  setDistributeStaffId('')
                  setDistributeQuantity('')
                  loadData()
                  router.refresh()
                } catch (error) {
                  alert('지급 처리 실패')
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting || !distributeStaffId || !distributeQuantity}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 활동 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">활동 목록</h3>
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
          {/* 필터 버튼 (기본 보기일 때만) */}
          {viewMode === 'time' && (
            <div className="flex gap-2">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activityFilter === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setActivityFilter('admin')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activityFilter === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                팀장 활동
              </button>
              <button
                onClick={() => setActivityFilter('staff')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activityFilter === 'staff'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                스태프 활동
              </button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : viewMode === 'time' ? (
          // 기본 보기 (통합 활동 리스트)
          filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">해당 날짜에 기록이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">액션 일시</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">액션 내용</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">담당자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">매수</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">삭제</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map(activity => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDateTime(activity.timestamp.toISOString())}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                          {getActivityTypeLabel(activity.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{activity.staffName}</span>
                        {activity.staffNumber && (
                          <span className="text-xs text-gray-500 ml-2">({activity.staffNumber})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{activity.quantity}매</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {(activity.type === 'staff_distribute' || activity.type === 'staff_return') ? (
                          activity.confirmed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                              확인완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-white">
                              확인대기
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(activity)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          삭제
                        </button>
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
                  {/* 관리자(팀장) 행 */}
                  <tr className="bg-purple-50 hover:bg-purple-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-purple-900">관리자(팀장)</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600">-</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {adminReceives.map(r => (
                          <div key={r.id} className="text-xs flex items-center gap-2">
                            <span className="text-gray-600">{formatDateTime(r.receivedAt)}</span>
                            <span className="font-medium text-purple-600">{r.quantity}매 수령</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {adminReturns.map(r => (
                          <div key={r.id} className="text-xs flex items-center gap-2">
                            <span className="text-gray-600">{formatDateTime(r.returnedAt)}</span>
                            <span className="font-medium text-orange-600">{r.quantity}매 반납</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">수령:</span>{' '}
                          <span className="font-medium text-purple-600">{adminGroupData.totalReceived}매</span>
                        </div>
                        <div>
                          <span className="text-gray-600">반납:</span>{' '}
                          <span className="font-medium text-orange-600">{adminGroupData.totalReturned}매</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* 스태프 행들 */}
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

      {/* 총 합계 - 모바일 친화적 세로 레이아웃 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* 첫 번째 줄: 총 수령 - 스태프 배부 + 스태프 반납 */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">총 수령</p>
              <p className="text-xl font-bold text-purple-600">
                {totalAdminReceived}매
                <span className="block text-xs text-gray-500">({(totalAdminReceived * 10000).toLocaleString()}원)</span>
              </p>
            </div>
            <span className="text-xl font-bold text-gray-400">-</span>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">스태프 배부</p>
              <p className="text-xl font-bold text-blue-600">
                {totalDistributedToStaff}매
                <span className="block text-xs text-gray-500">({(totalDistributedToStaff * 10000).toLocaleString()}원)</span>
              </p>
            </div>
            <span className="text-xl font-bold text-gray-400">+</span>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">스태프 반납</p>
              <p className="text-xl font-bold text-red-600">
                {totalStaffReturned}매
                <span className="block text-xs text-gray-500">({(totalStaffReturned * 10000).toLocaleString()}원)</span>
              </p>
            </div>
          </div>

          {/* 두 번째 줄: = 남은수량 | 실제(오차) */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-400">=</span>
                <div className="text-center bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">남은 수량</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currentRemaining}매
                    <span className="block text-xs text-gray-500">({(currentRemaining * 10000).toLocaleString()}원)</span>
                  </p>
                </div>
              </div>

              <div className="h-12 border-l-2 border-gray-300"></div>

              <div className="text-center bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">실제 반납 수량</p>
                {isEditingReturn ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={actualRemaining}
                      onChange={(e) => setActualRemaining(e.target.value)}
                      min="0"
                      className="w-20 px-2 py-1 border border-orange-300 rounded text-black text-center"
                      placeholder="매수"
                    />
                    <button
                      onClick={async () => {
                        if (!actualRemaining || parseInt(actualRemaining) < 0) {
                          alert('올바른 매수를 입력해주세요.')
                          return
                        }
                        setIsSubmitting(true)
                        try {
                          const response = await fetch('/api/admin/vouchers/return-to-organizer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quantity: parseInt(actualRemaining) })
                          })
                          if (!response.ok) {
                            const error = await response.json()
                            alert(error.error || '저장 실패')
                            return
                          }
                          alert('저장되었습니다.')
                          setIsEditingReturn(false)
                          loadData()
                          router.refresh()
                        } catch (error) {
                          alert('저장 실패')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                      disabled={isSubmitting}
                      className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingReturn(false)
                        setActualRemaining('')
                      }}
                      disabled={isSubmitting}
                      className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-xl font-bold text-orange-600">{totalAdminReturned}매</p>
                      <button
                        onClick={() => {
                          setIsEditingReturn(true)
                          setActualRemaining(totalAdminReturned.toString())
                        }}
                        className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                      >
                        수정
                      </button>
                    </div>
                    {difference !== 0 && (
                      <p className={`text-xs mt-1 font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        오차: {difference >= 0 ? '+' : ''}{difference}매 ({(difference * 10000).toLocaleString()}원)
                      </p>
                    )}
                  </div>
                )}
                {isEditingReturn && actualRemaining && (
                  <p className={`text-xs mt-1 font-bold ${parseInt(actualRemaining) - currentRemaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    오차: {parseInt(actualRemaining) - currentRemaining >= 0 ? '+' : ''}{parseInt(actualRemaining) - currentRemaining}매
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 세 번째 줄: 고객 배부 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-center">
              <div className="text-center bg-blue-50 rounded-lg p-3 min-w-[200px]">
                <p className="text-xs text-gray-600 mb-1">고객 배부</p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalCustomerDelivered}매
                  <span className="block text-xs text-gray-500">({(totalCustomerDelivered * 10000).toLocaleString()}원)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
