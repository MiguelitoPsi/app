import { eq } from 'drizzle-orm'
import webpush from 'web-push'
import type { db as dbType } from '@/lib/db'
import { type PushSubscription, pushSubscriptions } from '@/lib/db/schema'

// Type for database instance
type DbInstance = typeof dbType

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@nepsis.app'

// Initialize web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// Push notification payload types
export type PushNotificationType =
  | 'inactive_reminder' // Não entrou há 16h
  | 'pending_tasks' // Tarefas pendentes do dia
  | 'reward_available' // Prêmio disponível para resgatar
  | 'therapist_task' // Terapeuta adicionou tarefa
  | 'general' // Notificação geral

export type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  type?: PushNotificationType
  data?: Record<string, unknown>
}

// Default notification options
const DEFAULT_ICON = '/android/android-launchericon-192-192.png'
const DEFAULT_BADGE = '/ios/72.png'

/**
 * Send push notification to a single subscription
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)) {
    console.error('VAPID keys not configured')
    return { success: false, error: 'VAPID keys not configured' }
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    url: payload.url || '/home',
    type: payload.type || 'general',
    data: payload.data,
  })

  try {
    await webpush.sendNotification(pushSubscription, notificationPayload)
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    // Handle expired/invalid subscriptions
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, error: 'subscription_expired' }
    }
    console.error('Push notification error:', error)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Send push notification to all subscriptions of a user
 */
export async function sendPushToUser(
  database: DbInstance,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; expiredSubscriptions: string[] }> {
  const subscriptions = await database.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  })

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, expiredSubscriptions: [] }
  }

  const results = await Promise.all(
    subscriptions.map((sub: PushSubscription) =>
      sendPushToSubscription(sub, payload).then((r) => ({ ...r, id: sub.id }))
    )
  )

  const expiredSubscriptions: string[] = []
  let sent = 0
  let failed = 0

  for (const result of results) {
    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error === 'subscription_expired') {
        expiredSubscriptions.push(result.id)
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredSubscriptions.length > 0) {
    await Promise.all(
      expiredSubscriptions.map((id) =>
        database.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))
      )
    )
  }

  return { sent, failed, expiredSubscriptions }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  database: DbInstance,
  userIds: string[],
  payload: PushPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  const results = await Promise.all(
    userIds.map((userId) => sendPushToUser(database, userId, payload))
  )

  return {
    totalSent: results.reduce((sum, r) => sum + r.sent, 0),
    totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
  }
}

// Pre-defined notification templates
export const PUSH_TEMPLATES = {
  inactiveReminder: (): PushPayload => ({
    title: '🌟 Sentimos sua falta!',
    body: 'Que tal retomar sua jornada de autocuidado? Sua mente agradece!',
    url: '/home',
    type: 'inactive_reminder',
  }),

  pendingTasks: (count: number): PushPayload => ({
    title: '📋 Tarefas pendentes',
    body:
      count === 1
        ? 'Você tem 1 tarefa para hoje. Vamos completar?'
        : `Você tem ${count} tarefas para hoje. Vamos completar?`,
    url: '/routine',
    type: 'pending_tasks',
  }),

  rewardAvailable: (rewardTitle: string): PushPayload => ({
    title: '🎁 Prêmio disponível!',
    body: `Você pode resgatar: ${rewardTitle}`,
    url: '/rewards',
    type: 'reward_available',
  }),

  therapistTask: (therapistName: string, taskTitle: string): PushPayload => ({
    title: '📝 Nova tarefa do terapeuta',
    body: `${therapistName} adicionou uma tarefa: ${taskTitle}`,
    url: '/routine',
    type: 'therapist_task',
  }),
}

// Export VAPID public key for client
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}
