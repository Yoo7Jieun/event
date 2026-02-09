import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  console.log('🔧 스태프002 비밀번호 복구 중...')

  const hashedPassword = await hashPassword('0000')
  
  const updated = await prisma.user.update({
    where: { name: '스태프002' },
    data: {
      password: hashedPassword
    }
  })

  console.log('✅ 스태프002 비밀번호가 복구되었습니다!')
  console.log(`   이름: ${updated.name}`)
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
