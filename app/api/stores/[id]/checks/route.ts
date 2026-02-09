import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 체크 항목 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id: storeId } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { checkType } = await request.json()

    if (!checkType) {
      return NextResponse.json(
        { error: '체크 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    const checkItem = await prisma.storeCheckItem.findUnique({
      where: {
        storeId_checkType: {
          storeId,
          checkType
        }
      }
    })

    if (!checkItem) {
      return NextResponse.json(
        { error: '체크 항목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const updated = await prisma.storeCheckItem.update({
      where: { id: checkItem.id },
      data: {
        checked: !checkItem.checked,
        lastModifiedBy: currentUser.id,
        lastModifiedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, checkItem: updated })
  } catch (error) {
    console.error('Toggle check error:', error)
    return NextResponse.json(
      { error: '체크 항목 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
