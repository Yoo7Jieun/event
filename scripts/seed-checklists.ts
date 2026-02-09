import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting checklist seeding...')

  // 기존 체크리스트 항목들
  const checklistItems = [
    { name: '사업자등록증', displayOrder: 1 },
    { name: '교육이수확인증', displayOrder: 2 },
    { name: '이행각서', displayOrder: 3 },
    { name: '어플로그인', displayOrder: 4 },
    { name: '어플설치', displayOrder: 5 }
  ]

  // 체크리스트 항목 생성 (중복 체크)
  for (const item of checklistItems) {
    const existing = await prisma.checklistType.findUnique({
      where: { name: item.name }
    })

    if (!existing) {
      await prisma.checklistType.create({
        data: {
          name: item.name,
          displayOrder: item.displayOrder,
          isActive: true
        }
      })
      console.log(`Created checklist: ${item.name}`)
    } else {
      console.log(`Checklist already exists: ${item.name}`)
    }
  }

  console.log('Checklist seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding checklists:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
