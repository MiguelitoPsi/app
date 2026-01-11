/**
 * Router tRPC para tarefas da rotina pessoal do terapeuta
 * Separado das tarefas que o terapeuta cria para pacientes
 */

import { TRPCError } from '@trpc/server'
import { and, asc, eq, gte, isNull, lt, ne, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { patientTasksFromTherapist, psychologistPatients, tasks, therapistTasks, users } from '@/lib/db/schema'
import { TASK_LIMITS } from '@/lib/constants'

import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'
import { awardTherapistXP, type THERAPIST_XP_ACTIONS } from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'
import { therapistFinancial } from '@/lib/db/schema'

// XP rewards for therapist tasks by priority
const THERAPIST_TASK_XP: Record<string, number> = {
  high: 30,
  medium: 20,
  low: 15,
} as const

export const therapistTasksRouter = router({
  // Get all personal tasks for the therapist
  getAll: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar esta funcionalidade',
      })
    }

    return ctx.db
      .select()
      .from(therapistTasks)
      .where(eq(therapistTasks.therapistId, ctx.user.id))
      .orderBy(
        // Data mais próxima primeiro (nulls por último)
        sql`CASE WHEN ${therapistTasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
        asc(therapistTasks.dueDate),
        // Prioridade alta primeiro
        sql`CASE ${therapistTasks.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
      )
  }),

  // Get tasks for a specific date range
  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem acessar esta funcionalidade',
        })
      }

      return ctx.db
        .select()
        .from(therapistTasks)
        .where(
          and(
            eq(therapistTasks.therapistId, ctx.user.id),
            or(
              // Tasks with due date in range
              and(
                gte(therapistTasks.dueDate, input.startDate),
                lt(therapistTasks.dueDate, input.endDate)
              ),
              // Recurring tasks or tasks without specific due date
              isNull(therapistTasks.dueDate)
            )
          )
        )
        .orderBy(
          // Data mais próxima primeiro (nulls por último)
          sql`CASE WHEN ${therapistTasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
          asc(therapistTasks.dueDate),
          // Prioridade alta primeiro
          sql`CASE ${therapistTasks.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
        )
    }),

  // Create a new personal task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z
          .enum([
            'feedback',
            'session',
            'review_records',
            'create_plan',
            'approve_reward',
            'custom',
          ])
          .default('custom'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        dueDate: z.string().optional(),
        isRecurring: z.boolean().default(false),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'once']).optional(),
        patientId: z.string().optional(),
        // Nova categoria de tarefa: 'geral' (para terapeuta) ou 'sessao' (cria também para paciente)
        taskCategory: z.enum(['geral', 'sessao']).default('geral'),
        // Dias da semana para frequência semanal/quinzenal (0-6, onde 0 = Domingo)
        weekDays: z.array(z.number()).optional(),
        // Dia do mês para frequência única de sessão (1-31)
        monthDay: z.number().optional(),
        // Dias do mês para frequência mensal de tarefas gerais (1-31)
        monthDays: z.array(z.number()).optional(),
        // Valor da sessão para fins financeiros
        sessionValue: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem criar tarefas',
        })
      }

      const today = new Date()

      // Se for sessão, precisa ter um paciente selecionado
      if (input.taskCategory === 'sessao' && !input.patientId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'É necessário selecionar um paciente para tarefas de sessão',
        })
      }

      // Se for sessão com frequência semanal/quinzenal, precisa ter weekDays selecionado
      if (
        input.taskCategory === 'sessao' &&
        input.frequency &&
        ['weekly', 'biweekly'].includes(input.frequency) &&
        (!input.weekDays || input.weekDays.length === 0)
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'É necessário selecionar o dia da semana para sessões com frequência',
        })
      }

      // Se for sessão com frequência única, precisa ter dueDate selecionado
      if (
        input.taskCategory === 'sessao' &&
        input.frequency === 'once' &&
        !input.dueDate
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'É necessário selecionar a data para sessão única',
        })
      }

      // Verificar se o paciente está vinculado ao terapeuta
      if (input.patientId) {
        const relationship = await ctx.db
          .select()
          .from(psychologistPatients)
          .where(
            and(
              eq(psychologistPatients.psychologistId, ctx.user.id),
              eq(psychologistPatients.patientId, input.patientId)
            )
          )
          .limit(1)

        if (relationship.length === 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Paciente não vinculado a este terapeuta',
          })
        }
      }

      // Validate that the date is not in the past
      if (input.dueDate) {
        // Parse date as UTC midnight to avoid timezone issues
        const [year, month, day] = input.dueDate.split('-').map(Number)
        const taskDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))

        if (taskDate < todayUTC) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível criar tarefas para datas que já passaram',
          })
        }
      }

      // Para sessão, sempre prioridade alta
      const effectivePriority = input.taskCategory === 'sessao' ? 'high' : input.priority
      const xpReward = THERAPIST_TASK_XP[effectivePriority] || 20

      // Parse date as UTC to avoid timezone issues
      let parsedDueDate: Date | null = null
      if (input.dueDate) {
        const [year, month, day] = input.dueDate.split('-').map(Number)
        parsedDueDate = new Date(Date.UTC(year, month - 1, day, 23, 0, 0, 0))
      }

      // Gerar datas para tarefas recorrentes de sessão baseadas no dia da semana
      const generateRecurringDatesFromWeekDays = (
        targetMonth: number,
        targetYear: number,
        frequency: 'weekly' | 'biweekly' | undefined
      ): Date[] => {
        if (!frequency || !input.weekDays || input.weekDays.length === 0) {
          return []
        }

        const dates: Date[] = []
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0)
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)

        // Encontrar o primeiro dia da semana correto a partir de HOJE (usando getDay() local)
        const dayOfWeek = input.weekDays[0] // Usamos o primeiro dia selecionado (0-6, onde 0=Domingo)

        let currentDate = new Date(todayStart)

        // Encontrar o primeiro dia da semana correto a partir de hoje
        // Se hoje é o dia correto, usamos hoje, senão procuramos a próxima ocorrência
        while (currentDate.getDay() !== dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Se a primeira data encontrada for anterior a hoje (caso edge), avançar uma semana
        if (currentDate < todayStart) {
          currentDate.setDate(currentDate.getDate() + 7)
        }

        // Gerar todas as datas do mês a partir da próxima ocorrência
        const interval = frequency === 'weekly' ? 7 : 14

        while (currentDate <= lastDayOfMonth) {
          // Criar data às 23:00 UTC para garantir exibição correta no frontend
          const utcDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 0, 0, 0))
          dates.push(utcDate)
          currentDate.setDate(currentDate.getDate() + interval)
        }

        return dates
      }

      // Gerar datas para sessões únicas baseadas em dia do mês
      const generateRecurringDateFromMonthDay = (
        targetMonth: number,
        targetYear: number
      ): Date[] => {
        if (!input.monthDay) {
          return []
        }

        const todayDay = today.getDate()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()

        // Se o dia selecionado for menor que hoje E não é o mês atual, não criar
        if (input.monthDay < todayDay && targetMonth === currentMonth && targetYear === currentYear) {
          return []
        }

        // Se o mês/ano alvo é anterior ao atual, não criar
        if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
          return []
        }

        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0)

        // Verificar se o dia existe no mês (evitar 31 em meses com 30 dias, etc)
        if (input.monthDay > lastDayOfMonth.getDate()) {
          return []
        }

        // Criar data às 23:00 UTC para garantir que a data seja exibida corretamente
        // Independente do timezone do usuário (Brasil UTC-3 ou UTC-4), 23:00 UTC = 20:00 ou 19:00 local
        // Isso garante que a data nunca mude para o dia anterior
        const date = new Date(Date.UTC(targetYear, targetMonth, input.monthDay, 23, 0, 0, 0))

        return [date]
      }

      // Para tarefas de sessão com frequência baseada em weekDays, criar múltiplas instâncias
      const isSessionWithWeekDays =
        input.taskCategory === 'sessao' &&
        input.frequency &&
        ['weekly', 'biweekly'].includes(input.frequency) &&
        input.weekDays &&
        input.weekDays.length > 0

      // Para tarefas de sessão com frequência única baseada em monthDay
      const isSessionWithMonthDay =
        input.taskCategory === 'sessao' && input.frequency === 'once' && input.monthDay

      const targetMonth = today.getMonth()
      const targetYear = today.getFullYear()

      const recurringDates = isSessionWithWeekDays
        ? generateRecurringDatesFromWeekDays(targetMonth, targetYear, input.frequency as 'weekly' | 'biweekly')
        : isSessionWithMonthDay // Deprecated path, kept for safety but shouldn't be hit with new frontend
          ? generateRecurringDateFromMonthDay(targetMonth, targetYear)
          : parsedDueDate
            ? [parsedDueDate]
            : []

      // Validar limites para a rotina do TERAPEUTA (Minha Rotina)
      // Sessões são exceções e podem exceder o limite
      if (parsedDueDate && input.taskCategory !== 'sessao') {
        const taskDateForValidation = new Date(parsedDueDate);
        taskDateForValidation.setHours(0, 0, 0, 0);
        
        const dayStart = new Date(taskDateForValidation);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const myTasksOnDate = await ctx.db
          .select()
          .from(therapistTasks)
          .where(
            and(
              eq(therapistTasks.therapistId, ctx.user.id),
              // Considerar a prioridade efetiva (sessões são high)
              eq(therapistTasks.priority, effectivePriority),
              gte(therapistTasks.dueDate, dayStart),
              lt(therapistTasks.dueDate, dayEnd),
              // Não contar tarefas canceladas se houver status cancelado (mas aqui só temos pending/completed/in_progress)
              ne(therapistTasks.status, 'cancelled')
            )
          );
        
        const totalMyTasks = myTasksOnDate.length;

        if (effectivePriority === 'high' && totalMyTasks >= TASK_LIMITS.high) {
             throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Você já possui ${totalMyTasks} tarefas de prioridade ALTA para esta data (Limite: ${TASK_LIMITS.high}).`
            })
        }

        if (effectivePriority === 'medium' && totalMyTasks >= TASK_LIMITS.medium) {
             throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Você já possui ${totalMyTasks} tarefas de prioridade MÉDIA para esta data (Limite: ${TASK_LIMITS.medium}).`
            })
        }
      }

      // ID da primeira tarefa (para retorno)
      const firstId = nanoid()
      const patientTaskIds: string[] = []

      // Criar tarefas para cada data recorrente
      for (let i = 0; i < recurringDates.length; i++) {
        const currentDate = recurringDates[i]
        const taskId = i === 0 ? firstId : nanoid()

        // Criar tarefa do terapeuta
        await ctx.db.insert(therapistTasks).values({
          id: taskId,
          therapistId: ctx.user.id,
          patientId: input.patientId || null,
          title: input.title,
          description: input.description,
          type: input.taskCategory === 'sessao' ? 'session' : input.type,
          priority: effectivePriority,
          status: 'pending',
          dueDate: currentDate,
          xpReward,
          isRecurring: input.isRecurring,
          frequency: input.frequency,
          isAiGenerated: false,
          weekDays: input.weekDays || null,
          monthDay: input.monthDay || null,
          monthDays: input.monthDays || null,
          metadata: input.sessionValue ? { sessionValue: input.sessionValue } : null,
        })

        // Se for tarefa de sessão, criar automaticamente na rotina do paciente
        if (input.taskCategory === 'sessao' && input.patientId) {
          const patientTaskId = nanoid()
          patientTaskIds.push(patientTaskId)

          await ctx.db.insert(patientTasksFromTherapist).values({
            id: patientTaskId,
            therapistId: ctx.user.id,
            patientId: input.patientId,
            title: input.title,
            description: input.description,
            category: 'sessao',
            priority: 'high', // Sessão sempre alta prioridade
            dueDate: currentDate,
            frequency: 'once', // Cada instância é uma ocorrência única
            status: 'pending',
            xpReward: 30, // XP alto para sessão
            isAiSuggested: false,
          })

          // Send push notification to patient
          const therapistName = ctx.user.name || 'Seu terapeuta'
          await sendPushToUser(
            ctx.db,
            input.patientId,
            PUSH_TEMPLATES.therapistTask(therapistName, input.title)
          )
        }
      }

      return {
        id: firstId,
        xpReward,
        patientTaskId: patientTaskIds[0] || null,
        createdCount: recurringDates.length,
      }
    }),

  // Complete a task and award XP
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem completar tarefas',
        })
      }

      // Get the task
      const [task] = await ctx.db
        .select()
        .from(therapistTasks)
        .where(and(eq(therapistTasks.id, input.id), eq(therapistTasks.therapistId, ctx.user.id)))
        .limit(1)

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarefa não encontrada',
        })
      }

      const now = new Date()

      // If task is already completed, toggle it back to pending (no XP deduction for therapist tasks)
      if (task.status === 'completed') {
        await ctx.db
          .update(therapistTasks)
          .set({
            status: 'pending',
            completedAt: null,
            updatedAt: now,
          })
          .where(eq(therapistTasks.id, input.id))

        // Se a tarefa tinha um registro financeiro associado (sessão), remover
        if (task.type === 'session' && task.metadata?.sessionValue) {
           await ctx.db
            .delete(therapistFinancial)
            .where(
              and(
                eq(therapistFinancial.therapistId, ctx.user.id),
                sql`JSON_EXTRACT(${therapistFinancial.metadata}, '$.taskId') = ${task.id}`
              )
            )
        }

        return {
          xpAwarded: 0,
          levelUp: false,
          status: 'uncompleted',
        }
      }

      // Complete the task
      await ctx.db
        .update(therapistTasks)
        .set({
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(therapistTasks.id, input.id))

      // Se for uma sessão com valor definido, criar registro financeiro
      if (task.type === 'session' && task.metadata?.sessionValue) {
        // Verificar se já existe (segurança)
        const existingRecord = await ctx.db
          .select()
          .from(therapistFinancial)
          .where(
            and(
              eq(therapistFinancial.therapistId, ctx.user.id),
              sql`JSON_EXTRACT(${therapistFinancial.metadata}, '$.taskId') = ${task.id}`
            )
          )
          .limit(1)

        if (existingRecord.length === 0) {
           const patientName = task.patientId ? (await ctx.db.select({ name: users.name }).from(users).where(eq(users.id, task.patientId)).limit(1))[0]?.name : 'Paciente'
           
           await ctx.db.insert(therapistFinancial).values({
            id: nanoid(),
            therapistId: ctx.user.id,
            type: 'income',
            category: 'session',
            amount: task.metadata.sessionValue,
            description: `Sessão - ${task.title.replace('Sessão - ', '')}`, // Tenta limpar o título se for gerado auto
            patientId: task.patientId,
            date: now,
            isRecurring: false,
            metadata: {
              notes: 'Gerado automaticamente via rotina',
              taskId: task.id
            }
          })
          
          await awardTherapistXP(ctx.db, ctx.user.id, 'updateFinancialRecord')
        }
      }

      // Award XP to the therapist
      // Map task type to appropriate XP action
      let action: keyof typeof THERAPIST_XP_ACTIONS = 'reviewPatientTask'
      switch (task.type) {
        case 'feedback':
          action = 'sendWeeklyFeedback'
          break
        case 'session':
          action = 'completeSession'
          break
        case 'review_records':
          action = 'viewMoodReport'
          break
        case 'create_plan':
          action = 'createTherapyPlan'
          break
        case 'approve_reward':
          action = 'approveReward'
          break
        default:
          action = 'reviewPatientTask'
      }

      const result = await awardTherapistXP(ctx.db, ctx.user.id, action)

      return {
        xpAwarded: result.xpAwarded,
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        status: 'completed',
      }
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem excluir tarefas',
        })
      }

      // Buscar a tarefa antes de excluir para verificar se é uma sessão
      const [task] = await ctx.db
        .select()
        .from(therapistTasks)
        .where(and(eq(therapistTasks.id, input.id), eq(therapistTasks.therapistId, ctx.user.id)))
        .limit(1)

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarefa não encontrada',
        })
      }

      // Se for tarefa de sessão com paciente, excluir também da rotina do paciente
      if (task.type === 'session' && task.patientId && task.dueDate) {
        await ctx.db
          .delete(patientTasksFromTherapist)
          .where(
            and(
              eq(patientTasksFromTherapist.therapistId, ctx.user.id),
              eq(patientTasksFromTherapist.patientId, task.patientId),
              eq(patientTasksFromTherapist.title, task.title),
              eq(patientTasksFromTherapist.dueDate, task.dueDate),
              eq(patientTasksFromTherapist.category, 'sessao')
            )
          )
      }

      // Excluir a tarefa do terapeuta
      await ctx.db
        .delete(therapistTasks)
        .where(and(eq(therapistTasks.id, input.id), eq(therapistTasks.therapistId, ctx.user.id)))

      return { success: true }
    }),

  // Update task status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem atualizar tarefas',
        })
      }

      const now = new Date()
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: now,
      }

      if (input.status === 'completed') {
        updateData.completedAt = now
      }

      await ctx.db
        .update(therapistTasks)
        .set(updateData)
        .where(and(eq(therapistTasks.id, input.id), eq(therapistTasks.therapistId, ctx.user.id)))

      return { success: true }
    }),

  // Get stats for the therapist's personal tasks
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar esta funcionalidade',
      })
    }

    const allTasks = await ctx.db
      .select()
      .from(therapistTasks)
      .where(eq(therapistTasks.therapistId, ctx.user.id))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTasks = allTasks.filter((t) => {
      if (!t.dueDate) return false
      const taskDate = new Date(t.dueDate)
      return taskDate >= today && taskDate < tomorrow
    })

    return {
      total: allTasks.length,
      completed: allTasks.filter((t) => t.status === 'completed').length,
      pending: allTasks.filter((t) => t.status === 'pending').length,
      inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
      todayTotal: todayTasks.length,
      todayCompleted: todayTasks.filter((t) => t.status === 'completed').length,
    }
  }),
})
