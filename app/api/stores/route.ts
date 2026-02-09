import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 스태프용 점포 목록 (검색/필터링 포함)
export async function GET(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'serialNumber'
    const order = searchParams.get('order') || 'asc'
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || ''

    let where = {}
    
    // 검색 조건
    if (search) {
      where = {
        OR: [
          { name: { contains: search } },
          { businessNumber: { contains: search } },
          { ownerName: { contains: search } },
          { ownerPhone: { contains: search } }
        ]
      }
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        checkItems: true,
        comments: {
          include: {
            author: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3 // 최근 3개만
        }
      }
    })

    // 필터링 (체크 상태)
    let filteredStores = stores
    if (filter) {
      filteredStores = stores.filter(store => {
        const checkItem = store.checkItems.find(item => item.checkType === filter)
        return checkItem?.checked || false
      })
    }

    return NextResponse.json({ stores: filteredStores })
  } catch (error) {
    console.error('Get stores error:', error)
    return NextResponse.json(
      { error: '점포 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
