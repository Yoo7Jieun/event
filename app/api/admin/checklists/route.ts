import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 체크리스트 항목 조회
export async function GET() {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const checklists = await prisma.checklistType.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json({ checklists })
  } catch (error) {
    console.error('Get checklists error:', error)
    return NextResponse.json(
      { error: '체크리스트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 체크리스트 항목 추가
export async function POST(request: Request) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '체크리스트 항목 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 중복 체크
    const existing = await prisma.checklistType.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 체크리스트 항목입니다.' },
        { status: 400 }
      )
    }

    // 현재 최대 순서 값 가져오기
    const maxOrder = await prisma.checklistType.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const newOrder = (maxOrder?.displayOrder ?? 0) + 1

    // 새 체크리스트 항목 생성
    const newChecklist = await prisma.checklistType.create({
      data: {
        name: name.trim(),
        displayOrder: newOrder,
        isActive: true
      }
    })

    // 모든 점포에 새 체크 항목 추가
    const stores = await prisma.store.findMany({
      select: { id: true }
    })

    if (stores.length > 0) {
      await prisma.storeCheckItem.createMany({
        data: stores.map(store => ({
          storeId: store.id,
          checkType: name.trim(),
          checked: false
        }))
      })
    }

    return NextResponse.json({ checklist: newChecklist })
  } catch (error) {
    console.error('Create checklist error:', error)
    return NextResponse.json(
      { error: '체크리스트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
