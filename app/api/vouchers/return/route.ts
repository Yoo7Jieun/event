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

    if (!quantity || quantity < 0 || !date) {
      return NextResponse.json({ error: '반납 매수를 입력해주세요.' }, { status: 400 })
    }

    const now = new Date()
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))

    const voucherReturn = await prisma.voucherReturn.create({
      data: {
        staffId: currentUser.id,
        quantity: parseInt(quantity),
        date,
        returnedAt: kstTime
      }
    })

    return NextResponse.json({ 
      success: true, 
      voucherReturn
    })
  } catch (error) {
    console.error('Return voucher error:', error)
    return NextResponse.json({ error: '반납 처리 실패' }, { status: 500 })
  }
}

// 스태프가 반납 내역 수정 (회수대기 상태만)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { returnId, quantity } = await request.json()

    if (!returnId || quantity === undefined || quantity < 0) {
      return NextResponse.json({ error: '올바른 정보를 입력해주세요.' }, { status: 400 })
    }

    // 반납 내역 확인
    const existingReturn = await prisma.voucherReturn.findUnique({
      where: { id: returnId }
    })

    if (!existingReturn) {
      return NextResponse.json({ error: '반납 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인 것만 수정 가능
    if (existingReturn.staffId !== currentUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 이미 회수 확인된 경우 수정 불가
    if (existingReturn.confirmedBy) {
      return NextResponse.json({ error: '이미 회수 확인된 내역은 수정할 수 없습니다.' }, { status: 400 })
    }

    const updatedReturn = await prisma.voucherReturn.update({
      where: { id: returnId },
      data: {
        quantity: parseInt(quantity)
      }
    })

    return NextResponse.json({ 
      success: true, 
      voucherReturn: updatedReturn
    })
  } catch (error) {
    console.error('Update return error:', error)
    return NextResponse.json({ error: '수정 처리 실패' }, { status: 500 })
  }
}

// 스태프가 반납 내역 삭제 (회수대기 상태만)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { returnId } = await request.json()

    if (!returnId) {
      return NextResponse.json({ error: '반납 내역 ID가 필요합니다.' }, { status: 400 })
    }

    // 반납 내역 확인
    const existingReturn = await prisma.voucherReturn.findUnique({
      where: { id: returnId }
    })

    if (!existingReturn) {
      return NextResponse.json({ error: '반납 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인 것만 삭제 가능
    if (existingReturn.staffId !== currentUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 이미 회수 확인된 경우 삭제 불가
    if (existingReturn.confirmedBy) {
      return NextResponse.json({ error: '이미 회수 확인된 내역은 삭제할 수 없습니다.' }, { status: 400 })
    }

    await prisma.voucherReturn.delete({
      where: { id: returnId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete return error:', error)
    return NextResponse.json({ error: '삭제 처리 실패' }, { status: 500 })
  }
}
