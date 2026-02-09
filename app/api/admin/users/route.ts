import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession, hashPassword, isAdmin } from '@/lib/auth'

// 사용자 목록 조회
export async function GET() {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { number: 'asc' },
    select: {
      id: true,
      number: true,
      name: true,
      role: true,
      phone: true,
      daouId: true,
      daouPw: true,
      refundAppId: true,
      refundAppPw: true,
      memo: true,
      createdAt: true
    }
  })

  return NextResponse.json({ users })
}

// 사용자 추가
export async function POST(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { number, name, password, role, phone, daouId, daouPw, refundAppId, refundAppPw, memo } = await request.json()

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const existing = await prisma.user.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 이름입니다.' },
        { status: 400 }
      )
    }

    // 번호 중복 확인
    if (number) {
      const existingNumber = await prisma.user.findUnique({
        where: { number: parseInt(number) }
      })

      if (existingNumber) {
        return NextResponse.json(
          { error: '이미 존재하는 번호입니다.' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        number: number ? parseInt(number) : null,
        name,
        password: hashedPassword,
        role,
        phone: phone || null,
        daouId: daouId || null,
        daouPw: daouPw || null,
        refundAppId: refundAppId || null,
        refundAppPw: refundAppPw || null,
        memo: memo || null
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        number: user.number,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: '사용자 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 수정
export async function PUT(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { id, number, name, password, role, phone, daouId, daouPw, refundAppId, refundAppPw, memo } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const updateData: any = {
      number: number ? parseInt(number) : null,
      name,
      role,
      phone: phone || null,
      daouId: daouId || null,
      daouPw: daouPw || null,
      refundAppId: refundAppId || null,
      refundAppPw: refundAppPw || null,
      memo: memo || null
    }

    // 비밀번호가 제공된 경우에만 업데이트
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        number: user.number,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: '사용자 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 삭제
export async function DELETE(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // admin 계정은 삭제 불가
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (user?.name === 'admin') {
      return NextResponse.json(
        { error: '관리자 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
