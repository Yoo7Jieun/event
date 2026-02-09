import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ChecklistManager from '@/components/ChecklistManager'
import CommentsSection from '@/components/CommentsSection'
import StoreInfoEditor from '@/components/StoreInfoEditor'

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
          <Link href="/stores" className="text-blue-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/stores"
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
          <StoreInfoEditor 
            store={{
              id: store.id,
              serialNumber: store.serialNumber,
              name: store.name,
              businessNumber: store.businessNumber,
              ownerName: store.ownerName,
              ownerPhone: store.ownerPhone,
              address: store.address,
              mapLink: store.mapLink,
              products: store.products,
              isMarketDayOnly: store.isMarketDayOnly
            }}
            canEdit={currentUser.role === 'admin' || currentUser.role === 'manager'}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 지도 링크 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">위치 정보</h2>
          <a
            href={store.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full sm:inline-block sm:w-auto text-center px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg font-semibold transition"
          >
            🗺️ 지도에서 보기
          </a>
        </div>

        {/* 체크리스트 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">체크리스트</h2>
          <ChecklistManager
            currentUser={currentUser}
            storeId={store.id}
            checkItems={store.checkItems}
          />
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">메모</h2>
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
