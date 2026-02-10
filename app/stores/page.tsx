import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StoreTable from '@/components/StoreTable'

export default async function StoresPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  const stores = await prisma.store.findMany({
    orderBy: { serialNumber: 'asc' },
    select: {
      id: true,
      serialNumber: true,
      name: true,
      businessNumber: true,
      representative: true,
      address: true,
      mapLink: true,
      phone: true,
      isMarketDayOnly: true,
      checkItems: {
        select: {
          id: true,
          checkType: true,
          checked: true,
          lastModifiedBy: true,
          lastModifiedAt: true
        }
      },
      comments: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true
        }
      }
    }
  })

  // 체크리스트 항목 가져오기 (DB에서 동적으로)
  const checklists = await prisma.checklistType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">점포 관리</h1>
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🏠 홈
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            전체 점포 ({stores.length}개) · 헤더를 클릭하여 정렬
          </p>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <StoreTable stores={stores} checklists={checklists} />
      </main>
    </div>
  )
}
