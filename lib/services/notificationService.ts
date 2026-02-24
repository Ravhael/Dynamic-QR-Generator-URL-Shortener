import { prisma } from '@/lib/prisma'

/**
 * Notification Service
 * Lightweight abstraction around notification + recipient tables.
 *
 * Tables used:
 * - notifications
 * - notification_recipients (per-user delivery + read state)
 *
 * NOTE: Multi-tenant or scoped delivery can be layered later by
 * adding tenant_id columns or filtering strategies.
 */

export interface NotificationDTO {
  id: string
  title: string
  message: string
  category?: string | null
  priority?: string | null
  icon?: string | null
  color?: string | null
  isRead: boolean
  createdAt: Date
  actionUrl?: string | null
  actionLabel?: string | null
}

interface ListOptionsLegacy { userId: string; limit?: number; offset?: number; unreadOnly?: boolean }

/**
 * Deprecated: offset-based listing.
 * Prefer listUserNotificationsCursor for stable pagination.
 */
export async function listUserNotifications({ userId, limit = 20, offset = 0, unreadOnly = false }: ListOptionsLegacy): Promise<NotificationDTO[]> {
  const recipients = await prisma.notification_recipients.findMany({
    // NOTE: is_deleted fields not yet migrated in runtime DB; filtering only by dismissed/read for now
    where: { user_id: userId, is_dismissed: false, ...(unreadOnly ? { is_read: false } : {}) },
    include: { notifications: true },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  })
  return recipients.map(mapRecipient)
}

interface CursorListOptions {
  userId: string
  limit?: number
  cursor?: string | null // notification_id
  unreadOnly?: boolean
}

export interface NotificationListPage {
  items: NotificationDTO[]
  nextCursor: string | null
  total: number
}

function mapRecipient(r: any): NotificationDTO {
  return {
    id: r.notification_id,
    title: r.notifications.title,
    message: r.notifications.message,
    category: r.notifications.category,
    priority: r.notifications.priority,
    icon: r.notifications.icon,
    color: r.notifications.color,
    createdAt: r.notifications.created_at || new Date(),
    isRead: !!r.is_read,
    actionUrl: r.notifications.action_url,
    actionLabel: r.notifications.action_label,
  }
}

export async function listUserNotificationsCursor({ userId, limit = 20, cursor, unreadOnly = false }: CursorListOptions): Promise<NotificationListPage> {
  const whereBase: any = { user_id: userId, ...(unreadOnly ? { is_read: false } : {}) }

  // Resolve cursor to created_at ordering pivot
  let cursorFilter: any = {}
  if (cursor) {
    // Find created_at for the cursor notification to emulate seek pagination
    const rec = await prisma.notification_recipients.findFirst({
      where: { user_id: userId, notification_id: cursor },
      select: { created_at: true }
    })
    if (rec?.created_at) {
      cursorFilter = { created_at: { lt: rec.created_at } }
    }
  }

  const [total, recipients] = await Promise.all([
    prisma.notification_recipients.count({ where: { ...whereBase, is_dismissed: false } }),
    prisma.notification_recipients.findMany({
      where: { ...whereBase, is_dismissed: false, ...cursorFilter },
      include: { notifications: true },
      orderBy: { created_at: 'desc' },
      take: limit + 1,
    })
  ])

  let nextCursor: string | null = null
  let slice = recipients
  if (recipients.length > limit) {
    const next = recipients[limit]
    nextCursor = next.notification_id
    slice = recipients.slice(0, limit)
  }
  return { items: slice.map(mapRecipient), nextCursor, total }
}

interface CreateNotificationInput {
  title: string
  message: string
  createdBy?: string | null
  category?: string
  priority?: string
  icon?: string
  color?: string
  actionUrl?: string
  actionLabel?: string
  userIds?: string[] // if omitted -> broadcast to all active users
}

export async function createNotification(input: CreateNotificationInput) {
  const { userIds, createdBy, ...rest } = input
  // Insert notification
  const notification = await prisma.notifications.create({
    data: {
      title: rest.title,
      message: rest.message,
      category: rest.category,
      priority: rest.priority,
      icon: rest.icon,
      color: rest.color,
      action_url: rest.actionUrl,
      action_label: rest.actionLabel,
      created_by: createdBy || undefined,
    }
  })

  // Determine recipients
  let recipients: string[] = []
  if (userIds && userIds.length) {
    recipients = userIds
  } else {
    // Broadcast: all active users (limit safeguarding to prevent accidental explosion)
    const users = await prisma.users.findMany({
      where: { is_active: true },
      select: { id: true },
      take: 5000, // safety cap
    })
    recipients = users.map(u => u.id)
  }

  if (recipients.length) {
    await prisma.notification_recipients.createMany({
      data: recipients.map(uid => ({
        notification_id: notification.id,
        user_id: uid,
      })),
      skipDuplicates: true,
    })
  }

  return notification.id
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await prisma.notification_recipients.updateMany({
    where: { user_id: userId, notification_id: notificationId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification_recipients.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  })
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification_recipients.count({ where: { user_id: userId, is_read: false, is_dismissed: false } })
}

export async function dismissNotification(userId: string, notificationId: string) {
  await prisma.notification_recipients.updateMany({
    where: { user_id: userId, notification_id: notificationId, is_dismissed: false },
    data: { is_dismissed: true, dismissed_at: new Date() }
  })
}

// Placeholder soft delete functions (pending DB migration deployment)
export async function deleteNotificationForUser(userId: string, notificationId: string) {
  // Could set a metadata flag if needed; currently noop
  await prisma.notification_recipients.updateMany({ where: { user_id: userId, notification_id: notificationId }, data: { updated_at: new Date() } })
}
export async function softDeleteNotificationGlobal(notificationId: string) {
  await prisma.notifications.update({ where: { id: notificationId }, data: { updated_at: new Date() } })
}
