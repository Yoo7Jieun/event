import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자 수령 기록 삭제
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { receiveId } = await request.json()

    if (!receiveId) {
      return NextResponse.json({ error: '기록을 선택해주세요.' }, { status: 400 })
    }

    await prisma.adminVoucherReceive.delete({
      where: { id: receiveId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin receive error:', error)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
