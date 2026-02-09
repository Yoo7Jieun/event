import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession, isAdmin } from '@/lib/auth'

// 점포 목록 조회
export async function GET(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
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
          orderBy: { createdAt: 'desc' }
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

// 점포 추가
export async function POST(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { serialNumber, name, businessNumber, ownerName, ownerPhone, address, mapLink, products } = await request.json()

    if (!serialNumber || !name || !businessNumber || !ownerName || !ownerPhone || !address || !mapLink || !products) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const existingSerial = await prisma.store.findUnique({
      where: { serialNumber }
    })
    if (existingSerial) {
      return NextResponse.json(
        { error: '이미 존재하는 일련번호입니다.' },
        { status: 400 }
      )
    }

    const existingBusiness = await prisma.store.findUnique({
      where: { businessNumber }
    })
    if (existingBusiness) {
      return NextResponse.json(
        { error: '이미 존재하는 사업자번호입니다.' },
        { status: 400 }
      )
    }

    // 점포 생성
    const store = await prisma.store.create({
      data: {
        serialNumber,
        name,
        businessNumber,
        ownerName,
        ownerPhone,
        address,
        mapLink,
        products
      }
    })

    // DB에서 활성화된 체크리스트 가져오기
    const checklists = await prisma.checklistType.findMany({
      where: { isActive: true }
    })

    // 모든 체크리스트 항목 생성
    if (checklists.length > 0) {
      await prisma.storeCheckItem.createMany({
        data: checklists.map(checklist => ({
          storeId: store.id,
          checkType: checklist.name,
          checked: false
        }))
      })
    }

    return NextResponse.json({ success: true, store })
  } catch (error) {
    console.error('Create store error:', error)
    return NextResponse.json(
      { error: '점포 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 점포 수정
export async function PUT(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const store = await prisma.store.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, store })
  } catch (error) {
    console.error('Update store error:', error)
    return NextResponse.json(
      { error: '점포 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 점포 삭제
export async function DELETE(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    await prisma.store.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete store error:', error)
    return NextResponse.json(
      { error: '점포 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
