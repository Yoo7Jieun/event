import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자가 상품권 지급
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { staffId, quantity } = await request.json()

    if (!staffId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: '스태프와 매수를 입력해주세요.' }, { status: 400 })
    }

    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const year = kstTime.getFullYear()
    const month = String(kstTime.getMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`

    const distribution = await prisma.voucherDistribution.create({
      data: {
        staffId,
        quantity: parseInt(quantity),
        date,
        distributedAt: kstTime,
        createdBy: currentUser.id
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
    console.error('Distribute voucher error:', error)
    return NextResponse.json({ error: '지급 처리 실패' }, { status: 500 })
  }
}
