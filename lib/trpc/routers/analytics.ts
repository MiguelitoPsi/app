import { TRPCError } from '@trpc/server'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  journalEntries,
  meditationSessions,
  moodHistory,
  patientInvites,
  psychologistPatients,
  rewards,
  tasks,
  therapistFinancial,
  therapistTasks,
  therapySessions,
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

    // Get scheduled sessions for the current month (from therapistTasks with type 'session')
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const scheduledSessionTasks = await db.query.therapistTasks.findMany({
      where: and(
        eq(therapistTasks.therapistId, ctx.user.id),
        eq(therapistTasks.type, 'session'),
        eq(therapistTasks.status, 'pending'),
        gte(therapistTasks.dueDate, monthStart),
        lte(therapistTasks.dueDate, monthEnd)
      ),
    })

    const scheduledSessions = scheduledSessionTasks.length

    // Get upcoming sessions for the week with patient details
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }) // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 }) // Saturday

    const weekSessionTasks = await db.query.therapistTasks.findMany({
      where: and(
        eq(therapistTasks.therapistId, ctx.user.id),
        eq(therapistTasks.type, 'session'),
        eq(therapistTasks.status, 'pending'),
        gte(therapistTasks.dueDate, weekStart),
        lte(therapistTasks.dueDate, weekEnd)
      ),
      with: {
        patient: true,
      },
      orderBy: [asc(therapistTasks.dueDate)],
    })

    const upcomingSessions = weekSessionTasks.map((task) => ({
      id: task.id,
      patientId: task.patientId,
      patientName: task.patient?.name || 'Paciente',
      dueDate: task.dueDate,
      title: task.title,
      sessionValue: (task.metadata as { sessionValue?: number } | null)?.sessionValue,
    }))

    // Get pending invites
    const pendingInvites = await db.query.patientInvites.findMany({
      where: and(
        eq(patientInvites.psychologistId, ctx.user.id),
        eq(patientInvites.status, 'pending')
      ),
    })

    return {
      totalPatients,
      activePatients,
      inactivePatients: totalPatients - activePatients,
      topStreaks,
      scheduledSessions,
      upcomingSessions,
      pendingInvitesCount: pendingInvites.length,
    }
  }),

  // Get pending items for dashboard (psychologist only)
  getPendingItems: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    // Get all patient IDs for this therapist
    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.psychologistId, ctx.user.id),
      with: {
        patient: true,
      },
    })
    const patientIds = relationships.map((r) => r.patientId)

    if (patientIds.length === 0) {
      return {
        pendingRewards: [],
        unpaidSessions: [],
        pendingJournals: [],
        totalPendingRewards: 0,
        totalUnpaidSessions: 0,
        totalPendingJournals: 0,
      }
    }

    // 1. Prêmios dos pacientes sem custo definido (cost = 0)
    const patientRewards = await db.query.rewards.findMany({
      where: and(
        inArray(rewards.userId, patientIds),
        eq(rewards.cost, 0),
        eq(rewards.claimed, false),
        isNull(rewards.deletedAt)
      ),
      with: {
        user: true,
      },
    })

    const pendingRewards = patientRewards.map((reward) => ({
      id: reward.id,
      title: reward.title,
      patientId: reward.userId,
      patientName: reward.user?.name || 'Paciente',
      createdAt: reward.createdAt,
    }))

    // 2. Sessões completadas mas não pagas (PENDING PAYMENTS)
    // Agora busca direto do financeiro com status 'pending'
    const pendingFinancialRecords = await db
      .select({
        id: therapistFinancial.id,
        patientId: therapistFinancial.patientId,
        amount: therapistFinancial.amount,
        date: therapistFinancial.date,
        description: therapistFinancial.description,
        patientName: users.name
      })
      .from(therapistFinancial)
      .leftJoin(users, eq(therapistFinancial.patientId, users.id))
      .where(
        and(
          eq(therapistFinancial.therapistId, ctx.user.id),
          eq(therapistFinancial.status, 'pending'),
          eq(therapistFinancial.type, 'income')
        )
      )
      .orderBy(desc(therapistFinancial.date));

    // Mantemos compatibilidade com sessions antigas (isPaid=false) se necessário,
    // mas o foco agora é o status 'pending' na tabela financeira.
    // Vamos priorizar os registros financeiros pendentes.
    
    const unpaidSessions = pendingFinancialRecords.map((record) => ({
      id: record.id,
      patientId: record.patientId || '',
      patientName: record.patientName || 'Paciente',
      sessionValue: record.amount,
      completedAt: record.date,
      description: record.description
    }))

    // 3. Diários/Registros de pensamento sem feedback
    const journals = await db.query.journalEntries.findMany({
      where: and(
        inArray(journalEntries.userId, patientIds),
        eq(journalEntries.isRead, false),
        isNull(journalEntries.deletedAt)
      ),
      with: {
        user: true,
      },
      orderBy: [desc(journalEntries.createdAt)],
      limit: 50,
    })

    const pendingJournals = journals.map((journal) => ({
      id: journal.id,
      patientId: journal.userId,
      patientName: journal.user?.name || 'Paciente',
      createdAt: journal.createdAt,
      mood: journal.mood,
    }))

    return {
      pendingRewards,
      unpaidSessions,
      pendingJournals,
      totalPendingRewards: pendingRewards.length,
      totalUnpaidSessions: unpaidSessions.length,
      totalPendingJournals: pendingJournals.length,
    }
  }),

  // Consolidated dashboard data (combines getDashboardSummary + getPendingItems for better performance)
  getTherapistDashboardData: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

    // Get all patients with stats (single query reused)
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

    const patientIds = relationships.map((r) => r.patientId)
    const totalPatients = relationships.length

    // Run all independent queries in parallel
    const [
      activePatientResults,
      scheduledSessionTasks,
      weekSessionTasks,
      pendingInvites,
      patientRewards,
      pendingFinancialRecords,
      journals,
    ] = await Promise.all([
      // Active patients check
      Promise.all(
        relationships.map(async (rel) => {
          const hasActivity = await db.query.tasks.findFirst({
            where: and(eq(tasks.userId, rel.patientId), gte(tasks.createdAt, sevenDaysAgo)),
          })
          return hasActivity ? 1 : 0
        })
      ),
      // Scheduled sessions for the month
      db.query.therapistTasks.findMany({
        where: and(
          eq(therapistTasks.therapistId, ctx.user.id),
          eq(therapistTasks.type, 'session'),
          eq(therapistTasks.status, 'pending'),
          gte(therapistTasks.dueDate, monthStart),
          lte(therapistTasks.dueDate, monthEnd)
        ),
      }),
      // Week sessions with patient details
      db.query.therapistTasks.findMany({
        where: and(
          eq(therapistTasks.therapistId, ctx.user.id),
          eq(therapistTasks.type, 'session'),
          eq(therapistTasks.status, 'pending'),
          gte(therapistTasks.dueDate, weekStart),
          lte(therapistTasks.dueDate, weekEnd)
        ),
        with: {
          patient: true,
        },
        orderBy: [asc(therapistTasks.dueDate)],
      }),
      // Pending invites
      db.query.patientInvites.findMany({
        where: and(
          eq(patientInvites.psychologistId, ctx.user.id),
          eq(patientInvites.status, 'pending')
        ),
      }),
      // Patient rewards without cost
      patientIds.length > 0
        ? db.query.rewards.findMany({
            where: and(
              inArray(rewards.userId, patientIds),
              eq(rewards.cost, 0),
              eq(rewards.claimed, false),
              isNull(rewards.deletedAt)
            ),
            with: {
              user: true,
            },
          })
        : Promise.resolve([]),
      // Pending financial records
      db
        .select({
          id: therapistFinancial.id,
          patientId: therapistFinancial.patientId,
          amount: therapistFinancial.amount,
          date: therapistFinancial.date,
          description: therapistFinancial.description,
          patientName: users.name,
        })
        .from(therapistFinancial)
        .leftJoin(users, eq(therapistFinancial.patientId, users.id))
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            eq(therapistFinancial.status, 'pending'),
            eq(therapistFinancial.type, 'income')
          )
        )
        .orderBy(desc(therapistFinancial.date)),
      // Pending journals
      patientIds.length > 0
        ? db.query.journalEntries.findMany({
            where: and(
              inArray(journalEntries.userId, patientIds),
              eq(journalEntries.isRead, false),
              isNull(journalEntries.deletedAt)
            ),
            with: {
              user: true,
            },
            orderBy: [desc(journalEntries.createdAt)],
            limit: 50,
          })
        : Promise.resolve([]),
    ])

    // Process results
    const activePatients = activePatientResults.reduce((sum: number, val) => sum + val, 0 as number)

    const topStreaks = relationships
      .map((rel) => ({
        id: rel.patient.id,
        name: rel.patient.name,
        streak: rel.patient.streak,
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)

    const upcomingSessions = weekSessionTasks.map((task) => ({
      id: task.id,
      patientId: task.patientId,
      patientName: task.patient?.name || 'Paciente',
      dueDate: task.dueDate,
      title: task.title,
      sessionValue: (task.metadata as { sessionValue?: number } | null)?.sessionValue,
    }))

    const pendingRewards = (patientRewards as Array<{ id: string; title: string; userId: string; user?: { name: string } | null; createdAt: Date | null }>).map((reward) => ({
      id: reward.id,
      title: reward.title,
      patientId: reward.userId,
      patientName: reward.user?.name || 'Paciente',
      createdAt: reward.createdAt,
    }))

    const unpaidSessions = pendingFinancialRecords.map((record) => ({
      id: record.id,
      patientId: record.patientId || '',
      patientName: record.patientName || 'Paciente',
      sessionValue: record.amount,
      completedAt: record.date,
      description: record.description,
    }))

    const pendingJournals = (journals as Array<{ id: string; userId: string; user?: { name: string } | null; createdAt: Date | null; mood: string | null }>).map((journal) => ({
      id: journal.id,
      patientId: journal.userId,
      patientName: journal.user?.name || 'Paciente',
      createdAt: journal.createdAt,
      mood: journal.mood,
    }))

    return {
      // Dashboard summary
      totalPatients,
      activePatients,
      inactivePatients: totalPatients - activePatients,
      topStreaks,
      scheduledSessions: scheduledSessionTasks.length,
      upcomingSessions,
      pendingInvitesCount: pendingInvites.length,
      // Pending items
      pendingRewards,
      unpaidSessions,
      pendingJournals,
      totalPendingRewards: pendingRewards.length,
      totalUnpaidSessions: unpaidSessions.length,
      totalPendingJournals: pendingJournals.length,
    }
  }),
})

