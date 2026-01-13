/**
 * Router tRPC para gestão financeira do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, isNull, lte, or, sum } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { FINANCIAL_CATEGORIES, GOAL_CATEGORIES } from '@/lib/constants/therapist'
import { db } from '@/lib/db'
import { therapistFinancial, therapistGoals, therapySessions } from '@/lib/db/schema'
import { updateAllGoalsProgress, updateGoalsByCategory } from '@/lib/goals/auto-update'
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
        accountType: z.enum(['pj', 'cpf']).optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Fetch all records for this therapist (we'll filter later to include recurring)
      const allRecords = await db
        .select()
        .from(therapistFinancial)
        .where(eq(therapistFinancial.therapistId, ctx.user.id))
        .orderBy(desc(therapistFinancial.date));

      const result: typeof allRecords = []

      for (const record of allRecords) {
        // Apply accountType filter first
        if (input.accountType && record.accountType !== input.accountType) continue

        // If no date range specified, just filter normally
        if (!(input.startDate && input.endDate)) {
          // Apply type and category filters
          if (input.type && record.type !== input.type) continue
          if (input.category && record.category !== input.category) continue
          result.push(record)
          continue
        }

        const recordDate = new Date(record.date)

        // Non-recurring records: check if within range
        if (!record.isRecurring) {
          if (recordDate >= input.startDate && recordDate <= input.endDate) {
            if (input.type && record.type !== input.type) continue
            if (input.category && record.category !== input.category) continue
            result.push(record)
          }
          continue
        }

        // Recurring records: expand into future periods
        if (record.isRecurring) {
          // Apply type and category filters first
          if (input.type && record.type !== input.type) continue
          if (input.category && record.category !== input.category) continue

          const frequency = record.frequency
          const originalDate = new Date(record.date)

          // Generate occurrences within the queried range
          const currentDate = new Date(originalDate)

          // Limit to prevent infinite loops (max 60 occurrences / 5 years)
          let iterations = 0
          const maxIterations = 60

          while (currentDate <= input.endDate && iterations < maxIterations) {
            if (currentDate >= input.startDate && currentDate <= input.endDate) {
              // Create a virtual record for this occurrence
              result.push({
                ...record,
                id: `${record.id}_${currentDate.toISOString()}`, // Virtual ID
                date: new Date(currentDate),
              })
            }

            // Move to next occurrence
            if (frequency === 'weekly') {
              currentDate.setDate(currentDate.getDate() + 7)
            } else if (frequency === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + 1)
            } else if (frequency === 'yearly') {
              currentDate.setFullYear(currentDate.getFullYear() + 1)
            } else {
              break // Unknown frequency
            }

            iterations++
          }
        }
      }

      // Sort by date descending and apply limit
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return result.slice(0, input.limit)
    }),

  // Adicionar registro financeiro
  addRecord: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(['pj', 'cpf']).default('cpf'),
        type: z.enum(['income', 'expense']),
        category: z.enum([
          'session',
          'plan',
          'workshop',
          'supervision',
          'consultation',
          'subscription',
          'rent',
          'equipment',
          'marketing',
          'training',
          'taxes',
          'utilities',
          'insurance',
          'software',
          'material',
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
          accountType: input.accountType,
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

      // Atualizar metas de receita automaticamente se for income
      if (input.type === 'income') {
        await updateGoalsByCategory(db, ctx.user.id, 'revenue')
      }

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
        accountType: z.enum(['pj', 'cpf']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Fetch all records for this therapist
      const allRecords = await db
        .select()
        .from(therapistFinancial)
        .where(eq(therapistFinancial.therapistId, ctx.user.id))

      // Expand recurring records
      const expandedRecords: typeof allRecords = [];

      for (const record of allRecords) {
        // Ignorar pagamentos pendentes nos totais
        if (record.status === 'pending') continue;
        // Filter by accountType if specified
        if (input.accountType && record.accountType !== input.accountType) continue;

        const recordDate = new Date(record.date);

        // Non-recurring records: check if within range
        if (!record.isRecurring) {
          if (recordDate >= input.startDate && recordDate <= input.endDate) {
            expandedRecords.push(record)
          }
          continue
        }

        // Recurring records: expand into the queried range
        const frequency = record.frequency
        const originalDate = new Date(record.date)
        const currentDate = new Date(originalDate)

        // Limit iterations (max 60 occurrences / 5 years)
        let iterations = 0
        const maxIterations = 60

        while (currentDate <= input.endDate && iterations < maxIterations) {
          if (currentDate >= input.startDate && currentDate <= input.endDate) {
            expandedRecords.push({
              ...record,
              id: `${record.id}_${currentDate.toISOString()}`,
              date: new Date(currentDate),
            })
          }

          // Move to next occurrence
          if (frequency === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7)
          } else if (frequency === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1)
          } else if (frequency === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + 1)
          } else {
            break
          }

          iterations++
        }
      }

      const income = expandedRecords
        .filter((r) => r.type === 'income')
        .reduce((total, r) => total + r.amount, 0)

      const expenses = expandedRecords
        .filter((r) => r.type === 'expense')
        .reduce((total, r) => total + r.amount, 0)

      const balance = income - expenses

      // Agrupar por categoria
      const byCategory = expandedRecords.reduce(
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
    .input(z.object({ months: z.number().min(1).max(24).default(12) }))
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
          // Ignorar pagamentos pendentes
          if (r.status === 'pending') return acc;
          
          const monthKey = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
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

  // Obter resumo anual completo
  getYearlySummary: protectedProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const year = input.year ?? new Date().getFullYear()
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)

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

      // Totais
      const totalIncome = records
        .filter((r) => r.type === 'income' && r.status !== 'pending')
        .reduce((acc, r) => acc + r.amount, 0);
      const totalExpenses = records
        .filter((r) => r.type === 'expense')
        .reduce((acc, r) => acc + r.amount, 0)

      // Por mês
      const byMonth: Record<string, { income: number; expense: number; balance: number }> = {}
      for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        byMonth[monthKey] = { income: 0, expense: 0, balance: 0 };
      }

      for (const r of records) {
        // Ignorar pagamentos pendentes nas estatísticas
        if (r.status === 'pending') continue;

        const monthKey = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
        if (r.type === 'income') {
          byMonth[monthKey].income += r.amount;
        } else {
          byMonth[monthKey].expense += r.amount;
        }
        byMonth[monthKey].balance = byMonth[monthKey].income - byMonth[monthKey].expense;
      }

      // Por categoria
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

      // Sessões do ano
      const sessions = await db
        .select()
        .from(therapySessions)
        .where(
          and(
            eq(therapySessions.therapistId, ctx.user.id),
            gte(therapySessions.scheduledAt, startDate),
            lte(therapySessions.scheduledAt, endDate)
          )
        )

      const completedSessions = sessions.filter((s) => s.status === 'completed')

      // Melhores meses
      const monthlyArray = Object.entries(byMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.income - a.income)
      const bestMonth = monthlyArray[0]
      const worstMonth = monthlyArray.at(-1)

      // Média mensal
      const monthsWithData = Object.values(byMonth).filter(
        (m) => m.income > 0 || m.expense > 0
      ).length
      const avgMonthlyIncome = monthsWithData > 0 ? totalIncome / monthsWithData : 0
      const avgMonthlyExpense = monthsWithData > 0 ? totalExpenses / monthsWithData : 0

      return {
        year,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        byMonth,
        byCategory,
        sessionsCount: completedSessions.length,
        bestMonth,
        worstMonth,
        avgMonthlyIncome,
        avgMonthlyExpense,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      }
    }),

  // Comparação entre dois períodos
  comparePeriods: protectedProcedure
    .input(
      z.object({
        current: z.object({ startDate: z.date(), endDate: z.date() }),
        previous: z.object({ startDate: z.date(), endDate: z.date() }),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Buscar dados do período atual
      const currentRecords = await db
        .select()
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            gte(therapistFinancial.date, input.current.startDate),
            lte(therapistFinancial.date, input.current.endDate)
          )
        )

      // Buscar dados do período anterior
      const previousRecords = await db
        .select()
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            gte(therapistFinancial.date, input.previous.startDate),
            lte(therapistFinancial.date, input.previous.endDate)
          )
        )

      const calculateTotals = (recs: typeof currentRecords) => ({
        income: recs.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0),
        expenses: recs.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0),
        recordCount: recs.length,
      })

      const current = calculateTotals(currentRecords)
      const previous = calculateTotals(previousRecords)

      const calcChange = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100

      return {
        current: {
          ...current,
          balance: current.income - current.expenses,
        },
        previous: {
          ...previous,
          balance: previous.income - previous.expenses,
        },
        changes: {
          income: calcChange(current.income, previous.income),
          expenses: calcChange(current.expenses, previous.expenses),
          balance: calcChange(
            current.income - current.expenses,
            previous.income - previous.expenses
          ),
        },
      }
    }),

  // Projeção financeira para o período
  getProjection: protectedProcedure
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

      const now = new Date();
      const records = await db
        .select()
        .from(therapistFinancial)
        .where(
          and(
            eq(therapistFinancial.therapistId, ctx.user.id),
            // Ignorar pendentes
            or(eq(therapistFinancial.status, 'paid'), isNull(therapistFinancial.status)),
            gte(therapistFinancial.date, input.startDate),
            lte(therapistFinancial.date, now)
          )
        );

      const currentIncome = records
        .filter((r) => r.type === 'income')
        .reduce((acc, r) => acc + r.amount, 0)
      const currentExpenses = records
        .filter((r) => r.type === 'expense')
        .reduce((acc, r) => acc + r.amount, 0)

      const totalDays =
        Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const daysPassed = Math.max(
        1,
        Math.ceil((now.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      const daysRemaining = Math.max(0, totalDays - daysPassed)

      const dailyIncomeAvg = currentIncome / daysPassed
      const dailyExpenseAvg = currentExpenses / daysPassed

      const projectedIncome = currentIncome + dailyIncomeAvg * daysRemaining
      const projectedExpenses = currentExpenses + dailyExpenseAvg * daysRemaining

      // Confiança baseada na quantidade de dados
      let confidence: 'low' | 'medium' | 'high' = 'low'
      if (daysPassed >= totalDays * 0.7) {
        confidence = 'high'
      } else if (daysPassed >= totalDays * 0.4) {
        confidence = 'medium'
      }

      return {
        currentIncome,
        currentExpenses,
        currentBalance: currentIncome - currentExpenses,
        projectedIncome: Math.round(projectedIncome),
        projectedExpenses: Math.round(projectedExpenses),
        projectedBalance: Math.round(projectedIncome - projectedExpenses),
        dailyIncomeAvg: Math.round(dailyIncomeAvg * 100) / 100,
        dailyExpenseAvg: Math.round(dailyExpenseAvg * 100) / 100,
        daysRemaining,
        percentComplete: Math.round((daysPassed / totalDays) * 100),
        confidence,
      }
    }),

  // ==========================================
  // METAS PROFISSIONAIS
  // ==========================================

  // Recalcular progresso de todas as metas ativas
  recalculateGoals: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const result = await updateAllGoalsProgress(db, ctx.user.id)

    return result
  }),

  // Listar metas (com recálculo automático opcional)
  getGoals: protectedProcedure
    .input(
      z.object({
        status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
        autoRecalculate: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Recalcular metas ativas automaticamente se solicitado
      if (input.autoRecalculate && (!input.status || input.status === 'active')) {
        await updateAllGoalsProgress(db, ctx.user.id)
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

  // Incrementar progresso da meta
  incrementGoalProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        incrementBy: z.number().min(1).default(1),
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

      const newValue = goal.currentValue + input.incrementBy
      const isCompleted = newValue >= goal.targetValue
      const wasNotCompleted = goal.status !== 'completed'

      const [updated] = await db
        .update(therapistGoals)
        .set({
          currentValue: newValue,
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
        newValue,
        progress: Math.min(100, (newValue / goal.targetValue) * 100),
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

  // Toggle goal completion manually
  toggleGoalCompletion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean(),
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

      const wasNotCompleted = goal.status !== 'completed'

      const [updated] = await db
        .update(therapistGoals)
        .set({
          status: input.completed ? 'completed' : 'active',
          currentValue: input.completed ? goal.targetValue : goal.currentValue,
          completedAt: input.completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(therapistGoals.id, input.id))
        .returning()

      // If completing the goal for the first time, give XP
      if (input.completed && wasNotCompleted) {
        await awardTherapistXP(db, ctx.user.id, 'achieveGoal')
      }

      return {
        goal: updated,
        completed: input.completed,
      }
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

    // Verificar despesas recorrentes
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const recurringRecords = await db
      .select()
      .from(therapistFinancial)
      .where(
        and(
          eq(therapistFinancial.therapistId, ctx.user.id),
          eq(therapistFinancial.isRecurring, true)
        )
      )

    const recurringExpenses = recurringRecords.filter((r) => r.type === 'expense')
    const recurringIncome = recurringRecords.filter((r) => r.type === 'income')

    if (recurringExpenses.length > 0) {
      const monthlyExpenses = recurringExpenses.filter((e) => e.frequency === 'monthly')
      const weeklyExpenses = recurringExpenses.filter((e) => e.frequency === 'weekly')

      let message = `Você tem ${recurringExpenses.length} despesa(s) recorrente(s)`
      if (monthlyExpenses.length > 0) {
        const monthlyTotal = monthlyExpenses.reduce((t, e) => t + e.amount, 0)
        message += ` (R$${monthlyTotal.toFixed(2)}/mês)`
      }
      if (weeklyExpenses.length > 0) {
        const weeklyTotal = weeklyExpenses.reduce((t, e) => t + e.amount, 0)
        message += ` + R$${(weeklyTotal * 4).toFixed(2)}/mês em despesas semanais`
      }

      alerts.push({
        type: 'info',
        title: '💸 Despesas Recorrentes',
        message,
      })
    }

    if (recurringIncome.length > 0) {
      const monthlyIncome = recurringIncome.filter((e) => e.frequency === 'monthly')

      if (monthlyIncome.length > 0) {
        const monthlyTotal = monthlyIncome.reduce((t, e) => t + e.amount, 0)
        alerts.push({
          type: 'success',
          title: '💰 Receitas Recorrentes',
          message: `Você tem R$${monthlyTotal.toFixed(2)} em receitas mensais garantidas de ${monthlyIncome.length} fonte(s).`,
        })
      }
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
