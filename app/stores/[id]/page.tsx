import { redirect } from 'next/navigation'
import { getStaffFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ChecklistManager from '@/components/ChecklistManager'

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getStaffFromSession()

  if (!staff) {
    redirect('/login')
  }

  // 점포 정보 가져오기
  const store = await prisma.store.findUnique({
    where: { id }
  })

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">점포를 찾을 수 없습니다</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 스태프에게 할당된 점포인지 확인
  const assignment = await prisma.storeAssignment.findUnique({
    where: {
      staffId_storeId: {
        staffId: staff.id,
        storeId: store.id
      }
    }
  })

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">이 점포에 대한 접근 권한이 없습니다.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 모든 체크 항목 가져오기
  const checkItems = await prisma.checkItem.findMany({
    orderBy: { order: 'asc' }
  })

  // 현재 스태프의 체크리스트 엔트리 가져오기
  const checklistEntries = await prisma.checklistEntry.findMany({
    where: {
      staffId: staff.id,
      storeId: store.id
    }
  })

  const checklistMap = new Map(
    checklistEntries.map(entry => [entry.checkItemId, entry])
  )

  const checkItemsWithStatus = checkItems.map(item => ({
    ...item,
    entry: checklistMap.get(item.id) || null
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
          >
            ← 대시보드로 돌아가기
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">점포 #{store.number}</span>
                {store.category && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {store.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600 mt-1">{store.address}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 지도 링크 카드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">위치 정보</h2>
            <a
              href={store.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-semibold transition"
            >
              🗺️ 지도에서 보기
            </a>
          </div>

          {/* 추가 정보 카드 */}
          {store.notes && (
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">추가 정보</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{store.notes}</p>
            </div>
          )}
        </div>

        {/* 체크리스트 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">체크리스트</h2>
          <ChecklistManager
            staffId={staff.id}
            storeId={store.id}
            checkItems={checkItemsWithStatus}
          />
        </div>
      </main>
    </div>
  )
}
