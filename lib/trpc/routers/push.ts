import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { pushSubscriptions, users } from "@/lib/db/schema";
import { getVapidPublicKey } from "@/lib/push";
import { protectedProcedure, publicProcedure, router } from "../trpc";

// Schema for push subscription from browser
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceType: z.enum(["mobile", "desktop", "unknown"]).optional(),
  userAgent: z.string().optional(),
});

export const pushRouter = router({
  // Get VAPID public key for client-side subscription
  getVapidPublicKey: publicProcedure.query(() => {
    const key = getVapidPublicKey();
    if (!key) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "VAPID key not configured",
      });
    }
    return { vapidPublicKey: key };
  }),

  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(pushSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if subscription already exists (same endpoint)
      const existing = await ctx.db.query.pushSubscriptions.findFirst({
        where: and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, input.endpoint)
        ),
      });

      if (existing) {
        // Update existing subscription
        await ctx.db
          .update(pushSubscriptions)
          .set({
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            deviceType: input.deviceType || "unknown",
            userAgent: input.userAgent,
            lastUsedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing.id));

        return { success: true, subscriptionId: existing.id, isNew: false };
      }

      // Create new subscription
      const id = nanoid();
      await ctx.db.insert(pushSubscriptions).values({
        id,
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        deviceType: input.deviceType || "unknown",
        userAgent: input.userAgent,
      });

      // Update user preferences to enable push notifications
      await ctx.db
        .update(users)
        .set({
          preferences: sql`json_set(coalesce(${users.preferences}, '{}'), '$.pushNotifications', true)`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true, subscriptionId: id, isNew: true };
    }),

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (input.endpoint) {
        // Remove specific subscription
        await ctx.db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.userId, userId),
              eq(pushSubscriptions.endpoint, input.endpoint)
            )
          );
      } else {
        // Remove all subscriptions for user
        await ctx.db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, userId));
      }

      // Update user preferences to disable push notifications
      await ctx.db
        .update(users)
        .set({
          preferences: sql`json_set(coalesce(${users.preferences}, '{}'), '$.pushNotifications', false)`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  // Check if user has push notifications enabled
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const subscriptions = await ctx.db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
      columns: {
        id: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        preferences: true,
      },
    });

    return {
      enabled: user?.preferences?.pushNotifications ?? false,
      subscriptionCount: subscriptions.length,
      subscriptions,
    };
  }),

  // Update last active timestamp (called on app access)
  updateLastActive: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    await ctx.db
      .update(users)
      .set({
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  }),

  // Toggle push notifications preference
  togglePushNotifications: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      await ctx.db
        .update(users)
        .set({
          preferences: sql`json_set(coalesce(${users.preferences}, '{}'), '$.pushNotifications', ${input.enabled})`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // If disabling, remove all subscriptions
      if (!input.enabled) {
        await ctx.db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, userId));
      }

      return { success: true, enabled: input.enabled };
    }),
});
