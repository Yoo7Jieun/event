import { redirect } from 'next/navigation'
import { getUserFromSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import UserManagement from '@/components/admin/UserManagement'

export default async function AdminUsersPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  if (!isAdmin(currentUser)) {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    orderBy: { number: 'asc' },
    select: {
      id: true,
      number: true,
      name: true,
      role: true,
      phone: true,
      daouId: true,
      daouPw: true,
      refundAppId: true,
      refundAppPw: true,
      memo: true,
      createdAt: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
              >
                ← 관리자 페이지로
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                스태프 및 매니저 계정을 관리할 수 있습니다
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement users={users} />
      </main>
    </div>
  )
}
