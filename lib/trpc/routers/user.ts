import { and, desc, eq, gte, sql, sum } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { MOOD_SCORE_MAP } from '@/lib/constants'
import {
  journalEntries,
  meditationSessions,
  moodHistory,
  rewards,
  tasks,
  userStats,
  users,
} from '@/lib/db/schema'
import { formatDateSP } from '@/lib/utils/timezone'
import { addCoins, addRawXP, awardXPAndCoins } from '@/lib/xp'
import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Get user stats
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1)

    // Get task counts by priority
    const tasksHigh = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(eq(tasks.userId, ctx.user.id), eq(tasks.completed, true), eq(tasks.priority, 'high'))
      )

    const tasksMedium = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(eq(tasks.userId, ctx.user.id), eq(tasks.completed, true), eq(tasks.priority, 'medium'))
      )

    const tasksLow = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(eq(tasks.userId, ctx.user.id), eq(tasks.completed, true), eq(tasks.priority, 'low'))
      )

    // Get total mood logs
    const moodLogsResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id))

    // Get redeemed rewards
    const rewardsResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(rewards)
      .where(and(eq(rewards.userId, ctx.user.id), eq(rewards.claimed, true)))

    // Get total meditation minutes
    const meditationMinutesResult = await ctx.db
      .select({ total: sum(meditationSessions.duration) })
      .from(meditationSessions)
      .where(eq(meditationSessions.userId, ctx.user.id))

    return {
      ...user,
      stats: stats || {
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: 0,
      },
      extendedStats: {
        completedTasksHigh: Number(tasksHigh[0]?.count || 0),
        completedTasksMedium: Number(tasksMedium[0]?.count || 0),
        completedTasksLow: Number(tasksLow[0]?.count || 0),
        totalMoodLogs: Number(moodLogsResult[0]?.count || 0),
        redeemedRewards: Number(rewardsResult[0]?.count || 0),
        totalMeditationMinutes: Number(meditationMinutesResult[0]?.total || 0),
      },
    }
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1)

    if (!stats) {
      // Create stats if they don't exist
      const newStats = {
        userId: ctx.user.id,
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: 0,
      }
      await ctx.db.insert(userStats).values(newStats)
      return newStats
    }

    return stats
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        preferences: z
          .object({
            notifications: z.boolean().optional(),
            theme: z.enum(['light', 'dark']).optional(),
            language: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { success: true }
    }),

  addExperience: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(({ ctx, input }) => addRawXP(ctx.db, ctx.user.id, input.amount)),

  addCoins: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(({ ctx, input }) => addCoins(ctx.db, ctx.user.id, input.amount)),

  updateAvatar: protectedProcedure
    .input(
      z.object({
        accessory: z.string(),
        shirtColor: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

      if (!user) {
        throw new Error('User not found')
      }

      const currentPreferences = user.preferences || {}

      await ctx.db
        .update(users)
        .set({
          preferences: {
            ...currentPreferences,
            avatar_config: input,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { success: true }
    }),

  updateTheme: protectedProcedure
    .input(z.object({ theme: z.enum(['light', 'dark']) }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

      if (!user) {
        throw new Error('User not found')
      }

      const currentPreferences = user.preferences || {}

      await ctx.db
        .update(users)
        .set({
          preferences: {
            ...currentPreferences,
            theme: input.theme,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { success: true }
    }),

  trackMood: protectedProcedure
    .input(
      z.object({
        mood: z.enum(['happy', 'calm', 'neutral', 'sad', 'anxious', 'angry']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, 'mood')
      const xpAwarded = result.xpAwarded

      // Always save mood
      await ctx.db.insert(moodHistory).values({
        id: nanoid(),
        userId: ctx.user.id,
        mood: input.mood,
        xpAwarded,
      })

      return { xp: xpAwarded, saved: true }
    }),

  getMoodHistory: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const moods = await ctx.db
        .select()
        .from(moodHistory)
        .where(eq(moodHistory.userId, ctx.user.id))
        .orderBy(desc(moodHistory.createdAt))
        .limit(input.days * 5) // Get more to account for multiple entries per day

      // Group by day and calculate average score
      const moodsByDay = new Map<string, number[]>()

      for (const mood of moods) {
        const day = formatDateSP(mood.createdAt)
        const score = MOOD_SCORE_MAP[mood.mood as keyof typeof MOOD_SCORE_MAP] || 60

        if (!moodsByDay.has(day)) {
          moodsByDay.set(day, [])
        }
        moodsByDay.get(day)?.push(score)
      }

      // Calculate averages
      const result = Array.from(moodsByDay.entries())
        .map(([day, scores]) => ({
          date: day,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }))
        .slice(0, input.days)
        .reverse()

      return result
    }),

  getLatestMood: protectedProcedure.query(async ({ ctx }) => {
    const [latestMood] = await ctx.db
      .select()
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id))
      .orderBy(desc(moodHistory.createdAt))
      .limit(1)

    return latestMood?.mood ?? null
  }),

  hasRecentAnxiety: protectedProcedure.query(async ({ ctx }) => {
    // Check if the LATEST mood is anxious (not just any recent anxious mood)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get the most recent mood entry
    const [latestMood] = await ctx.db
      .select()
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id))
      .orderBy(desc(moodHistory.createdAt))
      .limit(1)

    // Check if latest mood is anxious and within last 24 hours
    const hasAnxiousMood =
      latestMood && latestMood.mood === 'anxious' && latestMood.createdAt >= oneDayAgo

    // Check journal entries for anxious mood in last 24 hours
    const [anxiousJournal] = await ctx.db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, ctx.user.id),
          eq(journalEntries.mood, 'anxious'),
          gte(journalEntries.createdAt, oneDayAgo)
        )
      )
      .limit(1)

    return {
      hasAnxiety: Boolean(hasAnxiousMood || anxiousJournal),
      source: hasAnxiousMood ? 'mood' : anxiousJournal ? 'journal' : null,
    }
  }),

  checkTermsAccepted: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ termsAcceptedAt: users.termsAcceptedAt, role: users.role })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Both psychologists and patients need to accept terms
    if (user.role !== 'psychologist' && user.role !== 'patient') {
      return { needsToAcceptTerms: false, termsAcceptedAt: null }
    }

    return {
      needsToAcceptTerms: !user.termsAcceptedAt,
      termsAcceptedAt: user.termsAcceptedAt,
    }
  }),

  acceptTerms: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'psychologist' && user.role !== 'patient') {
      throw new Error('Only psychologists and patients need to accept terms')
    }

    await ctx.db
      .update(users)
      .set({
        termsAcceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id))

    return { success: true }
  }),

  // Verificar se a conta está suspensa
  checkSuspension: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        bannedAt: users.bannedAt,
        banReason: users.banReason,
        suspendedByTherapistId: users.suspendedByTherapistId,
        role: users.role,
        unlinkReason: users.unlinkReason,
        unlinkedByTherapistId: users.unlinkedByTherapistId,
        unlinkedByTherapistName: users.unlinkedByTherapistName,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (!user) {
      return { isSuspended: false }
    }

    return {
      isSuspended: Boolean(user.bannedAt),
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      suspendedByTherapistId: user.suspendedByTherapistId,
      role: user.role,
      unlinkReason: user.unlinkReason,
      unlinkedByTherapistId: user.unlinkedByTherapistId,
      unlinkedByTherapistName: user.unlinkedByTherapistName,
    }
  }),
})
