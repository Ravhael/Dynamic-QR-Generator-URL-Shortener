import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create uuid-ossp extension
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

  console.log('Extension uuid-ossp created successfully')

  // Test koneksi dengan mengambil satu user
  const user = await prisma.users.findFirst()
  console.log('Test user found:', user ? 'Yes' : 'No')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })