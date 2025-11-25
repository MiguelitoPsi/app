/**
 * Router tRPC para conquistas/badges do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { and, count, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  THERAPIST_BADGE_CATEGORIES,
  THERAPIST_BADGE_DEFINITIONS,
  type TherapistBadgeDefinition,
} from '@/lib/constants/therapist'
import { db } from '@/lib/db'
import { therapistAchievements, therapistChallenges, therapistGoals } from '@/lib/db/schema'
import { addTherapistRawXP, getOrCreateTherapistStats } from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'

export const therapistAchievementsRouter = router({
  // Listar todas as conquistas do terapeuta
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar conquistas',
      })
    }

    const achievements = await db
      .select()
      .from(therapistAchievements)
      .where(eq(therapistAchievements.therapistId, ctx.user.id))

    return achievements
  }),

  // Obter conquistas agrupadas por categoria
  getByCategory: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const unlocked = await db
      .select()
      .from(therapistAchievements)
      .where(eq(therapistAchievements.therapistId, ctx.user.id))

    const unlockedIds = new Set(unlocked.map((a) => a.achievementId))

    // Agrupar por categoria
    const grouped = Object.entries(THERAPIST_BADGE_CATEGORIES).map(([category, info]) => {
      const categoryBadges = THERAPIST_BADGE_DEFINITIONS.filter((b) => b.category === category)

      return {
        category,
        ...info,
        badges: categoryBadges.map((badge) => ({
          ...badge,
          unlocked: unlockedIds.has(badge.id),
          unlockedAt: unlocked.find((u) => u.achievementId === badge.id)?.unlockedAt,
        })),
        totalBadges: categoryBadges.length,
        unlockedCount: categoryBadges.filter((b) => unlockedIds.has(b.id)).length,
      }
    })

    return grouped
  }),

  // Verificar e desbloquear conquistas baseado nas estatísticas atuais
  checkAndUnlock: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const stats = await getOrCreateTherapistStats(db, ctx.user.id)

    // Obter conquistas já desbloqueadas
    const existing = await db
      .select({ achievementId: therapistAchievements.achievementId })
      .from(therapistAchievements)
      .where(eq(therapistAchievements.therapistId, ctx.user.id))

    const unlockedIds = new Set(existing.map((a) => a.achievementId))

    // Obter contagens adicionais para métricas especiais
    const [challengesResult] = await db
      .select({ count: count() })
      .from(therapistChallenges)
      .where(
        and(
          eq(therapistChallenges.therapistId, ctx.user.id),
          eq(therapistChallenges.status, 'completed')
        )
      )

    const [goalsResult] = await db
      .select({ count: count() })
      .from(therapistGoals)
      .where(
        and(eq(therapistGoals.therapistId, ctx.user.id), eq(therapistGoals.status, 'completed'))
      )

    const extendedStats = {
      ...stats,
      challengesCompleted: challengesResult?.count || 0,
      goalsAchieved: goalsResult?.count || 0,
    }

    // Verificar cada conquista
    const newlyUnlocked: TherapistBadgeDefinition[] = []

    for (const badge of THERAPIST_BADGE_DEFINITIONS) {
      if (unlockedIds.has(badge.id)) continue
      if (badge.metric === 'auto') continue // Auto requer trigger específico

      const metricValue =
        badge.metric === 'level'
          ? stats.level
          : (extendedStats[badge.metric as keyof typeof extendedStats] as number)

      if (metricValue >= badge.requirement) {
        // Desbloquear conquista
        await db.insert(therapistAchievements).values({
          id: nanoid(),
          therapistId: ctx.user.id,
          achievementId: badge.id,
          category: badge.category,
          title: badge.name,
          description: badge.description,
          icon: badge.icon,
          xpReward: badge.xpReward,
        })

        // Adicionar XP de recompensa
        await addTherapistRawXP(db, ctx.user.id, badge.xpReward)

        newlyUnlocked.push(badge)
      }
    }

    return {
      newlyUnlocked,
      totalXpAwarded: newlyUnlocked.reduce((sum, b) => sum + b.xpReward, 0),
    }
  }),

  // Desbloquear conquista específica (para conquistas do tipo 'auto')
  unlockSpecific: protectedProcedure
    .input(z.object({ achievementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const badge = THERAPIST_BADGE_DEFINITIONS.find((b) => b.id === input.achievementId)
      if (!badge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conquista não encontrada',
        })
      }

      // Verificar se já foi desbloqueada
      const existing = await db
        .select()
        .from(therapistAchievements)
        .where(
          and(
            eq(therapistAchievements.therapistId, ctx.user.id),
            eq(therapistAchievements.achievementId, input.achievementId)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        return { alreadyUnlocked: true, badge }
      }

      // Desbloquear
      await db.insert(therapistAchievements).values({
        id: nanoid(),
        therapistId: ctx.user.id,
        achievementId: badge.id,
        category: badge.category,
        title: badge.name,
        description: badge.description,
        icon: badge.icon,
        xpReward: badge.xpReward,
      })

      // Adicionar XP
      await addTherapistRawXP(db, ctx.user.id, badge.xpReward)

      return {
        alreadyUnlocked: false,
        badge,
        xpAwarded: badge.xpReward,
      }
    }),

  // Obter progresso para cada conquista
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const stats = await getOrCreateTherapistStats(db, ctx.user.id)

    const [challengesResult] = await db
      .select({ count: count() })
      .from(therapistChallenges)
      .where(
        and(
          eq(therapistChallenges.therapistId, ctx.user.id),
          eq(therapistChallenges.status, 'completed')
        )
      )

    const [goalsResult] = await db
      .select({ count: count() })
      .from(therapistGoals)
      .where(
        and(eq(therapistGoals.therapistId, ctx.user.id), eq(therapistGoals.status, 'completed'))
      )

    const unlocked = await db
      .select({ achievementId: therapistAchievements.achievementId })
      .from(therapistAchievements)
      .where(eq(therapistAchievements.therapistId, ctx.user.id))

    const unlockedIds = new Set(unlocked.map((a) => a.achievementId))

    const extendedStats = {
      ...stats,
      challengesCompleted: challengesResult?.count || 0,
      goalsAchieved: goalsResult?.count || 0,
    }

    return THERAPIST_BADGE_DEFINITIONS.map((badge) => {
      const isUnlocked = unlockedIds.has(badge.id)
      let currentValue = 0

      if (badge.metric === 'level') {
        currentValue = stats.level
      } else if (badge.metric !== 'auto') {
        currentValue = (extendedStats[badge.metric as keyof typeof extendedStats] as number) || 0
      }

      return {
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        category: badge.category,
        requirement: badge.requirement,
        currentValue,
        progress: Math.min(100, (currentValue / badge.requirement) * 100),
        isUnlocked,
        xpReward: badge.xpReward,
      }
    })
  }),
})
