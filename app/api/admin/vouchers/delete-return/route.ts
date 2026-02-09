import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자 반납 기록 삭제
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { returnId } = await request.json()

    if (!returnId) {
      return NextResponse.json({ error: '기록을 선택해주세요.' }, { status: 400 })
    }

    await prisma.adminVoucherReturn.delete({
      where: { id: returnId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin return error:', error)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
