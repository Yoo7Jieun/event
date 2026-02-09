'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Attendance = {
  id: string
  status: string
  reason: string | null
}

type Props = {
  userId: string
  userName: string
}

export default function AttendanceCheck({ userId, userName }: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // 현재 한국 시간
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // 한국 시간으로 현재 날짜/시간 계산
    const updateTime = () => {
      const now = new Date()
      const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
      setCurrentTime(kstTime)
      
      const year = kstTime.getFullYear()
      const month = String(kstTime.getMonth() + 1).padStart(2, '0')
      const day = String(kstTime.getDate()).padStart(2, '0')
      setCurrentDate(`${year}-${month}-${day}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // 1분마다 업데이트

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!currentDate) return

    // 출근 체크 데이터 로드
    const loadAttendance = async () => {
      try {
        const response = await fetch(`/api/attendance?date=${currentDate}`)
        if (response.ok) {
          const data = await response.json()
          if (data.attendances && data.attendances.length > 0) {
            setAttendance(data.attendances[0])
          }
        }
      } catch (error) {
        console.error('Load attendance error:', error)
      }
    }

    loadAttendance()
  }, [currentDate])

  if (!currentTime || !currentDate) return null

  // 출근 기간 체크 (2026/2/10 ~ 2026/2/14)
  const dateObj = new Date(currentDate)
  const startDate = new Date('2026-02-10')
  const endDate = new Date('2026-02-14')
  
  if (dateObj < startDate || dateObj > endDate) {
    return null // 기간 외에는 표시 안 함
  }

  const hour = currentTime.getHours()
  const minute = currentTime.getMinutes()
  const currentMinutes = hour * 60 + minute

  // 시간대별 버튼 활성화 체크
  const isNormalTimeWindow = hour >= 5 && (hour < 8 || (hour === 8 && minute <= 30)) // 05:00~08:30
  const isLateAbsentEnabled = currentMinutes >= 1080 || hour < 8 || (hour === 8 && minute <= 30) // 전날 18:00(1080분) 이후 또는 당일 08:30까지
  const allButtonsDisabled = hour > 8 || (hour === 8 && minute > 30) // 08:30 이후

  // 08:30 이후이고 아직 입력하지 않았으면 아예 숨김
  if (allButtonsDisabled && !attendance) {
    return null
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const displayDate = `${currentDate.split('-')[1]}/${currentDate.split('-')[2]}(${weekdays[dateObj.getDay()]})`

  const handleSubmit = async (status: string, needReason: boolean = false) => {
    if (needReason && !isEditing) {
      setIsEditing(true)
      return
    }

    if (needReason && !reason.trim()) {
      alert('사유를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate,
          status,
          reason: needReason ? reason : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '전송 실패')
        return
      }

      alert('전송되었습니다')
      setIsEditing(false)
      setReason('')
      router.refresh()
    } catch (error) {
      alert('전송 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (attendance) {
    // 이미 입력된 상태
    const statusText = attendance.status === 'normal' ? '출근이상무!' : 
                      attendance.status === 'late' ? '지각' : '결근'
    const statusColor = attendance.status === 'normal' ? 'text-green-600' : 'text-orange-600'
    
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{displayDate}</span>
            <span className={`text-sm font-bold ${statusColor}`}>
              ✓ {statusText}
              {attendance.reason && ` (${attendance.reason})`}
            </span>
          </div>
          {!allButtonsDisabled && (
            <button
              onClick={() => {
                setAttendance(null)
                setIsEditing(false)
                setReason('')
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              수정
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-medium text-gray-700">{displayDate}</span>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSubmit('normal')}
            disabled={!isNormalTimeWindow || allButtonsDisabled || isSubmitting}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            출근이상무!
          </button>
          <button
            onClick={() => handleSubmit('late', true)}
            disabled={!isLateAbsentEnabled || allButtonsDisabled || isSubmitting}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            지각
          </button>
          <button
            onClick={() => handleSubmit('absent', true)}
            disabled={!isLateAbsentEnabled || allButtonsDisabled || isSubmitting}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            결근
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="지각/결근 사유를 입력해주세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black"
            disabled={isSubmitting}
          />
          <button
            onClick={() => {
              setIsEditing(false)
              setReason('')
            }}
            disabled={isSubmitting}
            className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
