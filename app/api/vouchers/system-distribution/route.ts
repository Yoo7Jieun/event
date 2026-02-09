import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 시스템상 배부 매수 저장/수정 (upsert)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { quantity, date } = await request.json()

    if (quantity === undefined || quantity < 0 || !date) {
      return NextResponse.json({ error: '올바른 정보를 입력해주세요.' }, { status: 400 })
    }

    // upsert: 존재하면 업데이트, 없으면 생성
    const systemDistribution = await prisma.systemDistribution.upsert({
      where: {
        staffId_date: {
          staffId: currentUser.id,
          date
        }
      },
      update: {
        quantity: parseInt(quantity)
      },
      create: {
        staffId: currentUser.id,
        quantity: parseInt(quantity),
        date
      }
    })

    return NextResponse.json({ 
      success: true, 
      systemDistribution
    })
  } catch (error) {
    console.error('Save system distribution error:', error)
    return NextResponse.json({ error: '저장 실패' }, { status: 500 })
  }
}

// 시스템상 배부 매수 조회
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: '날짜가 필요합니다.' }, { status: 400 })
    }

    const systemDistribution = await prisma.systemDistribution.findUnique({
      where: {
        staffId_date: {
          staffId: currentUser.id,
          date
        }
      }
    })

    return NextResponse.json({ systemDistribution })
  } catch (error) {
    console.error('Get system distribution error:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
