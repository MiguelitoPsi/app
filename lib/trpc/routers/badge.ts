import { and, eq, sql, sum } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { BADGE_DEFINITIONS } from '@/lib/constants'
import {
  badges,
  meditationSessions,
  moodHistory,
  rewards,
  tasks,
  userStats,
  users,
} from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'
import { getLevelFromXP } from '@/lib/xp'

// Helper function to check and unlock badges
export async function autoCheckBadges(
  userId: string,
  // biome-ignore lint/suspicious/noExplicitAny: generic db type
  db: any
) {
  // Get user stats
  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1)

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!(stats && user)) {
    return []
  }

  // Get total meditation minutes
  const meditationMinutesResult = await db
    .select({ total: sum(meditationSessions.duration) })
    .from(meditationSessions)
    .where(eq(meditationSessions.userId, userId))

  const totalMeditationMinutes = Number(meditationMinutesResult[0]?.total || 0)

  // Get task counts by priority
  // Note: This assumes we want to count ALL completed tasks by priority, not just the ones tracked in userStats (which might be a summary)
  // But userStats doesn't have breakdown. So we query tasks table.
  const tasksHigh = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.completed, true), eq(tasks.priority, 'high')))

  const tasksMedium = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.completed, true), eq(tasks.priority, 'medium')))

  const tasksLow = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.completed, true), eq(tasks.priority, 'low')))

  const completedTasksHigh = Number(tasksHigh[0]?.count || 0)
  const completedTasksMedium = Number(tasksMedium[0]?.count || 0)
  const completedTasksLow = Number(tasksLow[0]?.count || 0)

  // Get total mood logs
  const moodLogsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(moodHistory)
    .where(eq(moodHistory.userId, userId))

  const totalMoodLogs = Number(moodLogsResult[0]?.count || 0)

  // Get redeemed rewards
  const rewardsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(rewards)
    .where(and(eq(rewards.userId, userId), eq(rewards.claimed, true)))

  const redeemedRewards = Number(rewardsResult[0]?.count || 0)

  // Check engagement (simple check: if they have done all 3 activities today)
  // We can check the lastXpDate fields in user table
  const now = new Date()
  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  const hasTaskToday = isSameDay(user.lastTaskXpDate, now)
  const hasJournalToday = isSameDay(user.lastJournalXpDate, now)
  const hasMeditationToday = isSameDay(user.lastMeditationXpDate, now)

  const engagementScore =
    (hasTaskToday ? 1 : 0) + (hasJournalToday ? 1 : 0) + (hasMeditationToday ? 1 : 0)
  const isEngagedToday = engagementScore >= 3

  // Get existing badges
  const existingBadges = await db.select().from(badges).where(eq(badges.userId, userId))

  // Cleanup: Remove level badges if user level is lower than requirement
  const currentLevel = getLevelFromXP(user.experience)
  const badgesToDelete: string[] = []

  for (const existingBadge of existingBadges) {
    // Check if it's a level badge
    if (existingBadge.badgeId.startsWith('level_')) {
      const def = BADGE_DEFINITIONS.find((d) => d.id === existingBadge.badgeId)
      if (def && def.metric === 'level') {
        if (currentLevel < def.requirement) {
           badgesToDelete.push(existingBadge.id)
        }
      }
    }
  }

  if (badgesToDelete.length > 0) {
    // Delete invalid badges from DB
    for (const badgeId of badgesToDelete) {
       await db.delete(badges).where(eq(badges.id, badgeId))
    }
    // Update existing list in memory so we don't skip check (though check will fail anyway)
    // Actually, we just want to remove them from existingBadgeIds so the check loop runs?
    // No, if we delete them, it means they are invalid. The check loop will see they are missing,
    // verify the requirement (which will fail), and NOT add them back. Correct.
  }

  // Reload existing badges set after cleanup to be safe, OR just filter the IDs from the set
  const validExistingBadgeIds = new Set(
    existingBadges
      .filter((b: { id: string; badgeId: string }) => !badgesToDelete.includes(b.id))
      .map((b: { badgeId: string }) => b.badgeId)
  )

  const existingBadgeIds = validExistingBadgeIds
  const newBadges: (typeof badges.$inferInsert)[] = []

  // Check each badge definition
  for (const badge of BADGE_DEFINITIONS) {
    if (existingBadgeIds.has(badge.id)) {
      continue
    }

    let shouldUnlock = false

    if (badge.metric === 'auto') {
      shouldUnlock = true
    } else if (badge.metric === 'totalMeditationMinutes') {
      shouldUnlock = totalMeditationMinutes >= badge.requirement
    } else if (badge.metric === 'completedTasks') {
      shouldUnlock = stats.completedTasks >= badge.requirement
    } else if (badge.metric === 'totalJournalEntries') {
      shouldUnlock = stats.totalJournalEntries >= badge.requirement
    } else if (badge.metric === 'longestStreak') {
      shouldUnlock = stats.longestStreak >= badge.requirement
    } else if (badge.metric === 'totalMeditations') {
      shouldUnlock = stats.totalMeditations >= badge.requirement
    } else if (badge.metric === 'level') {
      const currentLevel = getLevelFromXP(user.experience)

      // Self-healing: if stored level is incorrect, update it
      if (currentLevel !== user.level) {
        await db.update(users).set({ level: currentLevel }).where(eq(users.id, userId))
      }

      shouldUnlock = currentLevel >= badge.requirement
    } else if (badge.metric === 'completedTasksHigh') {
      shouldUnlock = completedTasksHigh >= badge.requirement
    } else if (badge.metric === 'completedTasksMedium') {
      shouldUnlock = completedTasksMedium >= badge.requirement
    } else if (badge.metric === 'completedTasksLow') {
      shouldUnlock = completedTasksLow >= badge.requirement
    } else if (badge.metric === 'totalMoodLogs') {
      shouldUnlock = totalMoodLogs >= badge.requirement
    } else if (badge.metric === 'redeemedRewards') {
      shouldUnlock = redeemedRewards >= badge.requirement
    } else if (badge.metric === 'engagement') {
      shouldUnlock = isEngagedToday // Only unlocks if they are engaged TODAY. This might be hard to get if they don't check exactly when they do it.
      // Maybe we should allow it if they EVER did it? But we don't track that history easily.
      // For now, let's stick to "today". If they do all 3, they get the badge.
    }

    if (shouldUnlock) {
      newBadges.push({
        id: nanoid(),
        userId,
        badgeId: badge.id,
        title: badge.name,
        description: badge.description,
        icon: badge.icon,
      })
    }
  }

  // Insert new badges
  if (newBadges.length > 0) {
    await db.insert(badges).values(newBadges)
  }

  return newBadges.map((b) => b.badgeId)
}

