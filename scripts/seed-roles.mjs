import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Create default roles
    const adminRole = await prisma.roles.create({
      data: {
        name: 'ADMIN',
        display_name: 'Administrator',
        description: 'Administrator role with full access',
        is_active: true
      }
    })

    const userRole = await prisma.roles.create({
      data: {
        name: 'USER',
        display_name: 'Regular User',
        description: 'Regular user with limited access',
        is_active: true
      }
    })

    console.log('Created roles:', { adminRole, userRole })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()