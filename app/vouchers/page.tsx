import { redirect } from 'next/navigation'
import { getUserFromSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import VoucherManager from '@/components/VoucherManager'

export default async function VouchersPage() {
  const currentUser = await getUserFromSession()

  if (!currentUser) {
    redirect('/login')
  }

  // Admin은 모든 레코드, 스태프는 본인 레코드만
  const records = await prisma.voucherRecord.findMany({
    where: isAdmin(currentUser) ? {} : { staffId: currentUser.id },
    include: {
      staff: {
        select: {
          id: true,
          number: true,
          name: true
        }
      },
      receives: {
        include: {
          createdByUser: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      returns: {
        include: {
          createdByUser: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: {
      staff: {
        number: 'asc'
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상품권 관리</h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentUser.name}님 ({currentUser.role === 'admin' ? '관리자' : '스태프'})
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              점포 목록
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VoucherManager
          currentUser={currentUser}
          records={records}
        />
      </main>
    </div>
  )
}
