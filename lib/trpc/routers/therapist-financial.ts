/**
 * Router tRPC para gestão financeira do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, lte, sum } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { FINANCIAL_CATEGORIES, GOAL_CATEGORIES } from '@/lib/constants/therapist'
import { db } from '@/lib/db'
import { therapistFinancial, therapistGoals, therapySessions } from '@/lib/db/schema'
import { awardTherapistXP } from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'

export const therapistFinancialRouter = router({
  // ==========================================
  // REGISTROS FINANCEIROS
  // ==========================================

  // Listar registros financeiros
  getRecords: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(['income', 'expense']).optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const conditions = [eq(therapistFinancial.therapistId, ctx.user.id)]

      if (input.startDate) {
        conditions.push(gte(therapistFinancial.date, input.startDate))
      }
      if (input.endDate) {
        conditions.push(lte(therapistFinancial.date, input.endDate))
      }
      if (input.type) {
        conditions.push(eq(therapistFinancial.type, input.type))
      }
      if (input.category) {
        conditions.push(
          eq(
            therapistFinancial.category,
            input.category as (typeof therapistFinancial.$inferSelect)['category']
          )
        )
      }

      const records = await db
        .select()
        .from(therapistFinancial)
        .where(and(...conditions))
        .orderBy(desc(therapistFinancial.date))
        .limit(input.limit)

      return records
    }),

  // Adicionar registro financeiro
  addRecord: protectedProcedure
    .input(
      z.object({
        type: z.enum(['income', 'expense']),
        category: z.enum([
          'session',
          'subscription',
          'rent',
          'equipment',
          'marketing',
          'training',
          'taxes',
          'other',
        ]),
        amount: z.number().min(0),
        description: z.string().optional(),
        patientId: z.string().optional(),
        date: z.date(),
        isRecurring: z.boolean().default(false),
        frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
        metadata: z
          .object({
            notes: z.string().optional(),
            paymentMethod: z.string().optional(),
            invoiceNumber: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [record] = await db
        .insert(therapistFinancial)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          type: input.type,
          category: input.category,
          amount: input.amount,
          description: input.description,
          patientId: input.patientId,
          date: input.date,
          isRecurring: input.isRecurring,
          frequency: input.frequency,
          metadata: input.metadata,
        })
        .returning()

      // Dar XP por atualizar registros financeiros
      await awardTherapistXP(db, ctx.user.id, 'updateFinancialRecord')

      return record
    }),

  // Atualizar registro financeiro
  updateRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().min(0).optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        metadata: z
          .object({
            notes: z.string().optional(),
            paymentMethod: z.string().optional(),
            invoiceNumber: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { id, ...updateData } = input

      const [record] = await db
        .update(therapistFinancial)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(therapistFinancial.id, id), eq(therapistFinancial.therapistId, ctx.user.id)))
        .returning()

      if (!record) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Registro não encontrado',
        })
      }

      return record
    }),

  // Excluir registro financeiro
  deleteRecord: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await db
        .delete(therapistFinancial)
        .where(
          and(eq(therapistFinancial.id, input.id), eq(therapistFinancial.therapistId, ctx.user.id))
        )

      return { success: true }
    }),

  // Obter resumo financeiro
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const records = await db
        .select()
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            gte(therapistFinancial.date, input.startDate),
            lte(therapistFinancial.date, input.endDate)
          )
        )

      const income = records
        .filter((r) => r.type === 'income')
        .reduce((total, r) => total + r.amount, 0)

      const expenses = records
        .filter((r) => r.type === 'expense')
        .reduce((total, r) => total + r.amount, 0)

      const balance = income - expenses

      // Agrupar por categoria
      const byCategory = records.reduce(
        (acc, r) => {
          if (!acc[r.category]) {
            acc[r.category] = { income: 0, expense: 0 }
          }
          if (r.type === 'income') {
            acc[r.category].income += r.amount
          } else {
            acc[r.category].expense += r.amount
          }
          return acc
        },
        {} as Record<string, { income: number; expense: number }>
      )

      // Calcular sessões do período
      const sessions = await db
        .select()
        .from(therapySessions)
        .where(
          and(
            eq(therapySessions.therapistId, ctx.user.id),
            gte(therapySessions.scheduledAt, input.startDate),
            lte(therapySessions.scheduledAt, input.endDate)
          )
        )

      const completedSessions = sessions.filter((s) => s.status === 'completed')
      const sessionRevenue = completedSessions.reduce(
        (total, s) => total + (s.sessionValue || 0),
        0
      )

      return {
        income,
        expenses,
        balance,
        byCategory,
        sessionsCount: completedSessions.length,
        sessionRevenue,
        averageSessionValue:
          completedSessions.length > 0 ? Math.round(sessionRevenue / completedSessions.length) : 0,
        categories: FINANCIAL_CATEGORIES,
      }
    }),

  // Obter fluxo de caixa mensal
  getMonthlyCashflow: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).default(6) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - input.months)

      const records = await db
        .select()
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            gte(therapistFinancial.date, startDate),
            lte(therapistFinancial.date, endDate)
          )
        )

      // Agrupar por mês
      const monthly = records.reduce(
        (acc, r) => {
          const monthKey = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, income: 0, expense: 0, balance: 0 }
          }
          if (r.type === 'income') {
            acc[monthKey].income += r.amount
          } else {
            acc[monthKey].expense += r.amount
          }
          acc[monthKey].balance = acc[monthKey].income - acc[monthKey].expense
          return acc
        },
        {} as Record<string, { month: string; income: number; expense: number; balance: number }>
      )

      return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
    }),

  // ==========================================
  // METAS PROFISSIONAIS
  // ==========================================

  // Listar metas
  getGoals: protectedProcedure
    .input(
      z.object({
        status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const conditions = [eq(therapistGoals.therapistId, ctx.user.id)]
      if (input.status) {
        conditions.push(eq(therapistGoals.status, input.status))
      }

      const goals = await db
        .select()
        .from(therapistGoals)
        .where(and(...conditions))
        .orderBy(desc(therapistGoals.createdAt))

      return goals.map((g) => ({
        ...g,
        progress: Math.min(100, (g.currentValue / g.targetValue) * 100),
        categoryInfo: GOAL_CATEGORIES[g.category as keyof typeof GOAL_CATEGORIES],
      }))
    }),

  // Criar meta
  createGoal: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum([
          'schedule',
          'revenue',
          'retention',
          'expansion',
          'professional_development',
        ]),
        targetValue: z.number().min(1),
        unit: z.string().default('count'),
        deadline: z.date().optional(),
        aiSuggested: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [goal] = await db
        .insert(therapistGoals)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          targetValue: input.targetValue,
          currentValue: 0,
          unit: input.unit,
          deadline: input.deadline,
          status: 'active',
          aiSuggested: input.aiSuggested,
        })
        .returning()

      return goal
    }),

  // Atualizar progresso da meta
  updateGoalProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        currentValue: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [goal] = await db
        .select()
        .from(therapistGoals)
        .where(and(eq(therapistGoals.id, input.id), eq(therapistGoals.therapistId, ctx.user.id)))
        .limit(1)

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Meta não encontrada' })
      }

      const isCompleted = input.currentValue >= goal.targetValue
      const wasNotCompleted = goal.status !== 'completed'

      const [updated] = await db
        .update(therapistGoals)
        .set({
          currentValue: input.currentValue,
          status: isCompleted ? 'completed' : goal.status,
          completedAt: isCompleted && wasNotCompleted ? new Date() : goal.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(therapistGoals.id, input.id))
        .returning()

      // Se completou a meta, dar XP
      if (isCompleted && wasNotCompleted) {
        await awardTherapistXP(db, ctx.user.id, 'achieveGoal')
      }

      return {
        goal: updated,
        completed: isCompleted && wasNotCompleted,
      }
    }),

  // Atualizar status da meta
  updateGoalStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['active', 'paused', 'cancelled']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [goal] = await db
        .update(therapistGoals)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(therapistGoals.id, input.id), eq(therapistGoals.therapistId, ctx.user.id)))
        .returning()

      return goal
    }),

  // Excluir meta
  deleteGoal: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await db
        .delete(therapistGoals)
        .where(and(eq(therapistGoals.id, input.id), eq(therapistGoals.therapistId, ctx.user.id)))

      return { success: true }
    }),

  // Obter sugestões de metas da IA (placeholder)
  getAiGoalSuggestions: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    // TODO: Integrar com serviço de IA para sugestões personalizadas
    // Por enquanto, retornar sugestões estáticas baseadas nas categorias
    const suggestions = [
      {
        category: 'schedule' as const,
        title: 'Preencher horários vagos',
        description: 'Alcançar 20 sessões por semana até o final do mês',
        targetValue: 20,
        unit: 'sessões/semana',
        rationale: 'Baseado na sua média atual, há potencial para aumentar o número de sessões.',
      },
      {
        category: 'revenue' as const,
        title: 'Aumentar faturamento mensal',
        description: 'Alcançar R$10.000 de faturamento mensal',
        targetValue: 10_000,
        unit: 'R$',
        rationale: 'Meta de crescimento de 20% em relação ao mês anterior.',
      },
      {
        category: 'retention' as const,
        title: 'Melhorar retenção de pacientes',
        description: 'Manter 80% dos pacientes por mais de 3 meses',
        targetValue: 80,
        unit: '%',
        rationale: 'A retenção é fundamental para um consultório estável.',
      },
    ]

    return suggestions
  }),

  // Obter alertas financeiros
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const alerts: Array<{
      type: 'warning' | 'info' | 'success'
      title: string
      message: string
    }> = []

    // Verificar despesas recorrentes pendentes
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const recurringExpenses = await db
      .select()
      .from(therapistFinancial)
      .where(
        and(
          eq(therapistFinancial.therapistId, ctx.user.id),
          eq(therapistFinancial.type, 'expense'),
          eq(therapistFinancial.isRecurring, true)
        )
      )

    if (recurringExpenses.length > 0) {
      const totalRecurring = recurringExpenses.reduce((total, e) => total + e.amount, 0)
      alerts.push({
        type: 'info',
        title: 'Despesas Recorrentes',
        message: `Você tem R$${totalRecurring.toFixed(2)} em despesas recorrentes cadastradas.`,
      })
    }

    // Verificar metas próximas do prazo
    const upcomingDeadlines = await db
      .select()
      .from(therapistGoals)
      .where(and(eq(therapistGoals.therapistId, ctx.user.id), eq(therapistGoals.status, 'active')))

    const nearDeadline = upcomingDeadlines.filter((g) => {
      if (!g.deadline) return false
      const daysUntil = Math.ceil((g.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && daysUntil > 0
    })

    for (const goal of nearDeadline) {
      alerts.push({
        type: 'warning',
        title: 'Meta Próxima do Prazo',
        message: `A meta "${goal.title}" vence em breve!`,
      })
    }

    // Verificar se há receita este mês
    const monthlyIncome = await db
      .select({ total: sum(therapistFinancial.amount) })
      .from(therapistFinancial)
      .where(
        and(
          eq(therapistFinancial.therapistId, ctx.user.id),
          eq(therapistFinancial.type, 'income'),
          gte(therapistFinancial.date, monthStart),
          lte(therapistFinancial.date, monthEnd)
        )
      )

    if (!monthlyIncome[0]?.total || Number(monthlyIncome[0].total) === 0) {
      alerts.push({
        type: 'warning',
        title: 'Sem Receitas Registradas',
        message: 'Você ainda não registrou receitas este mês.',
      })
    }

    return alerts
  }),
})
