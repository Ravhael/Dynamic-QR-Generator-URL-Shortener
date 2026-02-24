import { db as prisma } from '../lib/prisma'

async function checkRoles() {
  try {
    const roles = await prisma.roles.findMany()
    console.log('Available roles:', roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoles()