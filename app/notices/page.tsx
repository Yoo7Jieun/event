import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function NoticesPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium mb-2 inline-flex items-center gap-1"
          >
            ← 목록으로
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">공지사항</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className={`bg-white rounded-lg shadow p-4 sm:p-6 ${
                  notice.isPinned ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    {notice.isPinned && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                        📌 상단 고정
                      </span>
                    )}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {notice.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                      <span>{notice.author.name}</span>
                      <span>·</span>
                      <span>
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                  {notice.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
