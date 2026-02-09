import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 수령 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id: recordId } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { quantity } = await request.json()

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: '유효한 수량을 입력해주세요.' },
        { status: 400 }
      )
    }

    const receive = await prisma.voucherReceive.create({
      data: {
        recordId,
        quantity,
        createdBy: currentUser.id
      },
      include: {
        createdByUser: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, receive })
  } catch (error) {
    console.error('Create voucher receive error:', error)
    return NextResponse.json(
      { error: '수령 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
