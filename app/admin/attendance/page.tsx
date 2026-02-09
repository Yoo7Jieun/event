import { redirect } from 'next/navigation'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AttendanceList from '@/components/admin/AttendanceList'

export default async function AdminAttendancePage() {
  const currentUser = await getUserFromSession()

  if (!currentUser || !canManageAll(currentUser)) {
    redirect('/login')
  }

  // 출근 기간 날짜들
  const dates = ['2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-14']
  
  // 모든 사용자
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['staff', 'manager']
      }
    },
    select: {
      id: true,
      number: true,
      name: true,
      role: true
    },
    orderBy: {
      number: 'asc'
    }
  })

  // 모든 출근 기록
  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        in: dates
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
              >
                ← 관리자 페이지로
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">출근 현황</h1>
              <p className="text-sm text-gray-600 mt-1">
                전체 스태프의 출근 체크 현황 (2026/2/10 ~ 2/14)
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              🏠 홈
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AttendanceList users={users} attendances={attendances} dates={dates} />
      </main>
    </div>
  )
}
