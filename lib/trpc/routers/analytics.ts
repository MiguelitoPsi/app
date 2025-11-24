import { TRPCError } from '@trpc/server'
import { subDays } from 'date-fns'
import { and, desc, eq, gte, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  journalEntries,
  meditationSessions,
  moodHistory,
  psychologistPatients,
  tasks,
  users,
} from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const analyticsRouter = router({
  // Get patient overview (psychologist only)
  getPatientOverview: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verify relationship
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não tem acesso a este paciente',
        })
      }

      // Get patient data
      const patient = await db.query.users.findFirst({
        where: eq(users.id, input.patientId),
        with: {
          stats: true,
        },
      })

      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30)

      const recentTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.userId, input.patientId),
          gte(tasks.createdAt, thirtyDaysAgo),
          isNull(tasks.deletedAt)
        ),
      })

      const recentJournals = await db.query.journalEntries.findMany({
        where: and(
          eq(journalEntries.userId, input.patientId),
          gte(journalEntries.createdAt, thirtyDaysAgo),
          isNull(journalEntries.deletedAt)
        ),
      })

      const recentMeditations = await db.query.meditationSessions.findMany({
        where: and(
          eq(meditationSessions.userId, input.patientId),
          gte(meditationSessions.createdAt, thirtyDaysAgo)
        ),
      })

      const totalMeditationMinutes = recentMeditations.reduce(
        (sum, session) => sum + session.duration / 60,
        0
      )

      return {
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          level: patient.level,
          experience: patient.experience,
          streak: patient.streak,
          coins: patient.coins,
        },
        stats: patient.stats,
        recentActivity: {
          tasksCreated: recentTasks.length,
          tasksCompleted: recentTasks.filter((t) => t.completed).length,
          journalEntries: recentJournals.length,
          meditationSessions: recentMeditations.length,
          meditationMinutes: Math.round(totalMeditationMinutes),
        },
      }
    }),

  // Get patient mood trends
  getPatientMoodTrends: protectedProcedure
    .input(z.object({ patientId: z.string(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verify relationship
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const cutoffDate = subDays(new Date(), input.days)

      const moods = await db.query.moodHistory.findMany({
        where: and(eq(moodHistory.userId, input.patientId), gte(moodHistory.createdAt, cutoffDate)),
        orderBy: [desc(moodHistory.createdAt)],
      })

      return moods
    }),

  // Get patient journal entries (psychologist only)
  getPatientJournals: protectedProcedure
    .input(z.object({ patientId: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verify relationship
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return db.query.journalEntries.findMany({
        where: and(eq(journalEntries.userId, input.patientId), isNull(journalEntries.deletedAt)),
        orderBy: [desc(journalEntries.createdAt)],
        limit: input.limit,
      })
    }),

  // Get patient top emotions (from mood history and journal entries)
  getPatientTopEmotions: protectedProcedure
    .input(z.object({ patientId: z.string(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verify relationship
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const cutoffDate = subDays(new Date(), input.days)

      // Get moods from mood history
      const moods = await db.query.moodHistory.findMany({
        where: and(eq(moodHistory.userId, input.patientId), gte(moodHistory.createdAt, cutoffDate)),
      })

      // Get moods from journal entries
      const journals = await db.query.journalEntries.findMany({
        where: and(
          eq(journalEntries.userId, input.patientId),
          gte(journalEntries.createdAt, cutoffDate),
          isNull(journalEntries.deletedAt)
        ),
      })

      // Count emotions from mood history
      const emotionCounts: Record<string, number> = {}

      for (const mood of moods) {
        if (mood.mood) {
          emotionCounts[mood.mood] = (emotionCounts[mood.mood] || 0) + 1
        }
      }

      // Count emotions from journal entries
      for (const journal of journals) {
        if (journal.mood) {
          emotionCounts[journal.mood] = (emotionCounts[journal.mood] || 0) + 1
        }
      }

      // Sort by count and get top emotions
      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emotion, count]) => ({ emotion, count }))

      return {
        topEmotions: sortedEmotions,
        totalMoodEntries: moods.length,
        totalJournalEntries: journals.length,
      }
    }),

  // Get dashboard summary (psychologist only)
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    // Get all patients
    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.psychologistId, ctx.user.id),
      with: {
        patient: {
          with: {
            stats: true,
          },
        },
      },
    })

    const totalPatients = relationships.length

    // Count active patients (activity in last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7)
    let activePatients = 0

    for (const rel of relationships) {
      const hasActivity = await db.query.tasks.findFirst({
        where: and(eq(tasks.userId, rel.patientId), gte(tasks.createdAt, sevenDaysAgo)),
      })

      if (hasActivity) {
        activePatients++
      }
    }

    // Get patients with longest streaks
    const topStreaks = relationships
      .map((rel) => ({
        id: rel.patient.id,
        name: rel.patient.name,
        streak: rel.patient.streak,
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)

    return {
      totalPatients,
      activePatients,
      inactivePatients: totalPatients - activePatients,
      topStreaks,
    }
  }),
})
