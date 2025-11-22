import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { rewards } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const rewardRouter = router({
  getAll: protectedProcedure.query(
    async ({ ctx }) => await ctx.db.select().from(rewards).where(eq(rewards.userId, ctx.user.id))
  ),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        cost: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid()
      await ctx.db.insert(rewards).values({
        id,
        userId: ctx.user.id,
        ...input,
      })

      return { id }
    }),

  claim: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const [reward] = await ctx.db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, input.id), eq(rewards.userId, ctx.user.id)))
      .limit(1)

    if (!reward) {
      throw new Error('Reward not found')
    }
    if (reward.claimed) {
      throw new Error('Reward already claimed')
    }

    await ctx.db
      .update(rewards)
      .set({
        claimed: true,
        claimedAt: new Date(),
      })
      .where(eq(rewards.id, input.id))

    return { success: true, cost: reward.cost }
  }),
})
