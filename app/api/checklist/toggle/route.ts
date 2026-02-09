import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { staffId, storeId, checkItemId } = await request.json()

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
      // 토글
      const updated = await prisma.checklistEntry.update({
        where: { id: existingEntry.id },
        data: {
          checked: !existingEntry.checked,
          checkedAt: !existingEntry.checked ? new Date() : null
        }
      })
      return NextResponse.json({ success: true, entry: updated })
    } else {
      // 새로 생성 (기본값: checked = true)
      const created = await prisma.checklistEntry.create({
        data: {
          staffId,
          storeId,
          checkItemId,
          checked: true,
          checkedAt: new Date()
        }
      })
      return NextResponse.json({ success: true, entry: created })
    }
  } catch (error) {
    console.error('Toggle checklist error:', error)
    return NextResponse.json(
      { error: '체크리스트 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
