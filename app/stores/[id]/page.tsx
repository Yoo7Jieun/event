import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ChecklistManager from '@/components/ChecklistManager'
import CommentsSection from '@/components/CommentsSection'

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // 점포 정보 가져오기
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      checkItems: {
        include: {
          lastModifier: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">점포를 찾을 수 없습니다</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
          >
            ← 목록으로 돌아가기
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">점포 #{store.serialNumber}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">사업자번호:</span> {store.businessNumber}</p>
                <p><span className="font-medium">대표자:</span> {store.ownerName}</p>
                <p>
                  <span className="font-medium">연락처:</span>{' '}
                  <a href={`tel:${store.ownerPhone}`} className="text-blue-600 hover:underline">
                    {store.ownerPhone}
                  </a>
                </p>
                <p><span className="font-medium">품목:</span> {store.products}</p>
                <p><span className="font-medium">주소:</span> {store.address}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 지도 링크 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">위치 정보</h2>
          <a
            href={store.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            🗺️ 지도에서 보기
          </a>
        </div>

        {/* 체크리스트 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">체크리스트</h2>
          <ChecklistManager
            currentUser={currentUser}
            storeId={store.id}
            checkItems={store.checkItems}
          />
        </div>

        {/* 비고/댓글 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">비고</h2>
          <CommentsSection
            currentUser={currentUser}
            storeId={store.id}
            comments={store.comments}
          />
        </div>
      </main>
    </div>
  )
}
