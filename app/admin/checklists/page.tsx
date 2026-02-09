import { redirect } from 'next/navigation'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ChecklistManager from '@/components/admin/ChecklistManager'

export default async function ChecklistsPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    redirect('/dashboard')
  }

  // 체크리스트 항목 가져오기
  const checklists = await prisma.checklistType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  // 전체 점포 수
  const totalStores = await prisma.store.count()

  // 각 체크리스트 항목별 완료/미완료 통계
  const stats = await Promise.all(
    checklists.map(async (checklist) => {
      const completed = await prisma.storeCheckItem.count({
        where: {
          checkType: checklist.name,
          checked: true
        }
      })
      return {
        id: checklist.id,
        name: checklist.name,
        completed,
        uncompleted: totalStores - completed,
        total: totalStores
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">체크리스트 관리</h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🏠 홈
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChecklistManager checklists={checklists} stats={stats} />
      </main>
    </div>
  )
}
