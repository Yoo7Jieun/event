import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        checkItems: {
          include: {
            lastModifier: {
              select: { name: true }
            }
          }
        },
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

    if (!store) {
      return NextResponse.json(
        { error: '점포를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error('Get store error:', error)
    return NextResponse.json(
      { error: '점포 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // admin 또는 manager 권한 확인
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      businessNumber,
      ownerName,
      ownerPhone,
      address,
      mapLink,
      products
    } = body

    // 입력값 검증
    if (!name || !businessNumber || !ownerName || !ownerPhone || !address) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name,
        businessNumber,
        ownerName,
        ownerPhone,
        address,
        mapLink,
        products
      }
    })

    return NextResponse.json({ store: updatedStore })
  } catch (error) {
    console.error('Update store error:', error)
    return NextResponse.json(
      { error: '점포 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
