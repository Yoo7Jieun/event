import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { staffId, storeId } = await request.json()

    if (!staffId || !storeId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const existing = await prisma.storeAssignment.findUnique({
      where: {
        staffId_storeId: {
          staffId,
          storeId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 할당된 점포입니다.' },
        { status: 400 }
      )
    }

    const assignment = await prisma.storeAssignment.create({
      data: {
        staffId,
        storeId
      }
    })

    return NextResponse.json({ success: true, assignment })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: '할당 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
