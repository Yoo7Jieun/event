import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id: storeId } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const comments = await prisma.storeComment.findMany({
      where: { storeId },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: '댓글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 추가
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
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    const comment = await prisma.storeComment.create({
      data: {
        storeId,
        content: content.trim(),
        createdBy: currentUser.id
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: '댓글 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 수정
export async function PUT(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { commentId, content } = await request.json()

    if (!commentId || !content) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const comment = await prisma.storeComment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (comment.createdBy !== currentUser.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const updated = await prisma.storeComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        lastModifiedBy: currentUser.id,
        lastModifiedAt: new Date()
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, comment: updated })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: '댓글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 삭제
export async function DELETE(request: NextRequest) {
  const currentUser = await getUserFromSession()
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const comment = await prisma.storeComment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (comment.createdBy !== currentUser.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    await prisma.storeComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
