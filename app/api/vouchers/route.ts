import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession, isAdmin } from '@/lib/auth'

// 상품권 관리 목록 조회
export async function GET(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')

    let where = {}
    
    // admin은 전체 조회, staff는 자신의 것만
    if (!isAdmin(currentUser)) {
      where = { staffId: currentUser.id }
    } else if (staffId) {
      where = { staffId }
    }

    const records = await prisma.voucherRecord.findMany({
      where,
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
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        returns: {
          include: {
            createdByUser: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Get voucher records error:', error)
    return NextResponse.json(
      { error: '상품권 관리 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 상품권 레코드 생성
export async function POST(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { error: '스태프 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // staff는 자신의 레코드만 생성 가능
    if (!isAdmin(currentUser) && staffId !== currentUser.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const record = await prisma.voucherRecord.create({
      data: {
        staffId,
        managerConfirmed: false
      },
      include: {
        staff: {
          select: {
            id: true,
            number: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Create voucher record error:', error)
    return NextResponse.json(
      { error: '상품권 레코드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
