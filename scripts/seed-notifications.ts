// Using relative import for runtime execution via ts-node wrapper (path alias may not resolve here)
import { prisma } from '../lib/prisma'

async function main() {
  console.log('[seed-notifications] start')
  // Get one active user as target
  const user = await prisma.users.findFirst({ where: { is_active: true }, select: { id: true, email: true } })
  if (!user) {
    console.log('[seed-notifications] no active user found, aborting')
    return
  }
  console.log('[seed-notifications] seeding for user', user.email)

  // Create base notifications
  const notifBase = [
    { title: 'Welcome to the platform', message: 'Explore your dashboard to get started', priority: 'normal' },
    { title: 'Weekly analytics ready', message: 'Your weekly QR + URL performance report is available', priority: 'high' },
    { title: 'System maintenance', message: 'Planned maintenance tonight at 02:00 UTC', priority: 'low' },
  ]

  for (const n of notifBase) {
    const created = await prisma.notifications.create({
      data: {
        title: n.title,
        message: n.message,
        priority: n.priority,
        created_by: user.id,
      }
    })
    await prisma.notification_recipients.create({
      data: {
        notification_id: created.id,
        user_id: user.id,
      }
    })
  }
  console.log('[seed-notifications] done')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
