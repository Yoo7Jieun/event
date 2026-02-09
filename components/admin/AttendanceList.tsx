'use client'

type User = {
  id: string
  number: number | null
  name: string
  role: string
}

type Attendance = {
  id: string
  userId: string
  date: string
  status: string
  reason: string | null
}

type Props = {
  users: User[]
  attendances: Attendance[]
  dates: string[]
}

export default function AttendanceList({ users, attendances, dates }: Props) {
  // 출근 기록을 맵으로 변환
  const attendanceMap = new Map<string, Attendance>()
  attendances.forEach(att => {
    attendanceMap.set(`${att.userId}-${att.date}`, att)
  })

  const getAttendance = (userId: string, date: string) => {
    return attendanceMap.get(`${userId}-${date}`)
  }

  const getStatusDisplay = (attendance?: Attendance) => {
    if (!attendance) return { text: '-', color: 'text-gray-400', bg: '' }
    
    switch (attendance.status) {
      case 'normal':
        return { text: '✓', color: 'text-green-600', bg: 'bg-green-50' }
      case 'late':
        return { text: '지각', color: 'text-orange-600', bg: 'bg-orange-50', reason: attendance.reason }
      case 'absent':
        return { text: '결근', color: 'text-red-600', bg: 'bg-red-50', reason: attendance.reason }
      default:
        return { text: '-', color: 'text-gray-400', bg: '' }
    }
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-0 bg-gray-50 z-10 border-r-2 border-gray-300">
                스태프
              </th>
              {dates.map(date => {
                const dateObj = new Date(date)
                const display = `${date.split('-')[1]}/${date.split('-')[2]}(${weekdays[dateObj.getDay()]})`
                return (
                  <th key={date} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                    {display}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r-2 border-gray-300 hover:bg-gray-50">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{user.name}</span>
                    {user.number && (
                      <span className="text-gray-500 ml-2">({user.number})</span>
                    )}
                  </div>
                </td>
                {dates.map(date => {
                  const attendance = getAttendance(user.id, date)
                  const display = getStatusDisplay(attendance)
                  
                  return (
                    <td key={date} className={`px-4 py-3 text-center ${display.bg}`}>
                      <div className={`text-sm font-medium ${display.color}`}>
                        {display.text}
                      </div>
                      {display.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          {display.reason}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
