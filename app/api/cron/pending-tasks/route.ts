import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pushSubscriptions, tasks, users } from '@/lib/db/schema'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'

// This endpoint checks for users with pending tasks for today
// and sends them a reminder push notification
// Should be called by a cron job every morning (e.g., 8 AM)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    // Get start and end of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Find users who have push notifications enabled and have pending tasks for today
    const usersWithPendingTasks = await db
      .select({
        userId: users.id,
        taskCount: sql<number>`COUNT(${tasks.id})`.as('task_count'),
      })
      .from(users)
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .innerJoin(tasks, eq(users.id, tasks.userId))
      .where(
        and(
          // Task is not completed
          eq(tasks.completed, false),
          // Task is not deleted
          sql`${tasks.deletedAt} IS NULL`,
          // Task is due today
          gte(tasks.dueDate, todayStart),
          lt(tasks.dueDate, todayEnd),
          // Only patients
          eq(users.role, 'patient'),
          // Not banned
          sql`${users.bannedAt} IS NULL`
        )
      )
      .groupBy(users.id)

    let sent = 0
    let failed = 0

    for (const user of usersWithPendingTasks) {
      if (user.taskCount > 0) {
        const result = await sendPushToUser(
          db,
          user.userId,
          PUSH_TEMPLATES.pendingTasks(user.taskCount)
        )

        if (result.sent > 0) {
          sent++
        } else {
          failed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: usersWithPendingTasks.length,
      sent,
      failed,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error in pending-tasks cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
