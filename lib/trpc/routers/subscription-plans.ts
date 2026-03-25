import { z } from "zod";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { router, adminProcedure, publicProcedure } from "../trpc";
import { subscriptionPlans, therapistSubscriptions } from "@/lib/db/schema";
import {
  FEATURE_DEFINITIONS,
  getDefaultFeatures,
} from "@/lib/subscription/features";

export const subscriptionPlansRouter = router({
  /**
   * Get all plans (admin sees inactive too)
   */
  getAll: adminProcedure.query(async ({ ctx }) => {
    const plans = await ctx.db
      .select()
      .from(subscriptionPlans)
      .orderBy(asc(subscriptionPlans.sortOrder));

    // Count subscribers per plan
    const counts = await ctx.db
      .select({
        planId: therapistSubscriptions.planId,
        count: sql<number>`count(*)::int`,
      })
      .from(therapistSubscriptions)
      .where(
        sql`${therapistSubscriptions.status} IN ('active', 'past_due', 'pending')`,
      )
      .groupBy(therapistSubscriptions.planId);

    const countMap = new Map(counts.map((c) => [c.planId, c.count]));

    return plans.map((plan) => ({
      ...plan,
      subscriberCount: countMap.get(plan.id) ?? 0,
    }));
  }),

  /**
   * Get active plans for public display (pricing page / plan selector)
   */
  getActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.sortOrder));
  }),

  /**
   * Get feature definitions for the admin form
   */
  getFeatureDefinitions: adminProcedure.query(() => {
    return FEATURE_DEFINITIONS;
  }),

  /**
   * Create a new plan
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z
          .string()
          .min(1)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug deve conter apenas letras minúsculas, números e hífens",
          ),
        description: z.string().optional(),
        monthlyPrice: z.string(),
        yearlyPrice: z.string(),
        maxPatients: z.number().int().nullable(),
        features: z.record(z.union([z.boolean(), z.number()])),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get next sort order
      const [lastPlan] = await ctx.db
        .select({ sortOrder: subscriptionPlans.sortOrder })
        .from(subscriptionPlans)
        .orderBy(desc(subscriptionPlans.sortOrder))
        .limit(1);

      const sortOrder = (lastPlan?.sortOrder ?? -1) + 1;

      const [plan] = await ctx.db
        .insert(subscriptionPlans)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          monthlyPrice: input.monthlyPrice,
          yearlyPrice: input.yearlyPrice,
          maxPatients: input.maxPatients,
          features: input.features as Record<string, boolean | number>,
          isActive: input.isActive,
          sortOrder,
        })
        .returning();

      return plan;
    }),

  /**
   * Update an existing plan
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        slug: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        description: z.string().nullable().optional(),
        monthlyPrice: z.string().optional(),
        yearlyPrice: z.string().optional(),
        maxPatients: z.number().int().nullable().optional(),
        features: z.record(z.union([z.boolean(), z.number()])).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.monthlyPrice !== undefined)
        updateData.monthlyPrice = data.monthlyPrice;
      if (data.yearlyPrice !== undefined)
        updateData.yearlyPrice = data.yearlyPrice;
      if (data.maxPatients !== undefined)
        updateData.maxPatients = data.maxPatients;
      if (data.features !== undefined) updateData.features = data.features;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [plan] = await ctx.db
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, id))
        .returning();

      return plan;
    }),

  /**
   * Soft-delete (deactivate) a plan
   */
  deactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [plan] = await ctx.db
        .update(subscriptionPlans)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, input.id))
        .returning();

      return plan;
    }),

  /**
   * Reactivate a plan
   */
  activate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [plan] = await ctx.db
        .update(subscriptionPlans)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, input.id))
        .returning();

      return plan;
    }),

  /**
   * Reorder plans (batch update sortOrder)
   */
  reorder: adminProcedure
    .input(
      z.array(
        z.object({
          id: z.string().uuid(),
          sortOrder: z.number().int(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input) {
        await ctx.db
          .update(subscriptionPlans)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(subscriptionPlans.id, item.id));
      }
      return { success: true };
    }),
});
