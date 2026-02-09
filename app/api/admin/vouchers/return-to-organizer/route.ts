import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자가 주최측에 상품권 반납
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { quantity } = await request.json()

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: '매수를 입력해주세요.' }, { status: 400 })
    }

    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const year = kstTime.getFullYear()
    const month = String(kstTime.getMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`

    const returnRecord = await prisma.adminVoucherReturn.create({
      data: {
        adminId: currentUser.id,
        quantity: parseInt(quantity),
        date,
        returnedAt: kstTime
      }
    })

    return NextResponse.json({ success: true, return: returnRecord })
  } catch (error) {
    console.error('Admin return voucher error:', error)
    return NextResponse.json({ error: '반납 처리 실패' }, { status: 500 })
  }
}
