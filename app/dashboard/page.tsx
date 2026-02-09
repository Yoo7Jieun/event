import { redirect } from 'next/navigation'
import { getUserFromSession, isAdmin, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // 관리자/매니저는 모든 점포, 스태프는 검색만 가능
  const stores = await prisma.store.findMany({
    orderBy: { serialNumber: 'asc' },
    include: {
      checkItems: true,
      comments: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  // 각 점포의 체크리스트 완료율 계산
  const storesWithProgress = stores.map((store) => {
    const totalCheckItems = 5 // 고정 5개
    const completedCheckItems = store.checkItems.filter(item => item.checked).length
    const progress = Math.round((completedCheckItems / totalCheckItems) * 100)

    return {
      store,
      totalCheckItems,
      completedCheckItems,
      progress
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">점포 목록</h1>
            <p className="text-sm text-gray-600 mt-1">
              환영합니다, <span className="font-semibold">{currentUser.name}</span>님 
              ({currentUser.role === 'admin' ? '관리자' : currentUser.role === 'manager' ? '매니저' : '스태프'})
            </p>
          </div>
          <div className="flex gap-3">
            {canManageAll(currentUser) && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                관리자 페이지
              </Link>
            )}
            <Link
              href="/vouchers"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              상품권 관리
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            전체 점포 ({stores.length}개)
          </h2>
          <p className="text-gray-600 text-sm">
            각 점포를 클릭하여 상세 정보와 체크리스트를 확인하세요
          </p>
        </div>

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
                    점포 #{store.serialNumber}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {store.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">대표자:</span> {store.ownerName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">품목:</span> {store.products}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>체크 진행률</span>
                  <span>{completedCheckItems}/{totalCheckItems}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
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
      </main>
    </div>
  )
}
