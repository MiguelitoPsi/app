/**
 * Sistema de atualização automática de metas
 * Calcula o progresso das metas baseado em dados reais do sistema
 */

import { and, count, eq, gte, lte, sql, sum } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { therapistFinancial, therapistGoals, therapySessions } from '@/lib/db/schema'
import { awardTherapistXP } from '@/lib/xp/therapist'

type GoalCategory = 'schedule' | 'revenue' | 'retention' | 'expansion' | 'professional_development'

type CalculateGoalProgressParams = {
  db: LibSQLDatabase<Record<string, unknown>>
  therapistId: string
  category: GoalCategory
  unit: string
  deadline?: Date | null
}

/**
 * Calcula o progresso atual de uma meta baseado na sua categoria e unidade
 */
async function calculateGoalProgress({
  db,
  therapistId,
  category,
  unit,
  deadline,
}: CalculateGoalProgressParams): Promise<number> {
  const now = new Date()

  // Determinar período de cálculo
  // Se houver deadline, calcula desde o início do mês até agora
  // Se a unidade indicar semana, calcula a semana atual
  let startDate: Date
  const endDate: Date = now

  if (unit.includes('semana')) {
    // Início da semana atual (segunda-feira)
    startDate = new Date(now)
    const day = startDate.getDay()
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate.setDate(diff)
    startDate.setHours(0, 0, 0, 0)
  } else if (unit.includes('mês') || unit.includes('mensal')) {
    // Início do mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (deadline) {
    // Se tem deadline, calcular desde o início do mês da criação até agora
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // Padrão: mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  switch (category) {
    case 'schedule': {
      // Contar sessões completadas no período
      const [result] = await db
        .select({ count: count() })
        .from(therapySessions)
        .where(
          and(
            eq(therapySessions.therapistId, therapistId),
            eq(therapySessions.status, 'completed'),
            gte(therapySessions.scheduledAt, startDate),
            lte(therapySessions.scheduledAt, endDate)
          )
        )

      // Se a unidade for porcentagem (taxa de comparecimento)
      if (unit === '%') {
        const [total] = await db
          .select({ count: count() })
          .from(therapySessions)
          .where(
            and(
              eq(therapySessions.therapistId, therapistId),
              gte(therapySessions.scheduledAt, startDate),
              lte(therapySessions.scheduledAt, endDate)
            )
          )

        const [noShow] = await db
          .select({ count: count() })
          .from(therapySessions)
          .where(
            and(
              eq(therapySessions.therapistId, therapistId),
              eq(therapySessions.status, 'no_show'),
              gte(therapySessions.scheduledAt, startDate),
              lte(therapySessions.scheduledAt, endDate)
            )
          )

        const totalSessions = total?.count ?? 0
        const noShowCount = noShow?.count ?? 0

        if (totalSessions === 0) return 0

        // Taxa de comparecimento = (total - no_show) / total * 100
        return Math.round(((totalSessions - noShowCount) / totalSessions) * 100)
      }

      return result?.count ?? 0
    }

    case 'revenue': {
      // Somar receitas no período
      const [result] = await db
        .select({ total: sum(therapistFinancial.amount) })
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, therapistId),
            eq(therapistFinancial.type, 'income'),
            gte(therapistFinancial.date, startDate),
            lte(therapistFinancial.date, endDate)
          )
        )

      // Também incluir receita de sessões completadas
      const [sessionRevenue] = await db
        .select({ total: sum(therapySessions.sessionValue) })
        .from(therapySessions)
        .where(
          and(
            eq(therapySessions.therapistId, therapistId),
            eq(therapySessions.status, 'completed'),
            gte(therapySessions.scheduledAt, startDate),
            lte(therapySessions.scheduledAt, endDate)
          )
        )

      const financialTotal = Number(result?.total ?? 0)
      const sessionsTotal = Number(sessionRevenue?.total ?? 0)

      // Evitar duplicação: se a sessão já foi registrada como income, não somar novamente
      // Por simplicidade, assumimos que sessões não são duplicadas no financeiro
      return financialTotal + sessionsTotal
    }

    case 'retention': {
      // Calcular taxa de retenção é mais complexo
      // Por enquanto, retornamos um placeholder que precisa ser calculado manualmente
      // ou baseado em métricas específicas do sistema
      // TODO: Implementar cálculo de retenção baseado em pacientes ativos vs. inativos
      return 0
    }

    case 'expansion': {
      // Número de pacientes ativos
      // Como não temos uma tabela específica de pacientes ativos,
      // contamos pacientes únicos com sessões no último mês
      const [result] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${therapySessions.patientId})` })
        .from(therapySessions)
        .where(
          and(
            eq(therapySessions.therapistId, therapistId),
            gte(therapySessions.scheduledAt, startDate),
            lte(therapySessions.scheduledAt, endDate)
          )
        )

      return result?.count ?? 0
    }

    case 'professional_development': {
      // Desenvolvimento profissional geralmente é manual
      // (cursos, certificações, etc.)
      return 0
    }

    default:
      return 0
  }
}

/**
 * Atualiza automaticamente o progresso de todas as metas ativas de um terapeuta
 */
export async function updateAllGoalsProgress(
  db: LibSQLDatabase<Record<string, unknown>>,
  therapistId: string
): Promise<{
  updated: number
  completed: number
  goals: Array<{
    id: string
    title: string
    previousValue: number
    currentValue: number
    completed: boolean
  }>
}> {
  // Buscar todas as metas ativas
  const activeGoals = await db
    .select()
    .from(therapistGoals)
    .where(and(eq(therapistGoals.therapistId, therapistId), eq(therapistGoals.status, 'active')))

  const results: Array<{
    id: string
    title: string
    previousValue: number
    currentValue: number
    completed: boolean
  }> = []

  let completedCount = 0

  for (const goal of activeGoals) {
    // Calcular progresso atual baseado na categoria
    const currentValue = await calculateGoalProgress({
      db,
      therapistId,
      category: goal.category as GoalCategory,
      unit: goal.unit,
      deadline: goal.deadline,
    })

    // Só atualiza se o valor mudou
    if (currentValue !== goal.currentValue) {
      const isCompleted = currentValue >= goal.targetValue
      const wasNotCompleted = goal.status !== 'completed'

      await db
        .update(therapistGoals)
        .set({
          currentValue,
          status: isCompleted ? 'completed' : goal.status,
          completedAt: isCompleted && wasNotCompleted ? new Date() : goal.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(therapistGoals.id, goal.id))

      // Se completou a meta, dar XP
      if (isCompleted && wasNotCompleted) {
        await awardTherapistXP(db, therapistId, 'achieveGoal')
        completedCount++
      }

      results.push({
        id: goal.id,
        title: goal.title,
        previousValue: goal.currentValue,
        currentValue,
        completed: isCompleted && wasNotCompleted,
      })
    }
  }

  return {
    updated: results.length,
    completed: completedCount,
    goals: results,
  }
}

/**
 * Atualiza metas de uma categoria específica
 * Útil para chamar após ações específicas (ex: após completar sessão, atualizar metas de 'schedule')
 */
export async function updateGoalsByCategory(
  db: LibSQLDatabase<Record<string, unknown>>,
  therapistId: string,
  category: GoalCategory
): Promise<void> {
  const goalsToUpdate = await db
    .select()
    .from(therapistGoals)
    .where(
      and(
        eq(therapistGoals.therapistId, therapistId),
        eq(therapistGoals.status, 'active'),
        eq(therapistGoals.category, category)
      )
    )

  for (const goal of goalsToUpdate) {
    const currentValue = await calculateGoalProgress({
      db,
      therapistId,
      category,
      unit: goal.unit,
      deadline: goal.deadline,
    })

    if (currentValue !== goal.currentValue) {
      const isCompleted = currentValue >= goal.targetValue
      const wasNotCompleted = goal.status !== 'completed'

      await db
        .update(therapistGoals)
        .set({
          currentValue,
          status: isCompleted ? 'completed' : goal.status,
          completedAt: isCompleted && wasNotCompleted ? new Date() : goal.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(therapistGoals.id, goal.id))

      if (isCompleted && wasNotCompleted) {
        await awardTherapistXP(db, therapistId, 'achieveGoal')
      }
    }
  }
}
