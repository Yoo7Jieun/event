import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자가 상품권 회수 확인
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { returnId } = await request.json()

    if (!returnId) {
      return NextResponse.json({ error: '반납 기록을 선택해주세요.' }, { status: 400 })
    }

    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))

    const voucherReturn = await prisma.voucherReturn.update({
      where: { id: returnId },
      data: {
        confirmedBy: currentUser.id,
        confirmedAt: kstTime
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

    return NextResponse.json({ success: true, voucherReturn })
  } catch (error) {
    console.error('Collect voucher error:', error)
    return NextResponse.json({ error: '회수 확인 실패' }, { status: 500 })
  }
}
