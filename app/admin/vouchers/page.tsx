import { redirect } from 'next/navigation'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminVoucherManagement from '@/components/admin/AdminVoucherManagement'

export default async function AdminVouchersPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser || !canManageAll(currentUser)) {
    redirect('/login')
  }

  // 모든 스태프 (가나다순)
  const staffList = await prisma.user.findMany({
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
      name: 'asc'
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
              <h1 className="text-2xl font-bold text-gray-900">상품권 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                상품권 지급 및 회수 관리
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
        <AdminVoucherManagement staffList={staffList} />
      </main>
    </div>
  )
}
