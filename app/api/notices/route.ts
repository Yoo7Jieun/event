import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, canManageAll } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - 공지사항 목록
export async function GET() {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const notices = await prisma.notice.findMany({
      include: {
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ notices })
  } catch (error) {
    console.error('Get notices error:', error)
    return NextResponse.json(
      { error: '공지사항 조회 실패' },
      { status: 500 }
    )
  }
}

// POST - 공지사항 작성 (관리자/매니저만)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { title, content, isPinned } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isPinned: isPinned || false,
        createdBy: currentUser.id
      },
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, notice })
  } catch (error) {
    console.error('Create notice error:', error)
    return NextResponse.json(
      { error: '공지사항 작성 실패' },
      { status: 500 }
    )
  }
}

// PUT - 공지사항 수정 (관리자/매니저만)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id, title, content, isPinned } = await request.json()

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        isPinned: isPinned || false
      },
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, notice })
  } catch (error) {
    console.error('Update notice error:', error)
    return NextResponse.json(
      { error: '공지사항 수정 실패' },
      { status: 500 }
    )
  }
}

// DELETE - 공지사항 삭제 (관리자/매니저만)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromSession()
    
    if (!currentUser || !canManageAll(currentUser)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    await prisma.notice.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notice error:', error)
    return NextResponse.json(
      { error: '공지사항 삭제 실패' },
      { status: 500 }
    )
  }
}
