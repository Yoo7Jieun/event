import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 출근 체크 조회
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

    // 관리자는 모든 스태프, 일반 사용자는 본인 것만
    const where = canManageAll(currentUser) 
      ? { date }
      : { date, userId: currentUser.id }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            number: true,
            name: true
          }
        }
      },
      orderBy: {
        user: {
          number: 'asc'
        }
      }
    })

    return NextResponse.json({ attendances })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: '출근 조회 실패' }, { status: 500 })
  }
}

// 출근 체크 입력/수정
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { date, status, reason } = await request.json()

    if (!date || !status) {
      return NextResponse.json({ error: '날짜와 상태가 필요합니다.' }, { status: 400 })
    }

    if ((status === 'late' || status === 'absent') && !reason?.trim()) {
      return NextResponse.json({ error: '지각/결근 사유를 입력해주세요.' }, { status: 400 })
    }

    // 날짜 형식 검증 (2026-02-10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: '잘못된 날짜 형식입니다.' }, { status: 400 })
    }

    // upsert: 있으면 업데이트, 없으면 생성
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: currentUser.id,
          date
        }
      },
      update: {
        status,
        reason: reason?.trim() || null
      },
      create: {
        userId: currentUser.id,
        date,
        status,
        reason: reason?.trim() || null
      }
    })

    return NextResponse.json({ success: true, attendance })
  } catch (error) {
    console.error('Create/update attendance error:', error)
    return NextResponse.json({ error: '출근 체크 실패' }, { status: 500 })
  }
}