export const badgeRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Fetch fresh user data to get accurate XP
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)
    if (!user) return []

    const userBadges = await ctx.db.select().from(badges).where(eq(badges.userId, ctx.user.id))
    // Fix desync: Filter out level badges that don't match actual level
    const currentLevel = getLevelFromXP(user.experience)

    return userBadges
      .map((badge) => {
        const definition = BADGE_DEFINITIONS.find((def) => def.id === badge.badgeId)
        return {
          ...badge,
          definition,
        }
      })
      .filter((b) => {
        // Strict safety check:
        // 1. If we can't find definition, keep it (or maybe hide? safer to keep for now unless it's clearly broken)
        // 2. If it IS a level badge, strictly enforce requirement
        if (b.definition?.metric === 'level') {
          return currentLevel >= b.definition.requirement
        }
        // Also check if badgeId string itself suggests a level badge (e.g. 'level_5')
        if (b.badgeId.startsWith('level_')) {
             const manualDef = BADGE_DEFINITIONS.find(d => d.id === b.badgeId)
             if (manualDef && manualDef.metric === 'level') {
                 return currentLevel >= manualDef.requirement
             }
        }
        return true
      })
  }),

  checkAndUnlock: protectedProcedure.mutation(async ({ ctx }) => {
    const newBadgeIds = await autoCheckBadges(ctx.user.id, ctx.db)
    return { newBadges: newBadgeIds }
  }),
})
