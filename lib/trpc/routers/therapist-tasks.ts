/**
 * Router tRPC para tarefas da rotina pessoal do terapeuta
 * Separado das tarefas que o terapeuta cria para pacientes
 */

import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, isNull, lt, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { therapistTasks } from '@/lib/db/schema'
import { awardTherapistXP, type THERAPIST_XP_ACTIONS } from '@/lib/xp/therapist'
import { protectedProcedure, router } from '../trpc'

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
      .orderBy(desc(therapistTasks.createdAt))
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
        .orderBy(desc(therapistTasks.createdAt))
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
        frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
        patientId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas terapeutas podem criar tarefas',
        })
      }

      // Validate that the date is not in the past
      if (input.dueDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // Parse date as local time (YYYY-MM-DD) to avoid timezone issues
        const [year, month, day] = input.dueDate.split('-').map(Number)
        const taskDate = new Date(year, month - 1, day)
        taskDate.setHours(0, 0, 0, 0)

        if (taskDate < today) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível criar tarefas para datas que já passaram',
          })
        }
      }

      const id = nanoid()
      const xpReward = THERAPIST_TASK_XP[input.priority] || 20

      // Parse date as local time to avoid timezone issues
      let parsedDueDate: Date | null = null
      if (input.dueDate) {
        const [year, month, day] = input.dueDate.split('-').map(Number)
        parsedDueDate = new Date(year, month - 1, day)
        parsedDueDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone edge cases
      }

      await ctx.db.insert(therapistTasks).values({
        id,
        therapistId: ctx.user.id,
        patientId: input.patientId || null,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        status: 'pending',
        dueDate: parsedDueDate,
        xpReward,
        isRecurring: input.isRecurring,
        frequency: input.frequency,
        isAiGenerated: false,
      })

      return { id, xpReward }
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
