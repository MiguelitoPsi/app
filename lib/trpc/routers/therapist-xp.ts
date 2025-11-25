/**
 * Router tRPC para sistema de XP e estatísticas do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getTherapistRankForLevel, THERAPIST_RANKS } from '@/lib/constants/therapist'
import { db } from '@/lib/db'
import { therapistStats } from '@/lib/db/schema'
import {
  awardTherapistXP,
  getOrCreateTherapistStats,
  getTherapistXPInfo,
  type TherapistXPAction,
} from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'

export const therapistXpRouter = router({
  // Obter estatísticas e progresso do terapeuta
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar estas estatísticas',
      })
    }

    const stats = await getOrCreateTherapistStats(db, ctx.user.id)
    const xpInfo = getTherapistXPInfo(stats)
    const rank = getTherapistRankForLevel(xpInfo.currentLevel)
    const nextRank = THERAPIST_RANKS.find((r) => r.level > xpInfo.currentLevel) || rank

    return {
      stats,
      xpInfo,
      rank,
      nextRank,
      allRanks: THERAPIST_RANKS,
    }
  }),

  // Registrar ação e ganhar XP
  trackAction: protectedProcedure
    .input(
      z.object({
        action: z.enum([
          'viewMoodReport',
          'viewThoughtRecord',
          'viewWeeklyReport',
          'viewPatientProfile',
          'createPatientTask',
          'reviewPatientTask',
          'editAiTask',
          'sendWeeklyFeedback',
          'submitClinicalReport',
          'createTherapyPlan',
          'reviewCognitiveConcept',
          'approveReward',
          'setRewardCost',
          'completeSession',
          'scheduleSession',
          'completeChallenge',
          'completeChallengeBonus',
          'achieveGoal',
          'updateFinancialRecord',
        ]),
        multiplier: z.number().min(1).max(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem registrar ações',
        })
      }

      const result = await awardTherapistXP(
        db,
        ctx.user.id,
        input.action as TherapistXPAction,
        input.multiplier || 1
      )

      // Obter rank atualizado
      const rank = getTherapistRankForLevel(result.newLevel)

      return {
        ...result,
        rank,
      }
    }),

  // Obter histórico de atividades (para analytics)
  getActivitySummary: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const stats = await getOrCreateTherapistStats(db, ctx.user.id)

    return {
      reportsViewed: stats.totalReportsViewed,
      tasksCreated: stats.totalTasksCreated,
      tasksReviewed: stats.totalTasksReviewed,
      feedbackSent: stats.totalFeedbackSent,
      rewardsApproved: stats.totalRewardsApproved,
      sessionsCompleted: stats.totalSessionsCompleted,
      clinicalReports: stats.totalClinicalReports,
      patientsManaged: stats.totalPatientsManaged,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    }
  }),

  // Atualizar estatísticas manualmente (admin)
  updateStats: protectedProcedure
    .input(
      z.object({
        therapistId: z.string(),
        experience: z.number().optional(),
        level: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem atualizar estatísticas',
        })
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      if (input.experience !== undefined) updateData.experience = input.experience
      if (input.level !== undefined) updateData.level = input.level

      await db
        .update(therapistStats)
        .set(updateData)
        .where(eq(therapistStats.therapistId, input.therapistId))

      return { success: true }
    }),
})
