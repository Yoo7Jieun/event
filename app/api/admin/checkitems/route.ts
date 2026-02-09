import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, order } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: '항목명은 필수입니다.' },
        { status: 400 }
      )
    }

    const checkItem = await prisma.checkItem.create({
      data: {
        title,
        description: description || null,
        category: category || null,
        order: order || 0
      }
    })

    return NextResponse.json({ success: true, checkItem })
  } catch (error) {
    console.error('Create check item error:', error)
    return NextResponse.json(
      { error: '체크 항목 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
