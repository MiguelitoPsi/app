import { and, eq, gte, lte, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { psychologistSubscriptions, users } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

export const adminRouter = router({
  // Verificar se o usuário é admin
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)

    return user?.role === 'admin'
  }),

  // Obter estatísticas gerais
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    const [totalResult] = await ctx.db.select({ count: sql<number>`count(*)` }).from(users)

    const [adminResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'admin'))

    const [psychologistResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'psychologist'))

    const [patientResult] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'patient'))

    return {
      totalUsers: Number(totalResult?.count ?? 0),
      adminCount: Number(adminResult?.count ?? 0),
      psychologistCount: Number(psychologistResult?.count ?? 0),
      patientCount: Number(patientResult?.count ?? 0),
    }
  }),

  // Listar todos os usuários
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    const allUsers = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        level: users.level,
        experience: users.experience,
        coins: users.coins,
        streak: users.streak,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .orderBy(users.createdAt)

    return allUsers
  }),

  // Criar novo usuário
  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email('Email inválido'),
        password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
        role: z.enum(['admin', 'psychologist', 'patient']).default('patient'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      // Verificar se email já existe
      const [existingUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existingUser) {
        throw new Error('Este email já está cadastrado')
      }

      // Criar usuário via Better Auth API (garante hash correto da senha)
      const result = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      })

      if (!result.user) {
        throw new Error('Erro ao criar usuário')
      }

      // Atualizar role do usuário (Better Auth cria com role padrão "patient")
      if (input.role !== 'patient') {
        await ctx.db.update(users).set({ role: input.role }).where(eq(users.id, result.user.id))
      }

      return { success: true, userId: result.user.id }
    }),

  // Atualizar role do usuário
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['admin', 'psychologist', 'patient']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      await ctx.db.update(users).set({ role: input.role }).where(eq(users.id, input.userId))

      return { success: true }
    }),

  // Deletar usuário
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      // Não permitir deletar a si mesmo
      if (input.userId === ctx.user.id) {
        throw new Error('Você não pode deletar sua própria conta')
      }

      await ctx.db.delete(users).where(eq(users.id, input.userId))

      return { success: true }
    }),

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  // Get all psychologists with their subscription status
  getPsychologistsWithSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    // Get all psychologists
    const psychologists = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'psychologist'))
      .orderBy(users.name)

    // Get subscriptions for each psychologist
    const subscriptions = await ctx.db
      .select()
      .from(psychologistSubscriptions)
      .orderBy(psychologistSubscriptions.endDate)

    const now = new Date()

    // Map subscriptions to psychologists
    const result = psychologists.map((psychologist) => {
      const sub = subscriptions.find((s) => s.psychologistId === psychologist.id)

      let subscriptionStatus:
        | 'no_subscription'
        | 'active'
        | 'expired'
        | 'expiring_soon'
        | 'cancelled'
        | 'pending' = 'no_subscription'

      if (sub) {
        if (sub.status === 'cancelled') {
          subscriptionStatus = 'cancelled'
        } else if (sub.status === 'pending') {
          subscriptionStatus = 'pending'
        } else if (sub.endDate < now) {
          subscriptionStatus = 'expired'
        } else {
          // Check if expiring in the next 7 days
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (sub.endDate <= sevenDaysFromNow) {
            subscriptionStatus = 'expiring_soon'
          } else {
            subscriptionStatus = 'active'
          }
        }
      }

      return {
        ...psychologist,
        subscription: sub ?? null,
        subscriptionStatus,
      }
    })

    return result
  }),

  // Get subscription stats
  getSubscriptionStats: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [totalPsychologists] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'psychologist'))

    const [activeSubscriptions] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(psychologistSubscriptions)
      .where(
        and(
          eq(psychologistSubscriptions.status, 'active'),
          gte(psychologistSubscriptions.endDate, now)
        )
      )

    const [expiredSubscriptions] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(psychologistSubscriptions)
      .where(
        or(
          eq(psychologistSubscriptions.status, 'expired'),
          and(
            eq(psychologistSubscriptions.status, 'active'),
            lte(psychologistSubscriptions.endDate, now)
          )
        )
      )

    const [expiringSoon] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(psychologistSubscriptions)
      .where(
        and(
          eq(psychologistSubscriptions.status, 'active'),
          gte(psychologistSubscriptions.endDate, now),
          lte(psychologistSubscriptions.endDate, sevenDaysFromNow)
        )
      )

    // Calculate monthly revenue (sum of active subscriptions divided by their billing period)
    const activeWithAmount = await ctx.db
      .select({
        plan: psychologistSubscriptions.plan,
        amount: psychologistSubscriptions.amount,
      })
      .from(psychologistSubscriptions)
      .where(
        and(
          eq(psychologistSubscriptions.status, 'active'),
          gte(psychologistSubscriptions.endDate, now)
        )
      )

    let monthlyRevenue = 0
    for (const sub of activeWithAmount) {
      switch (sub.plan) {
        case 'monthly':
          monthlyRevenue += sub.amount
          break
        case 'quarterly':
          monthlyRevenue += sub.amount / 3
          break
        case 'yearly':
          monthlyRevenue += sub.amount / 12
          break
      }
    }

    return {
      totalPsychologists: Number(totalPsychologists?.count ?? 0),
      activeSubscriptions: Number(activeSubscriptions?.count ?? 0),
      expiredSubscriptions: Number(expiredSubscriptions?.count ?? 0),
      expiringSoon: Number(expiringSoon?.count ?? 0),
      monthlyRevenue: Math.round(monthlyRevenue),
    }
  }),

  // Create or update subscription
  upsertSubscription: protectedProcedure
    .input(
      z.object({
        psychologistId: z.string(),
        plan: z.enum(['trial', 'monthly', 'quarterly', 'yearly']),
        status: z.enum(['active', 'expired', 'cancelled', 'pending']),
        amount: z.number().min(0),
        startDate: z.date(),
        endDate: z.date(),
        lastPaymentDate: z.date().optional(),
        nextPaymentDate: z.date().optional(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      // Check if subscription exists
      const [existingSub] = await ctx.db
        .select()
        .from(psychologistSubscriptions)
        .where(eq(psychologistSubscriptions.psychologistId, input.psychologistId))
        .limit(1)

      const now = new Date()

      if (existingSub) {
        // Update existing subscription
        await ctx.db
          .update(psychologistSubscriptions)
          .set({
            plan: input.plan,
            status: input.status,
            amount: input.amount,
            startDate: input.startDate,
            endDate: input.endDate,
            lastPaymentDate: input.lastPaymentDate,
            nextPaymentDate: input.nextPaymentDate,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            updatedAt: now,
          })
          .where(eq(psychologistSubscriptions.id, existingSub.id))

        return { success: true, subscriptionId: existingSub.id }
      }

      // Create new subscription
      const subscriptionId = nanoid()
      await ctx.db.insert(psychologistSubscriptions).values({
        id: subscriptionId,
        psychologistId: input.psychologistId,
        plan: input.plan,
        status: input.status,
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
        lastPaymentDate: input.lastPaymentDate,
        nextPaymentDate: input.nextPaymentDate,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      })

      return { success: true, subscriptionId }
    }),

  // Delete subscription
  deleteSubscription: protectedProcedure
    .input(z.object({ psychologistId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      await ctx.db
        .delete(psychologistSubscriptions)
        .where(eq(psychologistSubscriptions.psychologistId, input.psychologistId))

      return { success: true }
    }),
})
