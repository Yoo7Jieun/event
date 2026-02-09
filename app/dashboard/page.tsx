import { redirect } from 'next/navigation'
import { getStaffFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const staff = await getStaffFromSession()

  if (!staff) {
    redirect('/login')
  }

  // 스태프에게 할당된 점포 가져오기
  const assignments = await prisma.storeAssignment.findMany({
    where: { staffId: staff.id },
    include: {
      store: true
    },
    orderBy: {
      store: {
        number: 'asc'
      }
    }
  })

  // 각 점포의 체크리스트 완료율 계산
  const storesWithProgress = await Promise.all(
    assignments.map(async (assignment) => {
      const totalCheckItems = await prisma.checkItem.count()
      const completedCheckItems = await prisma.checklistEntry.count({
        where: {
          staffId: staff.id,
          storeId: assignment.store.id,
          checked: true
        }
      })

      return {
        ...assignment,
        totalCheckItems,
        completedCheckItems,
        progress: totalCheckItems > 0 
          ? Math.round((completedCheckItems / totalCheckItems) * 100)
          : 0
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="text-sm text-gray-600 mt-1">
              환영합니다, <span className="font-semibold">{staff.name}</span>님
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            배정된 점포 ({assignments.length}개)
          </h2>
          <p className="text-gray-600 text-sm">
            각 점포를 클릭하여 체크리스트를 관리하세요
          </p>
        </div>

        {storesWithProgress.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">아직 배정된 점포가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">
              관리자에게 문의하여 점포를 배정받으세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storesWithProgress.map(({ store, completedCheckItems, totalCheckItems, progress }) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      점포 #{store.number}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {store.name}
                    </h3>
                  </div>
                  {store.category && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {store.category}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {store.address}
                </p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>진행률</span>
                    <span>{completedCheckItems}/{totalCheckItems}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${
                    progress === 100 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {progress === 100 ? '✓ 완료' : `${progress}% 진행중`}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
