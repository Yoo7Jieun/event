import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  console.log('🔧 관리자 계정 추가 시작...')

  // admin 계정이 이미 있는지 확인
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (existingAdmin) {
    console.log('⚠️  관리자 계정이 이미 존재합니다.')
    console.log(`   이름: ${existingAdmin.name}`)
    console.log(`   번호: ${existingAdmin.number}`)
    return
  }

  // admin 계정 생성
  const admin = await prisma.user.create({
    data: {
      number: 1,
      name: 'admin',
      password: await hashPassword('0000'),
      role: 'admin',
      phone: null,
      daouId: '11070001',
      daouPw: 'onnuri1!',
      refundAppId: '정선아리랑시장001',
      refundAppPw: '09876',
      memo: '시스템 관리자'
    }
  })

  console.log('✅ 관리자 계정이 생성되었습니다!')
  console.log(`   번호: ${admin.number}`)
  console.log(`   이름: ${admin.name}`)
  console.log(`   역할: ${admin.role}`)
  console.log(`   비밀번호: 0000`)
  console.log('   (해시값으로 안전하게 저장됨)')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
