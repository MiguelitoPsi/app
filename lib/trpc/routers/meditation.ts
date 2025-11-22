import { desc, eq, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { meditationSessions, userStats } from "@/lib/db/schema";
import { awardXPAndCoins } from "@/lib/xp";
import { protectedProcedure, router } from "../trpc";

export const meditationRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        duration: z.number().positive(),
        type: z.string(),
        completed: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, "meditation");
      const { xpAwarded, coinsAwarded, levelUp } = result;
      const now = new Date();

      // Create meditation session
      await ctx.db.insert(meditationSessions).values({
        id,
        userId: ctx.user.id,
        duration: input.duration,
        type: input.type,
        completed: input.completed,
      });

      // Update stats
      const [stats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1);

      if (stats) {
        await ctx.db
          .update(userStats)
          .set({
            totalMeditations: stats.totalMeditations + 1,
            updatedAt: now,
          })
          .where(eq(userStats.userId, ctx.user.id));
      }

      return {
        id,
        xp: xpAwarded,
        coins: coinsAwarded,
        levelUp,
      };
    }),

  getHistory: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(meditationSessions)
        .where(eq(meditationSessions.userId, ctx.user.id))
        .orderBy(desc(meditationSessions.createdAt))
  ),

  getTotalMinutes: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ total: sum(meditationSessions.duration) })
      .from(meditationSessions)
      .where(eq(meditationSessions.userId, ctx.user.id));

    return result[0]?.total || 0;
  }),
});
