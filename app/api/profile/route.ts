import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { phone, memo } = await request.json()

    // 본인 정보만 수정 가능
    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        phone: phone || null,
        memo: memo || null
      }
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: '정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
