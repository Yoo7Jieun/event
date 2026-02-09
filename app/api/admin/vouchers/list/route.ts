import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자가 전체 지급 목록 조회 (날짜별)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: '날짜를 선택해주세요.' }, { status: 400 })
    }

    // 해당 날짜의 모든 지급 기록
    const distributions = await prisma.voucherDistribution.findMany({
      where: { date },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            number: true
          }
        },
        distributor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        distributedAt: 'asc'
      }
    })

    // 해당 날짜의 모든 반납 기록
    const returns = await prisma.voucherReturn.findMany({
      where: { date },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            number: true
          }
        },
        confirmer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        returnedAt: 'asc'
      }
    })

    // 관리자 수령 기록
    const adminReceives = await prisma.adminVoucherReceive.findMany({
      where: { date },
      orderBy: { receivedAt: 'asc' }
    })

    // 관리자 반납 기록
    const adminReturns = await prisma.adminVoucherReturn.findMany({
      where: { date },
      orderBy: { returnedAt: 'asc' }
    })

    return NextResponse.json({ distributions, returns, adminReceives, adminReturns })
  } catch (error) {
    console.error('Get voucher list error:', error)
    return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
  }
}
