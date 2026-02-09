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
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← 관리자 페이지
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement users={users} />
      </main>
    </div>
  )
}
