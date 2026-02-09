import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setUserSession, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 찾기 (미리 등록된 사용자만 로그인 가능)
    const user = await prisma.user.findUnique({
      where: { name: name.trim() }
    })

    if (!user) {
      return NextResponse.json(
        { error: '등록되지 않은 사용자입니다. 관리자에게 문의하세요.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    await setUserSession(user.id)

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
