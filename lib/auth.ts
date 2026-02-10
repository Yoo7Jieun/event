import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function getUserFromSession() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true
    }
  })

  return user
}

export async function setUserSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === 'admin'
}

export function isManager(user: { role: string } | null): boolean {
  return user?.role === 'manager'
}

export function isStaff(user: { role: string } | null): boolean {
  return user?.role === 'staff'
}

export function canManageAll(user: { role: string } | null): boolean {
  return user?.role === 'admin' || user?.role === 'manager'
}
