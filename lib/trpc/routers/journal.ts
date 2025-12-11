import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { journalEntries, psychologistPatients, userStats, users } from '@/lib/db/schema'
import { isSameDay } from '@/lib/utils/timezone'
import { addRawXP, awardXPAndCoins, JOURNAL_XP_DAILY_LIMIT } from '@/lib/xp'
import { protectedProcedure, router } from '../trpc'
import { autoCheckBadges } from './badge'

export const journalRouter = router({
  // Verifica quantos registros com XP restam para o dia
  getXpStatus: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        lastJournalXpDate: users.lastJournalXpDate,
        journalXpCountToday: users.journalXpCountToday,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (!user) {
      return { canEarnXp: true, remainingToday: JOURNAL_XP_DAILY_LIMIT, countToday: 0 }
    }

    const lastDate = user.lastJournalXpDate
    const isNewDay = !(lastDate && isSameDay(lastDate, new Date()))
    const countToday = isNewDay ? 0 : user.journalXpCountToday || 0
    const remainingToday = Math.max(0, JOURNAL_XP_DAILY_LIMIT - countToday)

    return {
      canEarnXp: remainingToday > 0,
      remainingToday,
      countToday,
      dailyLimit: JOURNAL_XP_DAILY_LIMIT,
    }
  }),

  getAll: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.user.id

      // If querying another user, verify permission (for therapists)
      if (targetUserId !== ctx.user.id) {
        if (ctx.user.role !== 'psychologist') {
          throw new Error('Unauthorized')
        }
        // Verify the psychologist has a relationship with this patient
        const relationship = await ctx.db.query.psychologistPatients.findFirst({
          where: and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, targetUserId)
          ),
        })
        if (!relationship) {
          throw new Error('Unauthorized: No relationship with this patient')
        }
      }

      return ctx.db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.userId, targetUserId), isNull(journalEntries.deletedAt)))
        .orderBy(desc(journalEntries.createdAt))
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [entry] = await ctx.db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, input.id),
          eq(journalEntries.userId, ctx.user.id),
          isNull(journalEntries.deletedAt)
        )
      )
      .limit(1)

    return entry
  }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
        aiAnalysis: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid()

      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, 'journal')
      const { xpAwarded, coinsAwarded, levelUp } = result
      const now = new Date()

      // Create journal entry
      await ctx.db.insert(journalEntries).values({
        id,
        userId: ctx.user.id,
        ...input,
      })

      // Update stats
      const [stats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1)

      if (stats) {
        await ctx.db
          .update(userStats)
          .set({
            totalJournalEntries: stats.totalJournalEntries + 1,
            updatedAt: now,
          })
          .where(eq(userStats.userId, ctx.user.id))
      }

      // Check for new badges
      const newBadges = await autoCheckBadges(ctx.user.id, ctx.db)

      // Update lastActiveAt on user action
      await ctx.db.update(users).set({ lastActiveAt: now }).where(eq(users.id, ctx.user.id))

      return {
        id,
        xp: xpAwarded,
        coins: coinsAwarded,
        levelUp,
        newBadges,
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
        aiAnalysis: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      await ctx.db
        .update(journalEntries)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(journalEntries.id, id),
            eq(journalEntries.userId, ctx.user.id),
            isNull(journalEntries.deletedAt)
          )
        )

      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(journalEntries)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)))

      return { success: true }
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a psychologist
      if (ctx.user.role !== 'psychologist') {
        throw new Error('Unauthorized: Only psychologists can mark entries as read')
      }

      // Get the entry to find the patient ID
      const [entry] = await ctx.db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, input.id))
        .limit(1)

      if (!entry) {
        throw new Error('Journal entry not found')
      }

      // Verify relationship
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, entry.userId)
        ),
      })

      if (!relationship) {
        throw new Error('Unauthorized: No relationship with this patient')
      }

      // Check if already read to avoid double XP
      const wasAlreadyRead = entry.isRead

      // Mark as read
      await ctx.db
        .update(journalEntries)
        .set({ isRead: true })
        .where(eq(journalEntries.id, input.id))

      // If already read, don't award XP again
      if (wasAlreadyRead) {
        return { success: true, therapistXpAwarded: 0, patientXpAwarded: 0 }
      }

      // Award XP to patient (5 XP for having entry read)
      const _patientResult = await addRawXP(ctx.db, entry.userId, 5)

      // Award XP to therapist (5 XP for reading)
      const therapistResult = await addRawXP(ctx.db, ctx.user.id, 5)

      return {
        success: true,
        therapistXpAwarded: 5,
        patientXpAwarded: 5,
        therapistLevel: therapistResult.level,
        therapistExperience: therapistResult.experience,
      }
    }),

  addFeedback: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a psychologist
      if (ctx.user.role !== 'psychologist') {
        throw new Error('Unauthorized: Only psychologists can add feedback')
      }

      // Get the entry to find the patient ID
      const [entry] = await ctx.db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, input.entryId))
        .limit(1)

      if (!entry) {
        throw new Error('Journal entry not found')
      }

      // Verify relationship
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, entry.userId)
        ),
      })

      if (!relationship) {
        throw new Error('Unauthorized: No relationship with this patient')
      }

      // Check if this is a new feedback or an edit
      const isNewFeedback = !entry.therapistFeedback

      // Update entry with feedback
      await ctx.db
        .update(journalEntries)
        .set({
          therapistFeedback: input.feedback,
          feedbackViewed: false,
          feedbackAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(journalEntries.id, input.entryId))

      // Award XP to therapist only for new feedback (10 XP)
      let therapistXpAwarded = 0
      let therapistLevel = 0
      let therapistExperience = 0
      if (isNewFeedback) {
        const therapistResult = await addRawXP(ctx.db, ctx.user.id, 10)
        therapistXpAwarded = 10
        therapistLevel = therapistResult.level
        therapistExperience = therapistResult.experience
      }

      return {
        success: true,
        therapistXpAwarded,
        therapistLevel,
        therapistExperience,
        isNewFeedback,
      }
    }),

  getUnviewedFeedbackCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'patient') {
      return 0
    }

    const [result] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, ctx.user.id),
          isNotNull(journalEntries.therapistFeedback),
          eq(journalEntries.feedbackViewed, false)
        )
      )

    return result?.count || 0
  }),

  markFeedbackAsViewed: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'patient') {
        throw new Error('Unauthorized: Only patients can mark feedback as viewed')
      }

      const [entry] = await ctx.db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, input.entryId), eq(journalEntries.userId, ctx.user.id)))
        .limit(1)

      if (!entry) {
        throw new Error('Journal entry not found')
      }

      await ctx.db
        .update(journalEntries)
        .set({ feedbackViewed: true })
        .where(eq(journalEntries.id, input.entryId))

      return { success: true }
    }),

  markAllFeedbackAsViewed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'patient') {
      throw new Error('Unauthorized: Only patients can mark feedback as viewed')
    }

    await ctx.db
      .update(journalEntries)
      .set({ feedbackViewed: true })
      .where(
        and(
          eq(journalEntries.userId, ctx.user.id),
          isNotNull(journalEntries.therapistFeedback),
          eq(journalEntries.feedbackViewed, false)
        )
      )

    return { success: true }
  }),
})
