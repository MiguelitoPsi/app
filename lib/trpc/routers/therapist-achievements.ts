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

import { getTherapistLevelFromXP } from '@/lib/xp/therapist'

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

    // Fix desync: Filter out level badges that don't match actual level
    const stats = await getOrCreateTherapistStats(db, ctx.user.id)
    const currentLevel = getTherapistLevelFromXP(stats.experience)

    return achievements.filter(a => {
        const def = THERAPIST_BADGE_DEFINITIONS.find(d => d.id === a.achievementId)
        if (def && def.metric === 'level') {
            return currentLevel >= def.requirement
        }
        return true
    })
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

    const stats = await getOrCreateTherapistStats(db, ctx.user.id)
    const currentLevel = getTherapistLevelFromXP(stats.experience)
    
    // Filter valid unlocked IDs
    const validUnlocked = unlocked.filter(u => {
         const def = THERAPIST_BADGE_DEFINITIONS.find(d => d.id === u.achievementId)
         if (def && def.metric === 'level') {
             return currentLevel >= def.requirement
         }
         return true
    })

    const unlockedIds = new Set(validUnlocked.map((a) => a.achievementId))

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
    const currentLevel = getTherapistLevelFromXP(stats.experience)

    // Self-healing: Update stored level if incorrect
    if (stats.level !== currentLevel) {
        await db.update(therapistStats)
            .set({ level: currentLevel, updatedAt: new Date() })
            .where(eq(therapistStats.therapistId, ctx.user.id))
    }

    // Obter conquistas já desbloqueadas
    const existing = await db
      .select()
      .from(therapistAchievements)
      .where(eq(therapistAchievements.therapistId, ctx.user.id))

    // Cleanup: Delete invalid level badges
    const badgesToDelete: string[] = []
    for (const badge of existing) {
        const def = THERAPIST_BADGE_DEFINITIONS.find(d => d.id === badge.achievementId)
        if (def && def.metric === 'level') {
            if (currentLevel < def.requirement) {
                badgesToDelete.push(badge.id)
            }
        }
    }

    if (badgesToDelete.length > 0) {
        for (const id of badgesToDelete) {
            await db.delete(therapistAchievements).where(eq(therapistAchievements.id, id))
        }
    }
    
    // Refresh existing list after cleanup (filter in memory)
    const validExisting = existing.filter(e => !badgesToDelete.includes(e.id))
    const unlockedIds = new Set(validExisting.map((a) => a.achievementId))

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
          ? currentLevel // Use calculated level
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
    const currentLevel = getTherapistLevelFromXP(stats.experience) // calculate level

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

    // Filter unlocked IDs visually if level is not met
    const unlockedIds = new Set(unlocked.map((a) => a.achievementId))

    const extendedStats = {
      ...stats,
      challengesCompleted: challengesResult?.count || 0,
      goalsAchieved: goalsResult?.count || 0,
    }

    return THERAPIST_BADGE_DEFINITIONS.map((badge) => {
      let isUnlocked = unlockedIds.has(badge.id)
      
      // Strict level check for UI
      if (badge.metric === 'level' && currentLevel < badge.requirement) {
          isUnlocked = false
      }

      let currentValue = 0

      if (badge.metric === 'level') {
        currentValue = currentLevel
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
