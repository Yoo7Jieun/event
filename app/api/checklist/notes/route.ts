import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { staffId, storeId, checkItemId, notes } = await request.json()

    if (!staffId || !storeId || !checkItemId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 엔트리 찾기
    const existingEntry = await prisma.checklistEntry.findUnique({
      where: {
        staffId_storeId_checkItemId: {
          staffId,
          storeId,
          checkItemId
        }
      }
    })

    if (existingEntry) {
      // 업데이트
      const updated = await prisma.checklistEntry.update({
        where: { id: existingEntry.id },
        data: { notes }
      })
      return NextResponse.json({ success: true, entry: updated })
    } else {
      // 새로 생성
      const created = await prisma.checklistEntry.create({
        data: {
          staffId,
          storeId,
          checkItemId,
          notes,
          checked: false
        }
      })
      return NextResponse.json({ success: true, entry: created })
    }
  } catch (error) {
    console.error('Save notes error:', error)
    return NextResponse.json(
      { error: '메모 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
