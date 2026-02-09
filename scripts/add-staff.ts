import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  console.log('🔧 스태프 추가 시작...')

  const staffData = []
  
  // 번호 2~12까지 11명의 스태프 생성
  for (let i = 2; i <= 12; i++) {
    const numberStr = i.toString().padStart(3, '0') // 002, 003, ... 012
    const fourDigitNumber = i.toString().padStart(4, '0') // 0002, 0003, ... 0012
    
    staffData.push({
      number: i,
      name: `스태프${numberStr}`,
      password: await hashPassword('0000'),
      role: 'staff',
      phone: null,
      daouId: `1107${fourDigitNumber}`,
      daouPw: 'onnuri1!',
      refundAppId: `정선아리랑시장${numberStr}`,
      refundAppPw: '09876',
      memo: null
    })
  }

  // 일괄 생성
  for (const staff of staffData) {
    try {
      await prisma.user.create({
        data: staff
      })
      console.log(`✅ ${staff.name} 생성 완료`)
    } catch (error: any) {
      console.error(`❌ ${staff.name} 생성 실패:`, error.message)
    }
  }

  console.log('\n✨ 스태프 추가 완료!')
  
  // 결과 확인
  const allUsers = await prisma.user.findMany({
    orderBy: { number: 'asc' },
    select: {
      number: true,
      name: true,
      role: true,
      daouId: true,
      refundAppId: true
    }
  })
  
  console.log('\n📊 전체 사용자 목록:')
  console.table(allUsers)
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
