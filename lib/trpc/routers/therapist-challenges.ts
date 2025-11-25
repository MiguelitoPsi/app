/**
 * Router tRPC para desafios semanais do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { WEEKLY_CHALLENGE_TEMPLATES } from '@/lib/constants/therapist'
import { db } from '@/lib/db'
import { therapistChallenges } from '@/lib/db/schema'
import { awardTherapistXP } from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'

/**
 * Obtém as datas de início e fim da semana atual
 */
function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMonday)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return { weekStart, weekEnd }
}

/**
 * Seleciona desafios aleatórios para a semana
 */
function selectWeeklyChallenges(count = 3): typeof WEEKLY_CHALLENGE_TEMPLATES {
  const shuffled = [...WEEKLY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5)

  // Garantir variedade de dificuldades
  const easy = shuffled.filter((c) => c.difficulty === 'easy')
  const medium = shuffled.filter((c) => c.difficulty === 'medium')
  const hard = shuffled.filter((c) => c.difficulty === 'hard')

  const selected: typeof WEEKLY_CHALLENGE_TEMPLATES = []

  if (easy.length > 0) selected.push(easy[0])
  if (medium.length > 0) selected.push(medium[0])
  if (hard.length > 0) selected.push(hard[0])

  // Se precisar de mais, adicionar aleatoriamente
  while (selected.length < count && shuffled.length > selected.length) {
    const remaining = shuffled.filter((c) => !selected.includes(c))
    if (remaining.length > 0) {
      selected.push(remaining[0])
    }
  }

  return selected.slice(0, count)
}

