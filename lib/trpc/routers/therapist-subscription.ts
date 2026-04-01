import { TRPCError } from '@trpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  cancelSubscription as asaasCancelSubscription,
  createSubscription as asaasCreateSubscription,
  getSubscriptionPayments as asaasGetSubscriptionPayments,
  createCustomer,
  findCustomerByExternalRef,
} from '@/lib/asaas/client'
import {
  subscriptionPayments,
  subscriptionPlans,
  therapistProfiles,
  therapistSubscriptions,
  users,
} from '@/lib/db/schema'
import { getActiveSubscription, getSubscriptionStatus } from '@/lib/subscription/guard'
import { adminProcedure, psychologistProcedure, router } from '../trpc'

export const therapistSubscriptionRouter = router({
  // ============================================
  // Therapist-facing procedures
  // ============================================

  /**
   * Get current subscription with plan details
   */
  getMySubscription: psychologistProcedure.query(async ({ ctx }) => {
    const result = await getSubscriptionStatus(ctx.user.id)
    return result
  }),

  /**
   * Subscribe to a plan — creates Asaas customer + subscription, returns payment link
   */
  subscribe: psychologistProcedure
    .input(
      z.object({
        planId: z.string().uuid(),
        cycle: z.enum(['MONTHLY', 'YEARLY']),
        billingType: z.enum(['CREDIT_CARD', 'PIX']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const therapistId = ctx.user.id

      // Check if therapist already has an active subscription
      const existing = await getActiveSubscription(therapistId)
      if (existing && (existing.status === 'active' || existing.status === 'pending')) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'Você já possui uma assinatura ativa. Cancele a atual antes de assinar um novo plano.',
        })
      }

      // Get the plan
      const [plan] = await ctx.db
        .select()
        .from(subscriptionPlans)
        .where(and(eq(subscriptionPlans.id, input.planId), eq(subscriptionPlans.isActive, true)))
        .limit(1)

      if (!plan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Plano não encontrado ou inativo.',
        })
      }

      // Get therapist profile for CPF
      const [profile] = await ctx.db
        .select()
        .from(therapistProfiles)
        .where(eq(therapistProfiles.therapistId, therapistId))
        .limit(1)

      if (!profile) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Complete seu perfil antes de assinar um plano.',
        })
      }

      // Find or create Asaas customer
      let asaasCustomerId: string
      const existingCustomer = await findCustomerByExternalRef(therapistId)

      if (existingCustomer) {
        asaasCustomerId = existingCustomer.id
      } else {
        const customer = await createCustomer({
          name: profile.fullName,
          cpfCnpj: profile.cpf.replace(/\D/g, ''),
          email: ctx.user.email,
          mobilePhone: profile.phone?.replace(/\D/g, ''),
          externalReference: therapistId,
        })
        asaasCustomerId = customer.id
      }

      // Calculate value based on cycle
      const value = input.cycle === 'MONTHLY' ? Number(plan.monthlyPrice) : Number(plan.yearlyPrice)

      // Calculate next due date (today or tomorrow if after 18h)
      const now = new Date()
      const nextDueDate = new Date(now)
      if (now.getHours() >= 18) {
        nextDueDate.setDate(nextDueDate.getDate() + 1)
      }
      const dueDateStr = nextDueDate.toISOString().split('T')[0]

      // Create subscription on Asaas
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const asaasSub = await asaasCreateSubscription({
        customer: asaasCustomerId,
        billingType: input.billingType,
        value,
        nextDueDate: dueDateStr,
        cycle: input.cycle,
        description: `Nepsis - ${plan.name} (${input.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`,
        externalReference: therapistId,
        callback: {
          successUrl: `${appUrl}/dashboard?subscription=success`,
          autoRedirect: true,
        },
      })

      // Save subscription in our DB
      const [subscription] = await ctx.db
        .insert(therapistSubscriptions)
        .values({
          therapistId,
          planId: plan.id,
          asaasCustomerId,
          asaasSubscriptionId: asaasSub.id,
          billingType: input.billingType,
          cycle: input.cycle,
          status: 'pending',
          amount: String(value),
          currentPeriodStart: new Date(dueDateStr),
        })
        .returning()

      // Get the first payment to return the invoice URL
      const payments = await asaasGetSubscriptionPayments(asaasSub.id)
      const firstPayment = payments.data[0]

      let invoiceUrl = ''
      if (firstPayment) {
        invoiceUrl = firstPayment.invoiceUrl

        // Save payment record
        await ctx.db.insert(subscriptionPayments).values({
          subscriptionId: subscription.id,
          asaasPaymentId: firstPayment.id,
          amount: String(firstPayment.value),
          status: 'pending',
          billingType: input.billingType,
          dueDate: new Date(firstPayment.dueDate),
          invoiceUrl: firstPayment.invoiceUrl,
        })
      }

      return {
        subscriptionId: subscription.id,
        asaasSubscriptionId: asaasSub.id,
        invoiceUrl,
        status: 'pending' as const,
      }
    }),

  /**
   * Cancel current subscription
   */
  cancel: psychologistProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const therapistId = ctx.user.id

      const [sub] = await ctx.db
        .select()
        .from(therapistSubscriptions)
        .where(
          and(
            eq(therapistSubscriptions.therapistId, therapistId),
            sql`${therapistSubscriptions.status} IN ('active', 'past_due', 'pending')`
          )
        )
        .orderBy(desc(therapistSubscriptions.createdAt))
        .limit(1)

      if (!sub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nenhuma assinatura ativa encontrada.',
        })
      }

      // Cancel on Asaas
      if (sub.asaasSubscriptionId) {
        try {
          await asaasCancelSubscription(sub.asaasSubscriptionId)
        } catch (error) {
          console.error('[Cancel Subscription] Asaas error:', error)
          // Continue cancelling locally even if Asaas fails
        }
      }

      // Update local subscription
      const [updated] = await ctx.db
        .update(therapistSubscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: input.reason ?? 'user_cancelled',
          updatedAt: new Date(),
        })
        .where(eq(therapistSubscriptions.id, sub.id))
        .returning()

      return updated
    }),

  /**
   * Get payment history for current subscription
   */
  getPaymentHistory: psychologistProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const therapistId = ctx.user.id
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0

      // Get all subscriptions for this therapist
      const subs = await ctx.db
        .select({ id: therapistSubscriptions.id })
        .from(therapistSubscriptions)
        .where(eq(therapistSubscriptions.therapistId, therapistId))

      if (subs.length === 0) return { payments: [], total: 0 }

      const subIds = subs.map((s) => s.id)

      const payments = await ctx.db
        .select()
        .from(subscriptionPayments)
        .where(
          sql`${subscriptionPayments.subscriptionId} IN (${sql.join(
            subIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(desc(subscriptionPayments.createdAt))
        .limit(limit)
        .offset(offset)

      const [{ total }] = await ctx.db
        .select({ total: sql<number>`count(*)::int` })
        .from(subscriptionPayments)
        .where(
          sql`${subscriptionPayments.subscriptionId} IN (${sql.join(
            subIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )

      return { payments, total }
    }),

  /**
   * Get the current pending payment link
   */
  getCurrentPaymentLink: psychologistProcedure.query(async ({ ctx }) => {
    const therapistId = ctx.user.id

    const [sub] = await ctx.db
      .select({ id: therapistSubscriptions.id })
      .from(therapistSubscriptions)
      .where(
        and(
          eq(therapistSubscriptions.therapistId, therapistId),
          sql`${therapistSubscriptions.status} IN ('active', 'past_due', 'pending')`
        )
      )
      .orderBy(desc(therapistSubscriptions.createdAt))
      .limit(1)

    if (!sub) return null

    const [payment] = await ctx.db
      .select()
      .from(subscriptionPayments)
      .where(
        and(
          eq(subscriptionPayments.subscriptionId, sub.id),
          sql`${subscriptionPayments.status} IN ('pending', 'overdue')`
        )
      )
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(1)

    return payment ?? null
  }),

  // ============================================
  // Admin-facing procedures
  // ============================================

  /**
   * Admin: Get all subscriptions with therapist and plan info
   */
  getAllSubscriptions: adminProcedure
    .input(
      z
        .object({
          status: z.enum(['active', 'past_due', 'cancelled', 'expired', 'pending']).optional(),
          planId: z.string().uuid().optional(),
          search: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      const conditions: ReturnType<typeof sql>[] = []

      if (input?.status) {
        conditions.push(sql`${therapistSubscriptions.status} = ${input.status}`)
      }
      if (input?.planId) {
        conditions.push(sql`${therapistSubscriptions.planId} = ${input.planId}`)
      }

      const _whereClause =
        conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

      const _searchClause = input?.search
        ? sql`AND (${users.name} ILIKE ${`%${input.search}%`} OR ${users.email} ILIKE ${`%${input.search}%`})`
        : sql``

      const results = await ctx.db
        .select({
          subscription: therapistSubscriptions,
          plan: subscriptionPlans,
          therapistName: users.name,
          therapistEmail: users.email,
        })
        .from(therapistSubscriptions)
        .innerJoin(subscriptionPlans, eq(therapistSubscriptions.planId, subscriptionPlans.id))
        .innerJoin(users, eq(therapistSubscriptions.therapistId, users.id))
        .where(
          and(
            input?.status ? eq(therapistSubscriptions.status, input.status) : undefined,
            input?.planId ? eq(therapistSubscriptions.planId, input.planId) : undefined,
            input?.search
              ? sql`(${users.name} ILIKE ${`%${input.search}%`} OR ${users.email} ILIKE ${`%${input.search}%`})`
              : undefined
          )
        )
        .orderBy(desc(therapistSubscriptions.createdAt))
        .limit(limit)
        .offset(offset)

      const [{ total }] = await ctx.db
        .select({ total: sql<number>`count(*)::int` })
        .from(therapistSubscriptions)
        .innerJoin(users, eq(therapistSubscriptions.therapistId, users.id))
        .where(
          and(
            input?.status ? eq(therapistSubscriptions.status, input.status) : undefined,
            input?.planId ? eq(therapistSubscriptions.planId, input.planId) : undefined,
            input?.search
              ? sql`(${users.name} ILIKE ${`%${input.search}%`} OR ${users.email} ILIKE ${`%${input.search}%`})`
              : undefined
          )
        )

      return { subscriptions: results, total }
    }),

  /**
   * Admin: Override subscription status manually
   */
  overrideStatus: adminProcedure
    .input(
      z.object({
        subscriptionId: z.string().uuid(),
        status: z.enum(['active', 'past_due', 'cancelled', 'expired']),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      }

      if (input.status === 'cancelled') {
        updateData.cancelledAt = new Date()
        updateData.cancelReason = input.reason ?? 'admin_override'
      }

      if (input.status === 'active') {
        // When admin manually activates, set period for 30 days
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setDate(periodEnd.getDate() + 30)
        updateData.currentPeriodStart = now
        updateData.currentPeriodEnd = periodEnd
      }

      const [updated] = await ctx.db
        .update(therapistSubscriptions)
        .set(updateData)
        .where(eq(therapistSubscriptions.id, input.subscriptionId))
        .returning()

      return updated
    }),

  /**
   * Admin: Get subscription detail with payment history
   */
  getSubscriptionDetail: adminProcedure
    .input(z.object({ subscriptionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          subscription: therapistSubscriptions,
          plan: subscriptionPlans,
          therapistName: users.name,
          therapistEmail: users.email,
        })
        .from(therapistSubscriptions)
        .innerJoin(subscriptionPlans, eq(therapistSubscriptions.planId, subscriptionPlans.id))
        .innerJoin(users, eq(therapistSubscriptions.therapistId, users.id))
        .where(eq(therapistSubscriptions.id, input.subscriptionId))
        .limit(1)

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assinatura não encontrada.',
        })
      }

      const payments = await ctx.db
        .select()
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.subscriptionId, input.subscriptionId))
        .orderBy(desc(subscriptionPayments.createdAt))

      return { ...result, payments }
    }),

  /**
   * Admin: Revenue statistics
   */
  getRevenueStats: adminProcedure.query(async ({ ctx }) => {
    // Total active subscriptions
    const [activeCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(therapistSubscriptions)
      .where(eq(therapistSubscriptions.status, 'active'))

    // Total past_due
    const [pastDueCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(therapistSubscriptions)
      .where(eq(therapistSubscriptions.status, 'past_due'))

    // MRR calculation (sum of monthly amounts for active subscribers)
    const [mrr] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${therapistSubscriptions.cycle} = 'YEARLY'
            THEN ${therapistSubscriptions.amount}::numeric / 12
            ELSE ${therapistSubscriptions.amount}::numeric
          END
        ), 0)`,
      })
      .from(therapistSubscriptions)
      .where(eq(therapistSubscriptions.status, 'active'))

    // Count by plan
    const byPlan = await ctx.db
      .select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${therapistSubscriptions.amount}::numeric), 0)`,
      })
      .from(therapistSubscriptions)
      .innerJoin(subscriptionPlans, eq(therapistSubscriptions.planId, subscriptionPlans.id))
      .where(sql`${therapistSubscriptions.status} IN ('active', 'past_due')`)
      .groupBy(subscriptionPlans.id, subscriptionPlans.name)

    // Count by billing type
    const byBillingType = await ctx.db
      .select({
        billingType: therapistSubscriptions.billingType,
        count: sql<number>`count(*)::int`,
      })
      .from(therapistSubscriptions)
      .where(sql`${therapistSubscriptions.status} IN ('active', 'past_due')`)
      .groupBy(therapistSubscriptions.billingType)

    return {
      activeSubscriptions: activeCount.count,
      pastDueSubscriptions: pastDueCount.count,
      mrr: mrr.total,
      byPlan,
      byBillingType,
    }
  }),
})
