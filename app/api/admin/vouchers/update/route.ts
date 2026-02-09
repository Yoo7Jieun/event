import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자가 지급 매수 수정
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { distributionId, quantity } = await request.json()

    if (!distributionId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: '매수를 입력해주세요.' }, { status: 400 })
    }

    const distribution = await prisma.voucherDistribution.update({
      where: { id: distributionId },
      data: {
        quantity: parseInt(quantity)
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, distribution })
  } catch (error) {
    console.error('Update distribution error:', error)
    return NextResponse.json({ error: '수정 실패' }, { status: 500 })
  }
}
