import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 체크리스트 항목 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    // 체크리스트 항목 조회
    const checklist = await prisma.checklistType.findUnique({
      where: { id }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: '체크리스트 항목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 모든 점포에서 해당 체크 항목 삭제
    await prisma.storeCheckItem.deleteMany({
      where: { checkType: checklist.name }
    })

    // 체크리스트 항목 삭제 (또는 비활성화)
    await prisma.checklistType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete checklist error:', error)
    return NextResponse.json(
      { error: '체크리스트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
