import { redirect } from 'next/navigation'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import AttendanceCheck from '@/components/AttendanceCheck'

export default async function DashboardPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // 공지사항 가져오기
  const notices = await prisma.notice.findMany({
    select: {
      id: true,
      title: true,
      isPinned: true,
      createdAt: true
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 5
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">환급행사 도우미</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold">{currentUser.name}</span>님
                </p>
                <Link
                  href="/profile"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  (내 정보 보기)
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/stores"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap text-center"
              >
                점포관리
              </Link>
              <Link
                href="/vouchers"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap text-center"
              >
                상품권관리
              </Link>
              <Link
                href="/notices"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 whitespace-nowrap text-center"
              >
                공지사항
              </Link>
              {canManageAll(currentUser) && (
                <Link
                  href="/admin"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 whitespace-nowrap text-center"
                >
                  관리자
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* 출근 체크 */}
        <AttendanceCheck userId={currentUser.id} userName={currentUser.name} />

        {/* 메뉴 버튼들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
          <Link
            href="/stores"
            className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all border-l-4 border-blue-500 hover:border-blue-600"
          >
            <div className="text-4xl mb-3">🏪</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">점포 관리</h2>
            <p className="text-sm text-gray-600">점포 정보 및 체크리스트 관리</p>
          </Link>

          <Link
            href="/vouchers"
            className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all border-l-4 border-green-500 hover:border-green-600"
          >
            <div className="text-4xl mb-3">🎫</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">상품권 관리</h2>
            <p className="text-sm text-gray-600">상품권 수령/반납 기록</p>
          </Link>

          {canManageAll(currentUser) && (
            <Link
              href="/admin"
              className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all border-l-4 border-red-500 hover:border-red-600 sm:col-span-2"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">관리자</h2>
              <p className="text-sm text-gray-600">사용자/점포 전체 관리</p>
            </Link>
          )}
        </div>

        {/* 공지사항 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">📢 공지사항</h2>
            <Link
              href="/notices"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              전체보기 →
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">등록된 공지사항이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => (
                <Link
                  key={notice.id}
                  href="/notices"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-2">
                    {notice.isPinned && (
                      <span className="text-blue-600 text-sm flex-shrink-0">📌</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notice.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
