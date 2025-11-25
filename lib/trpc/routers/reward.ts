import { and, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { psychologistPatients, rewards, users } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const rewardRouter = router({
  getAll: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.user.id

      // If querying another user, verify permission (for therapists)
      if (targetUserId !== ctx.user.id) {
        if (ctx.user.role !== 'psychologist') {
          throw new Error('Unauthorized')
        }
        // Verify the psychologist has a relationship with this patient
        const relationship = await ctx.db.query.psychologistPatients.findFirst({
          where: and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, targetUserId)
          ),
        })
        if (!relationship) {
          throw new Error('Unauthorized: No relationship with this patient')
        }
      }

      return ctx.db
        .select()
        .from(rewards)
        .where(and(eq(rewards.userId, targetUserId), isNull(rewards.deletedAt)))
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string().default('lazer'),
        cost: z.number().default(0),
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

  updateCost: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        cost: z.number(),
        patientId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only psychologists can update costs
      if (ctx.user.role !== 'psychologist') {
        throw new Error('Only psychologists can update reward costs')
      }

      const targetUserId = input.patientId || ctx.user.id

      // Verify the psychologist has a relationship with this patient
      if (input.patientId) {
        const relationship = await ctx.db.query.psychologistPatients.findFirst({
          where: and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          ),
        })
        if (!relationship) {
          throw new Error('Unauthorized: No relationship with this patient')
        }
      }

      await ctx.db
        .update(rewards)
        .set({
          cost: input.cost,
        })
        .where(and(eq(rewards.id, input.rewardId), eq(rewards.userId, targetUserId)))

      return { success: true }
    }),

  claim: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const [reward] = await ctx.db
      .select()
      .from(rewards)
      .where(
        and(eq(rewards.id, input.id), eq(rewards.userId, ctx.user.id), isNull(rewards.deletedAt))
      )
      .limit(1)

    if (!reward) {
      throw new Error('Reward not found')
    }

    if (reward.claimed) {
      throw new Error('Reward already claimed')
    }

    // Get user
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user has enough coins
    if (user.coins < reward.cost) {
      throw new Error('Saldo insuficiente')
    }

    // Deduct coins and mark as claimed
    const newBalance = user.coins - reward.cost

    await ctx.db
      .update(users)
      .set({
        coins: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id))

    await ctx.db
      .update(rewards)
      .set({
        claimed: true,
        claimedAt: new Date(),
      })
      .where(eq(rewards.id, input.id))

    return { success: true, cost: reward.cost, newBalance }
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(rewards)
        .set({
          deletedAt: new Date(),
        })
        .where(and(eq(rewards.id, input.id), eq(rewards.userId, ctx.user.id)))

      return { success: true }
    }),
})
