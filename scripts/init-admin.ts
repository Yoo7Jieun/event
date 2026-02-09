// 관리자 계정 초기화 스크립트
import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  console.log('🔧 관리자 계정 초기화 시작...')

  // 기존 admin 계정 확인
  const existingAdmin = await prisma.user.findUnique({
    where: { name: 'admin' }
  })

  if (existingAdmin) {
    console.log('⚠️  이미 관리자 계정이 존재합니다.')
    console.log('   이름: admin')
    return
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

  console.log('✅ 관리자 계정이 생성되었습니다!')
  console.log('   이름: admin')
  console.log('   비밀번호: 0000')
  console.log('')
  console.log('🌐 http://localhost:3000 에서 로그인하세요!')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
