import { redirect } from 'next/navigation'
import { getUserFromSession, isAdmin, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { CHECK_TYPES, CHECK_TYPE_LABELS } from '@/lib/constants'

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

  const getCheckStatus = (store: typeof stores[0], checkType: string) => {
    const item = store.checkItems.find(item => item.checkType === checkType)
    return item?.checked || false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">점포 목록</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="font-semibold">{currentUser.name}</span>님 
                <span className="hidden sm:inline"> ({currentUser.role === 'admin' ? '관리자' : currentUser.role === 'manager' ? '매니저' : '스태프'})</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/profile"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap text-center"
              >
                내 정보
              </Link>
              <Link
                href="/notices"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 whitespace-nowrap text-center"
              >
                공지사항
              </Link>
              <Link
                href="/vouchers"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap text-center"
              >
                상품권
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
            전체 점포 ({stores.length}개)
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            점포를 클릭하여 상세 정보를 확인하세요
          </p>
        </div>

        {/* 리스트 뷰 */}
        <div className="space-y-3 sm:space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
              <Link href={`/stores/${store.id}`} className="block p-4 sm:p-5">
                {/* 점포 정보 */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-gray-500">#{store.serialNumber}</span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">{store.name}</h3>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">{store.ownerName}</span>
                      <span className="mx-2">·</span>
                      <span>{store.products}</span>
                    </div>
                  </div>
                </div>

                {/* 체크박스 리스트 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                  {CHECK_TYPES.map(checkType => {
                    const checked = getCheckStatus(store, checkType)
                    return (
                      <div 
                        key={checkType}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                          checked 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'bg-yellow-50 border-yellow-400'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          checked
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-yellow-400'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs sm:text-sm font-medium ${
                          checked ? 'text-blue-900' : 'text-yellow-900'
                        }`}>
                          {CHECK_TYPE_LABELS[checkType]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
