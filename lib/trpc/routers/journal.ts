import { and, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { journalEntries, userStats } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const journalRouter = router({
  getAll: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id))
        .orderBy(desc(journalEntries.createdAt))
  ),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [entry] = await ctx.db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)))
      .limit(1)

    return entry
  }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid()
      await ctx.db.insert(journalEntries).values({
        id,
        userId: ctx.user.id,
        ...input,
      })

      // Update stats
      const totalEntries = await ctx.db
        .select({ count: journalEntries.id })
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id))

      await ctx.db
        .update(userStats)
        .set({
          totalJournalEntries: totalEntries.length,
        })
        .where(eq(userStats.userId, ctx.user.id))

      return { id }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
        aiAnalysis: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      await ctx.db
        .update(journalEntries)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, ctx.user.id)))

      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(journalEntries)
        .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)))

      return { success: true }
    }),
})
