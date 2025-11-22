import { eq, sum } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import { badges, meditationSessions, userStats, users } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Helper function to check and unlock badges
export async function autoCheckBadges(
  userId: string,
  db: DrizzleD1Database<any>
) {
  // Get user stats
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!(stats && user)) {
    return [];
  }

  // Get total meditation minutes
  const meditationMinutesResult = await db
    .select({ total: sum(meditationSessions.duration) })
    .from(meditationSessions)
    .where(eq(meditationSessions.userId, userId));

  const totalMeditationMinutes = Number(meditationMinutesResult[0]?.total || 0);

  // Get existing badges
  const existingBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.userId, userId));

  const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId));

  const newBadges: Array<typeof badges.$inferInsert> = [];

  // Check each badge definition
  for (const badge of BADGE_DEFINITIONS) {
    if (existingBadgeIds.has(badge.id)) {
      continue;
    }

    let shouldUnlock = false;

    if (badge.metric === "auto") {
      shouldUnlock = true;
    } else if (badge.metric === "totalMeditationMinutes") {
      shouldUnlock = totalMeditationMinutes >= badge.requirement;
    } else if (badge.metric === "completedTasks") {
      shouldUnlock = stats.completedTasks >= badge.requirement;
    } else if (badge.metric === "totalJournalEntries") {
      shouldUnlock = stats.totalJournalEntries >= badge.requirement;
    } else if (badge.metric === "longestStreak") {
      shouldUnlock = stats.longestStreak >= badge.requirement;
    } else if (badge.metric === "totalMeditations") {
      shouldUnlock = stats.totalMeditations >= badge.requirement;
    }

    if (shouldUnlock) {
      newBadges.push({
        id: nanoid(),
        userId,
        badgeId: badge.id,
        title: badge.name,
        description: badge.description,
        icon: badge.icon,
      });
    }
  }

  // Insert new badges
  if (newBadges.length > 0) {
    await db.insert(badges).values(newBadges);
  }

  return newBadges.map((b) => b.badgeId);
}

export const badgeRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userBadges = await ctx.db
      .select()
      .from(badges)
      .where(eq(badges.userId, ctx.user.id));

    // Merge with definitions
    return userBadges.map((badge) => {
      const definition = BADGE_DEFINITIONS.find(
        (def) => def.id === badge.badgeId
      );
      return {
        ...badge,
        definition,
      };
    });
  }),

  checkAndUnlock: protectedProcedure.mutation(async ({ ctx }) => {
    const newBadgeIds = await autoCheckBadges(ctx.user.id, ctx.db);
    return { newBadges: newBadgeIds };
  }),
});
