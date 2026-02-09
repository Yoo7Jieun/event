import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession, canManageAll } from '@/lib/auth'

// 팀장 확인
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id: recordId } = await params
  
  if (!currentUser || !canManageAll(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { confirmed } = await request.json()

    const record = await prisma.voucherRecord.update({
      where: { id: recordId },
      data: {
        managerConfirmed: confirmed
      }
    })

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Confirm voucher record error:', error)
    return NextResponse.json(
      { error: '확인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
