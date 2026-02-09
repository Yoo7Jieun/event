import { prisma } from '../lib/prisma'

async function main() {
  console.log('🌱 시작: 샘플 데이터 추가...')

  // 1. 체크 항목 추가
  console.log('📝 체크 항목 추가 중...')
  const checkItems = await Promise.all([
    prisma.checkItem.create({
      data: {
        title: '환급 안내 포스터 부착 확인',
        description: '점포 입구에 환급 안내 포스터가 잘 보이는 곳에 부착되어 있는지 확인',
        category: '사전 준비',
        order: 1
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '환급 신청서 비치 확인',
        description: '환급 신청서가 충분히 준비되어 있는지 확인',
        category: '사전 준비',
        order: 2
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '점주 교육 완료 확인',
        description: '점주가 환급 절차를 정확히 이해하고 있는지 확인',
        category: '사전 준비',
        order: 3
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '영업 시간 확인',
        description: '행사 기간 중 영업 시간 변경 여부 확인',
        category: '현장 확인',
        order: 4
      }
    }),
    prisma.checkItem.create({
      data: {
        title: 'QR코드 작동 확인',
        description: '환급 신청용 QR코드가 정상 작동하는지 확인',
        category: '현장 확인',
        order: 5
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '현금영수증 발행 가능 확인',
        description: '현금영수증 발행이 가능한지 확인',
        category: '현장 확인',
        order: 6
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '고객 문의사항 전달',
        description: '점주의 질문이나 문의사항을 기록하여 전달',
        category: '기타',
        order: 7
      }
    }),
    prisma.checkItem.create({
      data: {
        title: '최종 점검 완료',
        description: '모든 항목을 확인하고 최종 점검 완료',
        category: '기타',
        order: 8
      }
    })
  ])
  console.log(`✓ ${checkItems.length}개의 체크 항목이 추가되었습니다.`)

  // 2. 샘플 점포 추가 (5개만)
  console.log('🏪 샘플 점포 추가 중...')
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        number: 1,
        name: '행복한 반찬가게',
        address: '서울시 중구 남대문시장길 21',
        mapLink: 'https://naver.me/example1',
        category: '식품',
        notes: '아침 8시부터 영업'
      }
    }),
    prisma.store.create({
      data: {
        number: 2,
        name: '신나는 의류점',
        address: '서울시 중구 남대문시장길 35',
        mapLink: 'https://naver.me/example2',
        category: '의류',
        notes: '월요일 휴무'
      }
    }),
    prisma.store.create({
      data: {
        number: 3,
        name: '튼튼한 주방용품',
        address: '서울시 중구 남대문시장길 42',
        mapLink: 'https://naver.me/example3',
        category: '주방용품',
        notes: '도매 가능'
      }
    }),
    prisma.store.create({
      data: {
        number: 4,
        name: '맛있는 분식집',
        address: '서울시 중구 남대문시장길 58',
        mapLink: 'https://naver.me/example4',
        category: '식당',
        notes: '점심시간 대기 많음'
      }
    }),
    prisma.store.create({
      data: {
        number: 5,
        name: '예쁜 액세서리샵',
        address: '서울시 중구 남대문시장길 67',
        mapLink: 'https://naver.me/example5',
        category: '액세서리',
        notes: '수제 제품 판매'
      }
    })
  ])
  console.log(`✓ ${stores.length}개의 샘플 점포가 추가되었습니다.`)

  // 3. 샘플 스태프 추가
  console.log('👥 샘플 스태프 추가 중...')
  const staff = await Promise.all([
    prisma.staff.create({ data: { name: '김민수' } }),
    prisma.staff.create({ data: { name: '이영희' } }),
    prisma.staff.create({ data: { name: '박철수' } })
  ])
  console.log(`✓ ${staff.length}명의 샘플 스태프가 추가되었습니다.`)

  // 4. 점포 할당
  console.log('🔗 점포 할당 중...')
  const assignments = await Promise.all([
    // 김민수에게 점포 1, 2 할당
    prisma.storeAssignment.create({
      data: { staffId: staff[0].id, storeId: stores[0].id }
    }),
    prisma.storeAssignment.create({
      data: { staffId: staff[0].id, storeId: stores[1].id }
    }),
    // 이영희에게 점포 3, 4 할당
    prisma.storeAssignment.create({
      data: { staffId: staff[1].id, storeId: stores[2].id }
    }),
    prisma.storeAssignment.create({
      data: { staffId: staff[1].id, storeId: stores[3].id }
    }),
    // 박철수에게 점포 5 할당
    prisma.storeAssignment.create({
      data: { staffId: staff[2].id, storeId: stores[4].id }
    })
  ])
  console.log(`✓ ${assignments.length}개의 할당이 완료되었습니다.`)

  console.log('\n✨ 샘플 데이터 추가 완료!')
  console.log('\n📌 테스트용 계정:')
  console.log('   - 김민수 (점포 2개 할당)')
  console.log('   - 이영희 (점포 2개 할당)')
  console.log('   - 박철수 (점포 1개 할당)')
  console.log('\n🌐 http://localhost:3000 에서 테스트하세요!')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
