import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { userStats, users } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

    return user
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1)

    if (!stats) {
      // Create stats if they don't exist
      const newStats = {
        userId: ctx.user.id,
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: 0,
      }
      await ctx.db.insert(userStats).values(newStats)
      return newStats
    }

    return stats
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        preferences: z
          .object({
            notifications: z.boolean().optional(),
            theme: z.enum(['light', 'dark']).optional(),
            language: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { success: true }
    }),

  addExperience: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

      if (!user) {
        throw new Error('User not found')
      }

      const newExperience = user.experience + input.amount
      const newLevel = Math.floor(newExperience / 100) + 1

      await ctx.db
        .update(users)
        .set({
          experience: newExperience,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { level: newLevel, experience: newExperience }
    }),

  addCoins: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

      if (!user) {
        throw new Error('User not found')
      }

      const newCoins = user.coins + input.amount

      await ctx.db
        .update(users)
        .set({
          coins: newCoins,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { coins: newCoins }
    }),
})
