import { prisma } from '../lib/prisma'
import * as XLSX from 'xlsx'
import { CHECK_TYPES } from '../lib/constants'

async function main() {
  console.log('📊 엑셀 파일에서 점포 정보 읽기...')

  // 엑셀 파일 읽기
  const workbook = XLSX.readFile('shoplist.xlsx')
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // JSON으로 변환
  const data = XLSX.utils.sheet_to_json(worksheet)
  
  console.log(`📋 총 ${data.length}개의 점포 정보 발견`)
  console.log('\n첫 번째 행 확인:')
  console.log(data[0])
  console.log('\n컬럼명:', Object.keys(data[0] || {}))
  
  console.log('\n점포 추가를 시작합니다...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const row of data as any[]) {
    try {
      // 엑셀 컬럼명에 맞게 매핑
      const serialNumber = row['구분']
      const name = row['점포명']
      const businessNumber = row['사업자번호'] || ''
      const ownerName = row['대표자'] || ''
      const ownerPhone = row['연락처'] || ''
      const address = row['점포 주소'] || ''
      const mapLink = row['지도링크'] || `https://map.naver.com/p/search/${encodeURIComponent(address)}` // 기본값: 네이버 지도 검색
      const products = row['취급상품'] || ''
      
      if (!serialNumber || !name) {
        console.warn(`⚠️  건너뜀: 번호 또는 점포명 없음`, row)
        continue
      }
      
      // 점포 생성
      const store = await prisma.store.create({
        data: {
          serialNumber: parseInt(serialNumber.toString()),
          name: name.toString(),
          businessNumber: businessNumber.toString(),
          ownerName: ownerName.toString(),
          ownerPhone: ownerPhone.toString(),
          address: address.toString(),
          mapLink: mapLink.toString(),
          products: products.toString()
        }
      })
      
      // 5개 체크 항목 생성
      await Promise.all(
        CHECK_TYPES.map(checkType =>
          prisma.storeCheckItem.create({
            data: {
              storeId: store.id,
              checkType,
              checked: false
            }
          })
        )
      )
      
      successCount++
      console.log(`✅ #${serialNumber} ${name} 추가 완료`)
      
    } catch (error: any) {
      errorCount++
      console.error(`❌ 추가 실패:`, error.message)
    }
  }
  
  console.log(`\n✨ 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${errorCount}개`)
  
  // 최종 확인
  const totalStores = await prisma.store.count()
  console.log(`\n📊 전체 점포 수: ${totalStores}개`)
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
