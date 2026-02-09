import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // 전체 사용자 정보 가져오기
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium inline-flex items-center gap-1"
            >
              ← 목록으로
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🏠 홈
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 정보</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <ProfileForm user={user} />
        </div>
      </main>
    </div>
  )
}
