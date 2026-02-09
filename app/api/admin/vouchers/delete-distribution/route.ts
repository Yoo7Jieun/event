import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 스태프 지급 기록 삭제
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { distributionId } = await request.json()

    if (!distributionId) {
      return NextResponse.json({ error: '기록을 선택해주세요.' }, { status: 400 })
    }

    await prisma.voucherDistribution.delete({
      where: { id: distributionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete distribution error:', error)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
