import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// 이 엔드포인트는 한 번만 실행되어야 합니다 (관리자 계정 초기화)
export async function POST() {
  try {
    // 기존 admin 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { name: 'admin' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: '이미 관리자 계정이 존재합니다.' },
        { status: 400 }
      )
    }

    // 관리자 계정 생성
    const hashedPassword = await hashPassword('0000')
    const admin = await prisma.user.create({
      data: {
        name: 'admin',
        password: hashedPassword,
        role: 'admin'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: '관리자 계정이 생성되었습니다.',
      admin: {
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
