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

        {/* 테이블 뷰 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    번호
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    점포명
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    대표자
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    품목
                  </th>
                  {CHECK_TYPES.map(checkType => (
                    <th key={checkType} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div className="whitespace-pre-wrap leading-tight hidden lg:block">
                        {CHECK_TYPE_LABELS[checkType].split(' ').join('\n')}
                      </div>
                      <div className="lg:hidden">
                        {CHECK_TYPE_LABELS[checkType].split(' ')[0]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {store.serialNumber}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <Link 
                        href={`/stores/${store.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block"
                      >
                        {store.name}
                      </Link>
                      <div className="text-xs text-gray-500 sm:hidden mt-1">
                        {store.ownerName} · {store.products}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {store.ownerName}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {store.products}
                    </td>
                    {CHECK_TYPES.map(checkType => {
                      const checked = getCheckStatus(store, checkType)
                      return (
                        <td key={checkType} className="px-2 py-3 text-center">
                          <span className={`inline-block text-base sm:text-lg ${checked ? 'text-green-600' : 'text-gray-300'}`}>
                            {checked ? '✓' : '○'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