export const therapistChallengesRouter = router({
  // Obter desafios da semana atual
  getCurrentWeek: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar desafios',
      })
    }

    const { weekStart, weekEnd } = getCurrentWeekBounds()

    const challenges = await db
      .select()
      .from(therapistChallenges)
      .where(
        and(
          eq(therapistChallenges.therapistId, ctx.user.id),
          gte(therapistChallenges.weekStart, weekStart),
          lte(therapistChallenges.weekEnd, weekEnd)
        )
      )

    // Se não existem desafios para esta semana, criar
    if (challenges.length === 0) {
      const templates = selectWeeklyChallenges(3)
      const newChallenges: Array<{
        id: string
        therapistId: string
        challengeId: string
        title: string
        description: string
        type: string
        targetCount: number
        currentCount: number
        xpReward: number
        bonusMultiplier: number
        status: 'active'
        weekStart: Date
        weekEnd: Date
      }> = []

      for (const template of templates) {
        const challenge = {
          id: nanoid(),
          therapistId: ctx.user.id,
          challengeId: template.id,
          title: template.title,
          description: template.description,
          type: template.type,
          targetCount: template.targetCount,
          currentCount: 0,
          xpReward: template.xpReward,
          bonusMultiplier: template.bonusMultiplier,
          status: 'active' as const,
          weekStart,
          weekEnd,
        }

        await db.insert(therapistChallenges).values(challenge)
        newChallenges.push(challenge)
      }

      return newChallenges.map((c) => ({
        ...c,
        progress: 0,
        template: templates.find((t) => t.id === c.challengeId),
      }))
    }

    return challenges.map((c) => ({
      ...c,
      progress: Math.min(100, (c.currentCount / c.targetCount) * 100),
      template: WEEKLY_CHALLENGE_TEMPLATES.find((t) => t.id === c.challengeId),
    }))
  }),

  // Atualizar progresso de um desafio
  updateProgress: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
        increment: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [challenge] = await db
        .select()
        .from(therapistChallenges)
        .where(
          and(
            eq(therapistChallenges.id, input.challengeId),
            eq(therapistChallenges.therapistId, ctx.user.id)
          )
        )
        .limit(1)

      if (!challenge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Desafio não encontrado',
        })
      }

      if (challenge.status !== 'active') {
        return { alreadyCompleted: true, challenge }
      }

      const newCount = Math.min(challenge.currentCount + input.increment, challenge.targetCount)
      const isCompleted = newCount >= challenge.targetCount

      await db
        .update(therapistChallenges)
        .set({
          currentCount: newCount,
          status: isCompleted ? 'completed' : 'active',
          completedAt: isCompleted ? new Date() : null,
        })
        .where(eq(therapistChallenges.id, input.challengeId))

      let xpResult: Awaited<ReturnType<typeof awardTherapistXP>> | null = null
      if (isCompleted) {
        // Dar XP pela conclusão do desafio
        const action =
          challenge.bonusMultiplier > 1 ? 'completeChallengeBonus' : 'completeChallenge'
        xpResult = await awardTherapistXP(db, ctx.user.id, action, challenge.bonusMultiplier)
      }

      return {
        challenge: {
          ...challenge,
          currentCount: newCount,
          status: isCompleted ? 'completed' : 'active',
        },
        completed: isCompleted,
        xpResult,
      }
    }),

  // Obter histórico de desafios
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const challenges = await db
        .select()
        .from(therapistChallenges)
        .where(eq(therapistChallenges.therapistId, ctx.user.id))
        .orderBy(desc(therapistChallenges.weekStart))
        .limit(input.limit)

      // Agrupar por semana
      const grouped = challenges.reduce(
        (acc, challenge) => {
          const weekKey = challenge.weekStart.toISOString().split('T')[0]
          if (!acc[weekKey]) {
            acc[weekKey] = {
              weekStart: challenge.weekStart,
              weekEnd: challenge.weekEnd,
              challenges: [],
              completedCount: 0,
              totalXp: 0,
            }
          }
          acc[weekKey].challenges.push(challenge)
          if (challenge.status === 'completed') {
            acc[weekKey].completedCount++
            acc[weekKey].totalXp += challenge.xpReward * challenge.bonusMultiplier
          }
          return acc
        },
        {} as Record<
          string,
          {
            weekStart: Date
            weekEnd: Date
            challenges: typeof challenges
            completedCount: number
            totalXp: number
          }
        >
      )

      return Object.values(grouped)
    }),

  // Verificar expiração de desafios (chamado periodicamente)
  expireOldChallenges: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const now = new Date()

    const result = await db
      .update(therapistChallenges)
      .set({ status: 'expired' })
      .where(
        and(
          eq(therapistChallenges.therapistId, ctx.user.id),
          eq(therapistChallenges.status, 'active'),
          lte(therapistChallenges.weekEnd, now)
        )
      )

    return { expired: result.rowsAffected || 0 }
  }),

  // Obter estatísticas de desafios
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const allChallenges = await db
      .select()
      .from(therapistChallenges)
      .where(eq(therapistChallenges.therapistId, ctx.user.id))

    const completed = allChallenges.filter((c) => c.status === 'completed')
    const expired = allChallenges.filter((c) => c.status === 'expired')
    const totalXpEarned = completed.reduce((sum, c) => sum + c.xpReward * c.bonusMultiplier, 0)

    // Calcular streak de semanas com todos os desafios completados
    const weekGroups = allChallenges.reduce(
      (acc, c) => {
        const key = c.weekStart.toISOString()
        if (!acc[key]) acc[key] = { total: 0, completed: 0 }
        acc[key].total++
        if (c.status === 'completed') acc[key].completed++
        return acc
      },
      {} as Record<string, { total: number; completed: number }>
    )

    const perfectWeeks = Object.values(weekGroups).filter(
      (w) => w.total > 0 && w.completed === w.total
    ).length

    return {
      totalChallenges: allChallenges.length,
      completedChallenges: completed.length,
      expiredChallenges: expired.length,
      completionRate:
        allChallenges.length > 0 ? Math.round((completed.length / allChallenges.length) * 100) : 0,
      totalXpEarned,
      perfectWeeks,
    }
  }),
})
