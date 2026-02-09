import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 스태프가 본인의 당일 상품권 현황 조회
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다.' }, { status: 400 })
    }

    // 당일 지급 기록
    const distributions = await prisma.voucherDistribution.findMany({
      where: {
        staffId: currentUser.id,
        date
      },
      include: {
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

    // 당일 반납 기록
    const returns = await prisma.voucherReturn.findMany({
      where: {
        staffId: currentUser.id,
        date
      },
      include: {
        confirmer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        returnedAt: 'desc'
      }
    })

    // 시스템상 배부 매수
    const systemDistribution = await prisma.systemDistribution.findUnique({
      where: {
        staffId_date: {
          staffId: currentUser.id,
          date
        }
      }
    })

    return NextResponse.json({ distributions, returns, systemDistribution })
  } catch (error) {
    console.error('Get my voucher error:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
