import { redirect } from 'next/navigation'
import { getUserFromSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  if (!isAdmin(currentUser)) {
    redirect('/dashboard')
  }

  const stores = await prisma.store.findMany({
    orderBy: { serialNumber: 'asc' },
    include: {
      checkItems: true,
      comments: {
        take: 3,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  const users = await prisma.user.findMany({
    orderBy: { number: 'asc' },
    select: {
      id: true,
      number: true,
      name: true,
      role: true,
      phone: true,
      daouId: true,
      refundAppId: true,
      memo: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
              <p className="text-sm text-gray-600 mt-1">
                환영합니다, <span className="font-semibold">{currentUser.name}</span>님
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                🏠 홈
              </Link>
              <Link
                href="/vouchers"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                상품권
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 사용자 관리</h3>
            <p className="text-sm text-gray-600">스태프/매니저 계정 관리</p>
            <p className="text-2xl font-bold text-blue-600 mt-4">{users.length}명</p>
          </Link>

          <Link
            href="/admin/stores"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-green-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🏪 점포 관리</h3>
            <p className="text-sm text-gray-600">점포 정보 추가 및 수정</p>
            <p className="text-2xl font-bold text-green-600 mt-4">{stores.length}개</p>
          </Link>

          <Link
            href="/admin/notices"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-orange-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📢 공지사항 관리</h3>
            <p className="text-sm text-gray-600">공지사항 작성 및 관리</p>
            <p className="text-sm text-orange-600 mt-4 font-medium">관리 페이지로 이동</p>
          </Link>

          <Link
            href="/vouchers"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-purple-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎫 상품권 관리</h3>
            <p className="text-sm text-gray-600">상품권 수령/반납 관리</p>
            <p className="text-sm text-purple-600 mt-4 font-medium">관리 페이지로 이동</p>
          </Link>
        </div>

        {/* 최근 등록된 사용자 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">사용자 목록 ({users.length}명)</h2>
            <Link
              href="/admin/users"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.slice(0, 5).map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.number || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '스태프'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                          {user.phone}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 최근 등록된 점포 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">점포 목록 ({stores.length}개)</h2>
            <Link
              href="/admin/stores"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">점포명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">체크 현황</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.slice(0, 5).map((store) => {
                  const checkedCount = store.checkItems.filter(item => item.checked).length
                  const totalCount = store.checkItems.length
                  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
                  
                  return (
                    <tr key={store.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{store.serialNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{store.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{store.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <a href={`tel:${store.ownerPhone}`} className="text-blue-600 hover:underline">
                          {store.ownerPhone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{checkedCount}/{totalCount}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
