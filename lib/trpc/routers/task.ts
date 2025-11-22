import { and, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { tasks, userStats } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const taskRouter = router({
  getAll: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, ctx.user.id))
        .orderBy(desc(tasks.createdAt))
  ),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [task] = await ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))
      .limit(1)

    return task
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        dueDate: z.date().optional(),
        experience: z.number().default(10),
        coins: z.number().default(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid()
      await ctx.db.insert(tasks).values({
        id,
        userId: ctx.user.id,
        ...input,
      })

      // Update stats
      const totalTasks = await ctx.db
        .select({ count: tasks.id })
        .from(tasks)
        .where(eq(tasks.userId, ctx.user.id))

      await ctx.db
        .update(userStats)
        .set({
          totalTasks: totalTasks.length,
        })
        .where(eq(userStats.userId, ctx.user.id))

      return { id }
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))
        .limit(1)

      if (!task) {
        throw new Error('Task not found')
      }

      await ctx.db
        .update(tasks)
        .set({
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))

      // Update stats
      const completedTasks = await ctx.db
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.userId, ctx.user.id), eq(tasks.completed, true)))

      await ctx.db
        .update(userStats)
        .set({
          completedTasks: completedTasks.length,
        })
        .where(eq(userStats.userId, ctx.user.id))

      return { experience: task.experience, coins: task.coins }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(tasks).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)))

      return { success: true }
    }),
})
