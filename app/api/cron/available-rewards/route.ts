import { and, eq, gte, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pushSubscriptions, rewards, users } from '@/lib/db/schema'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'

// This endpoint checks for users who have enough coins to claim a reward
// and sends them a notification
// Should be called by a cron job periodically (e.g., every 6 hours)

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

    // Find users who:
    // 1. Have push notifications enabled
    // 2. Have rewards they can afford (coins >= reward cost)
    // 3. Have unclaimed rewards
    const usersWithAvailableRewards = await db
      .select({
        userId: users.id,
        coins: users.coins,
        rewardTitle: rewards.title,
        rewardCost: rewards.cost,
      })
      .from(users)
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .innerJoin(rewards, eq(users.id, rewards.userId))
      .where(
        and(
          // Reward is not claimed
          eq(rewards.claimed, false),
          // Reward is not deleted
          sql`${rewards.deletedAt} IS NULL`,
          // User can afford it (coins >= cost)
          gte(users.coins, rewards.cost),
          // Only patients
          eq(users.role, 'patient'),
          // Not banned
          sql`${users.bannedAt} IS NULL`
        )
      )
      .groupBy(users.id, rewards.id)

    // Group by user to avoid duplicate notifications
    const userRewards = new Map<string, { title: string; cost: number }>()
    for (const row of usersWithAvailableRewards) {
      if (!userRewards.has(row.userId)) {
        userRewards.set(row.userId, {
          title: row.rewardTitle,
          cost: row.rewardCost,
        })
      }
    }

    let sent = 0
    let failed = 0

    for (const [userId, reward] of userRewards) {
      const result = await sendPushToUser(db, userId, PUSH_TEMPLATES.rewardAvailable(reward.title))

      if (result.sent > 0) {
        sent++
      } else {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      processed: userRewards.size,
      sent,
      failed,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error in available-rewards cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
