import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if roles table exists
    const roles = await prisma.roles.findMany()
    console.log('Roles found:', roles.length)
    console.log('Roles data:', roles)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()