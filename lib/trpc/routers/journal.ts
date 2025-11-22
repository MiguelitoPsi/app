import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { journalEntries, userStats } from "@/lib/db/schema";
import { awardXPAndCoins } from "@/lib/xp";
import { protectedProcedure, router } from "../trpc";
import { autoCheckBadges } from "./badge";

export const journalRouter = router({
  getAll: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.user.id;

      // If querying another user, verify permission (for therapists)
      if (targetUserId !== ctx.user.id && ctx.user.role !== "psychologist") {
        throw new Error("Unauthorized");
      }

      return ctx.db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, targetUserId),
            isNull(journalEntries.deletedAt)
          )
        )
        .orderBy(desc(journalEntries.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.id, input.id),
            eq(journalEntries.userId, ctx.user.id),
            isNull(journalEntries.deletedAt)
          )
        )
        .limit(1);

      return entry;
    }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
        aiAnalysis: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, "journal");
      const { xpAwarded, coinsAwarded, levelUp } = result;
      const now = new Date();

      // Create journal entry
      await ctx.db.insert(journalEntries).values({
        id,
        userId: ctx.user.id,
        ...input,
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
            totalJournalEntries: stats.totalJournalEntries + 1,
            updatedAt: now,
          })
          .where(eq(userStats.userId, ctx.user.id));
      }

      // Check for new badges
      const newBadges = await autoCheckBadges(ctx.user.id, ctx.db);

      return {
        id,
        xp: xpAwarded,
        coins: coinsAwarded,
        levelUp,
        newBadges,
      };
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
      const { id, ...data } = input;
      await ctx.db
        .update(journalEntries)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(journalEntries.id, id),
            eq(journalEntries.userId, ctx.user.id),
            isNull(journalEntries.deletedAt)
          )
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(journalEntries)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(journalEntries.id, input.id),
            eq(journalEntries.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
