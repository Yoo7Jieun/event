import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 스태프가 상품권 반납
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { quantity, date } = await request.json()

    if (!quantity || quantity <= 0 || !date) {
      return NextResponse.json({ error: '반납 매수를 입력해주세요.' }, { status: 400 })
    }

    // 당일 수령 총합 계산
    const distributions = await prisma.voucherDistribution.findMany({
      where: {
        staffId: currentUser.id,
        date
      }
    })

    const totalReceived = distributions.reduce((sum, d) => sum + d.quantity, 0)
    const distributedQty = totalReceived - parseInt(quantity)

    if (distributedQty < 0) {
      return NextResponse.json({ 
        error: `당일 수령한 매수(${totalReceived}매)보다 많이 반납할 수 없습니다.` 
      }, { status: 400 })
    }

    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))

    const voucherReturn = await prisma.voucherReturn.create({
      data: {
        staffId: currentUser.id,
        quantity: parseInt(quantity),
        distributedQty,
        date,
        returnedAt: kstTime
      }
    })

    return NextResponse.json({ 
      success: true, 
      voucherReturn,
      totalReceived,
      distributedQty
    })
  } catch (error) {
    console.error('Return voucher error:', error)
    return NextResponse.json({ error: '반납 처리 실패' }, { status: 500 })
  }
}
