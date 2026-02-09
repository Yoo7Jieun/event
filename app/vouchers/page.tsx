import { redirect } from 'next/navigation'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import Link from 'next/link'
import StaffVoucherManager from '@/components/StaffVoucherManager'

export default async function VouchersPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // 관리자/매니저는 관리자용 페이지로 리다이렉트
  if (canManageAll(currentUser)) {
    redirect('/admin/vouchers')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">상품권 관리</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {currentUser.name}님
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap text-center"
            >
              🏠 홈
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <StaffVoucherManager userId={currentUser.id} userName={currentUser.name} />
      </main>
    </div>
  )
}
