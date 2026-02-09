import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getUserFromSession()
  const { id } = await params
  
  if (!currentUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        checkItems: {
          include: {
            lastModifier: {
              select: { name: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: '점포를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error('Get store error:', error)
    return NextResponse.json(
      { error: '점포 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
