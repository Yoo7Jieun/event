import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 스태프가 지급 받은 상품권 수령 확인
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { distributionId } = await request.json()

    if (!distributionId) {
      return NextResponse.json({ error: '지급 기록을 선택해주세요.' }, { status: 400 })
    }

    // 본인의 지급 기록인지 확인
    const distribution = await prisma.voucherDistribution.findUnique({
      where: { id: distributionId }
    })

    if (!distribution || distribution.staffId !== currentUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const updated = await prisma.voucherDistribution.update({
      where: { id: distributionId },
      data: {
        staffConfirmed: true
      }
    })

    return NextResponse.json({ success: true, distribution: updated })
  } catch (error) {
    console.error('Confirm voucher error:', error)
    return NextResponse.json({ error: '수령 확인 실패' }, { status: 500 })
  }
}

// 스태프가 수령 확인 취소
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { distributionId } = await request.json()

    if (!distributionId) {
      return NextResponse.json({ error: '지급 기록을 선택해주세요.' }, { status: 400 })
    }

    // 본인의 지급 기록인지 확인
    const distribution = await prisma.voucherDistribution.findUnique({
      where: { id: distributionId }
    })

    if (!distribution || distribution.staffId !== currentUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const updated = await prisma.voucherDistribution.update({
      where: { id: distributionId },
      data: {
        staffConfirmed: false
      }
    })

    return NextResponse.json({ success: true, distribution: updated })
  } catch (error) {
    console.error('Cancel confirm error:', error)
    return NextResponse.json({ error: '확인 취소 실패' }, { status: 500 })
  }
}
