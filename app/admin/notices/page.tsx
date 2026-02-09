import { redirect } from 'next/navigation'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import NoticeManagement from '@/components/admin/NoticeManagement'

export default async function AdminNoticesPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser || !canManageAll(currentUser)) {
    redirect('/login')
  }

  const notices = await prisma.notice.findMany({
    include: {
      author: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
              >
                ← 관리자 페이지로
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                공지사항을 작성, 수정, 삭제할 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NoticeManagement notices={notices} />
      </main>
    </div>
  )
}
