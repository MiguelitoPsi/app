import { and, desc, eq } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import type * as schema from '@/lib/db/schema'
import { notifications } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

// Helper function to create notification
export async function createNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  db: DrizzleD1Database<typeof schema>
}) {
  const { userId, type, title, message, metadata, db } = params
  const id = nanoid()
  await db.insert(notifications).values({
    id,
    userId,
    type,
    title,
    message,
    metadata,
  })
  return id
}

export const notificationRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) =>
    ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
  ),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)))

    return result.length
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)))

      return { success: true }
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id))

    return { success: true }
  }),
})
