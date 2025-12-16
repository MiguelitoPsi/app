import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  adminInvites,
  type PsychologistSubscription,
  psychologistPatients,
  psychologistSubscriptions,
  users,
} from '@/lib/db/schema'
import { protectedProcedure, publicProcedure, router } from '../trpc'

type LinkedPsychologist = {
  id: string
  name: string
  email: string
} | null

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
        bannedAt: users.bannedAt,
      })
      .from(users)
      .orderBy(users.createdAt)

    return allUsers
  }),

  // Listar psicólogos com seus pacientes
  getTherapistsWithPatients: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    // Buscar todos os psicólogos
    const psychologists = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        level: users.level,
        createdAt: users.createdAt,
        bannedAt: users.bannedAt,
      })
      .from(users)
      .where(and(eq(users.role, 'psychologist'), isNull(users.deletedAt)))
      .orderBy(users.name)

    // Para cada psicólogo, buscar seus pacientes
    const result = await Promise.all(
      psychologists.map(async (psychologist) => {
        const linkedPatients = await ctx.db
          .select({
            patientId: psychologistPatients.patientId,
          })
          .from(psychologistPatients)
          .where(eq(psychologistPatients.psychologistId, psychologist.id))

        const patientIds = linkedPatients.map((p) => p.patientId)

        let patients: {
          id: string
          name: string
          email: string
          role: string | null
          level: number
          createdAt: Date
          bannedAt: Date | null
        }[] = []

        if (patientIds.length > 0) {
          patients = await ctx.db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
              level: users.level,
              createdAt: users.createdAt,
              bannedAt: users.bannedAt,
            })
            .from(users)
            .where(and(sql`${users.id} IN ${patientIds}`, isNull(users.deletedAt)))
            .orderBy(users.name)
        }

        return {
          ...psychologist,
          patients,
        }
      })
    )

    return result
  }),

  // Criar novo usuário
  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
        role: z.enum(['admin', 'psychologist', 'patient']).default('patient'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Gerar nome a partir do email
      const name = input.email.split('@')[0]
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
          name,
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

  // Deletar usuário (soft delete para permitir que o usuário veja o modal antes de ser deslogado)
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string(), reason: z.string().optional() }))
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

      const now = new Date()

      // Soft delete: marca como deletado em vez de remover fisicamente
      await ctx.db
        .update(users)
        .set({
          deletedAt: now,
          deletedReason: input.reason || 'Conta excluída pelo administrador',
          updatedAt: now,
        })
        .where(eq(users.id, input.userId))

      return { success: true }
    }),

  // ============================================
  // INVITE MANAGEMENT
  // ============================================

  // Criar convite para admin ou psicólogo
  createInvite: protectedProcedure
    .input(
      z.object({
        role: z.enum(['admin', 'psychologist']),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('🔄 createInvite called with:', input)

      const token = nanoid(32)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

      const inviteId = nanoid()
      console.log('📝 Creating invite with token:', `${token.substring(0, 8)}...`)

      await ctx.db.insert(adminInvites).values({
        id: inviteId,
        token,
        role: input.role,
        email: input.email,
        createdBy: ctx.user?.id || 'system',
        status: 'pending',
        expiresAt,
      })

      console.log('✅ Invite saved to database')
      return { success: true, token, inviteId }
    }),

  // Obter convite por token (público)
  getInviteByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const [invite] = await ctx.db
        .select({
          id: adminInvites.id,
          role: adminInvites.role,
          email: adminInvites.email,
          status: adminInvites.status,
          expiresAt: adminInvites.expiresAt,
          creatorName: users.name,
        })
        .from(adminInvites)
        .leftJoin(users, eq(adminInvites.createdBy, users.id))
        .where(eq(adminInvites.token, input.token))
        .limit(1)

      if (!invite) {
        throw new Error('Convite não encontrado')
      }

      if (invite.status !== 'pending') {
        throw new Error('Este convite não está mais válido')
      }

      if (new Date() > invite.expiresAt) {
        throw new Error('Este convite expirou')
      }

      return invite
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

  // ============================================
  // PSYCHOLOGIST ACCOUNT MANAGEMENT
  // ============================================

  // Suspender psicólogo e todos os pacientes vinculados
  suspendPsychologist: protectedProcedure
    .input(
      z.object({
        psychologistId: z.string(),
        reason: z.string().min(1, 'Motivo é obrigatório'),
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

      // Verificar se o usuário é um psicólogo
      const [psychologist] = await ctx.db
        .select()
        .from(users)
        .where(and(eq(users.id, input.psychologistId), eq(users.role, 'psychologist')))
        .limit(1)

      if (!psychologist) {
        throw new Error('Psicólogo não encontrado')
      }

      const now = new Date()

      // Buscar todos os pacientes vinculados a este psicólogo
      const linkedPatients = await ctx.db
        .select({ patientId: psychologistPatients.patientId })
        .from(psychologistPatients)
        .where(eq(psychologistPatients.psychologistId, input.psychologistId))

      const patientIds = linkedPatients.map((p) => p.patientId)

      // Suspender o psicólogo
      await ctx.db
        .update(users)
        .set({ bannedAt: now, banReason: input.reason, updatedAt: now })
        .where(eq(users.id, input.psychologistId))

      // Suspender todos os pacientes vinculados (suspensão em cadeia)
      if (patientIds.length > 0) {
        for (const patientId of patientIds) {
          await ctx.db
            .update(users)
            .set({
              bannedAt: now,
              banReason: 'Seu terapeuta foi suspenso pelo administrador',
              suspendedByTherapistId: input.psychologistId,
              updatedAt: now,
            })
            .where(eq(users.id, patientId))
        }
      }

      // NÃO invalidar sessões para que o usuário possa ver o modal de suspensão
      // A verificação de bannedAt no protectedProcedure vai bloquear outras ações
      // await ctx.db.delete(sessions).where(eq(sessions.userId, input.psychologistId))
      // for (const patientId of patientIds) {
      //   await ctx.db.delete(sessions).where(eq(sessions.userId, patientId))
      // }

      return { success: true, affectedPatients: patientIds.length }
    }),

  // Reativar psicólogo e todos os pacientes vinculados
  reactivatePsychologist: protectedProcedure
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

      // Verificar se o usuário é um psicólogo
      const [psychologist] = await ctx.db
        .select()
        .from(users)
        .where(and(eq(users.id, input.psychologistId), eq(users.role, 'psychologist')))
        .limit(1)

      if (!psychologist) {
        throw new Error('Psicólogo não encontrado')
      }

      const now = new Date()

      // Buscar todos os pacientes vinculados a este psicólogo
      const linkedPatients = await ctx.db
        .select({ patientId: psychologistPatients.patientId })
        .from(psychologistPatients)
        .where(eq(psychologistPatients.psychologistId, input.psychologistId))

      const patientIds = linkedPatients.map((p) => p.patientId)

      // Reativar o psicólogo (limpar todos os campos de suspensão)
      await ctx.db
        .update(users)
        .set({
          bannedAt: null,
          banReason: null,
          updatedAt: now,
        })
        .where(eq(users.id, input.psychologistId))

      // Reativar todos os pacientes vinculados (limpar suspensão em cadeia)
      for (const patientId of patientIds) {
        await ctx.db
          .update(users)
          .set({
            bannedAt: null,
            banReason: null,
            suspendedByTherapistId: null,
            updatedAt: now,
          })
          .where(eq(users.id, patientId))
      }

      return { success: true, affectedPatients: patientIds.length }
    }),

  // Deletar psicólogo e todos os pacientes vinculados (soft delete)
  deletePsychologistWithPatients: protectedProcedure
    .input(z.object({ psychologistId: z.string(), reason: z.string().optional() }))
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

      // Verificar se o usuário é um psicólogo
      const [psychologist] = await ctx.db
        .select()
        .from(users)
        .where(and(eq(users.id, input.psychologistId), eq(users.role, 'psychologist')))
        .limit(1)

      if (!psychologist) {
        throw new Error('Psicólogo não encontrado')
      }

      const now = new Date()

      // Buscar todos os pacientes vinculados a este psicólogo
      const linkedPatients = await ctx.db
        .select({ patientId: psychologistPatients.patientId })
        .from(psychologistPatients)
        .where(eq(psychologistPatients.psychologistId, input.psychologistId))

      const patientIds = linkedPatients.map((p) => p.patientId)

      // Soft delete dos pacientes vinculados
      for (const patientId of patientIds) {
        await ctx.db
          .update(users)
          .set({
            deletedAt: now,
            deletedReason: 'Conta excluída junto com o terapeuta',
            updatedAt: now,
          })
          .where(eq(users.id, patientId))
      }

      // Soft delete do psicólogo
      await ctx.db
        .update(users)
        .set({
          deletedAt: now,
          deletedReason: input.reason || 'Conta excluída pelo administrador',
          updatedAt: now,
        })
        .where(eq(users.id, input.psychologistId))

      return { success: true, deletedPatients: patientIds.length }
    }),

  // Obter pacientes vinculados a um psicólogo
  getPsychologistPatients: protectedProcedure
    .input(z.object({ psychologistId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      // Buscar todos os pacientes vinculados
      const linkedPatients = await ctx.db
        .select({
          patientId: psychologistPatients.patientId,
          isPrimary: psychologistPatients.isPrimary,
          linkedAt: psychologistPatients.createdAt,
        })
        .from(psychologistPatients)
        .where(eq(psychologistPatients.psychologistId, input.psychologistId))

      // Buscar dados dos pacientes
      const patients: {
        id: string
        name: string
        email: string
        bannedAt: Date | null
        isPrimary: boolean
        linkedAt: Date
      }[] = []
      for (const lp of linkedPatients) {
        const [patient] = await ctx.db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            bannedAt: users.bannedAt,
          })
          .from(users)
          .where(eq(users.id, lp.patientId))
          .limit(1)

        if (patient) {
          patients.push({
            ...patient,
            isPrimary: lp.isPrimary,
            linkedAt: lp.linkedAt,
          })
        }
      }

      return patients
    }),

  // Suspender um usuário (paciente ou psicólogo individualmente)
  suspendUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1, 'Motivo é obrigatório'),
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

      // Verificar se o usuário existe
      const [user] = await ctx.db.select().from(users).where(eq(users.id, input.userId)).limit(1)

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      // Não permitir suspender a si mesmo
      if (input.userId === ctx.user.id) {
        throw new Error('Você não pode suspender sua própria conta')
      }

      const now = new Date()

      await ctx.db
        .update(users)
        .set({
          bannedAt: now,
          banReason: input.reason,
          updatedAt: now,
        })
        .where(eq(users.id, input.userId))

      // NÃO invalidar sessões para que o usuário possa ver o modal de suspensão
      // await ctx.db.delete(sessions).where(eq(sessions.userId, input.userId))

      return { success: true }
    }),

  // Obter detalhes completos do usuário
  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verificar se é admin
      const [currentUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)

      if (currentUser?.role !== 'admin') {
        throw new Error('Acesso não autorizado')
      }

      // Buscar usuário
      const [user] = await ctx.db
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
          bannedAt: users.bannedAt,
          banReason: users.banReason,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      let subscription: PsychologistSubscription | null = null
      let linkedPsychologist: LinkedPsychologist = null
      let patientCount = 0

      // Se for psicólogo, buscar assinatura e contagem de pacientes
      if (user.role === 'psychologist') {
        const [sub] = await ctx.db
          .select()
          .from(psychologistSubscriptions)
          .where(eq(psychologistSubscriptions.psychologistId, user.id))
          .limit(1)

        subscription = sub

        const [countResult] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(psychologistPatients)
          .where(eq(psychologistPatients.psychologistId, user.id))

        patientCount = Number(countResult?.count ?? 0)
      }

      // Se for paciente, buscar psicólogo vinculado
      if (user.role === 'patient') {
        const [link] = await ctx.db
          .select({
            psychologistId: psychologistPatients.psychologistId,
          })
          .from(psychologistPatients)
          .where(eq(psychologistPatients.patientId, user.id))
          .limit(1)

        if (link) {
          const [psychologist] = await ctx.db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, link.psychologistId))
            .limit(1)

          linkedPsychologist = psychologist
        }
      }

      return {
        ...user,
        subscription,
        patientCount,
        linkedPsychologist,
      }
    }),

  // Reativar um usuário
  reactivateUser: protectedProcedure
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

      // Verificar se o usuário existe
      const [user] = await ctx.db.select().from(users).where(eq(users.id, input.userId)).limit(1)

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      const now = new Date()

      // Reativar o usuário
      await ctx.db
        .update(users)
        .set({
          bannedAt: null,
          banReason: null,
          suspendedByTherapistId: null,
          updatedAt: now,
        })
        .where(eq(users.id, input.userId))

      return { success: true }
    }),

  // Obter todas as assinaturas de termos de todos os usuários
  getTermsAcceptances: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    // Buscar todos os usuários que precisam aceitar termos (pacientes e psicólogos)
    const allUsers = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        termsAcceptedAt: users.termsAcceptedAt,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
        bannedAt: users.bannedAt,
      })
      .from(users)
      .where(or(eq(users.role, 'psychologist'), eq(users.role, 'patient')))
      .orderBy(users.createdAt)

    return allUsers
  }),

  // Obter estatísticas de assinaturas de termos
  getTermsStats: protectedProcedure.query(async ({ ctx }) => {
    // Verificar se é admin
    const [currentUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1)

    if (currentUser?.role !== 'admin') {
      throw new Error('Acesso não autorizado')
    }

    // Total de pacientes
    const [totalPatients] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'patient'))

    // Pacientes que aceitaram os termos
    const [patientsAccepted] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'patient'), sql`${users.termsAcceptedAt} IS NOT NULL`))

    // Total de psicólogos
    const [totalPsychologists] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'psychologist'))

    // Psicólogos que aceitaram os termos
    const [psychologistsAccepted] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'psychologist'), sql`${users.termsAcceptedAt} IS NOT NULL`))

    return {
      totalPatients: Number(totalPatients?.count ?? 0),
      patientsAccepted: Number(patientsAccepted?.count ?? 0),
      patientsPending: Number(totalPatients?.count ?? 0) - Number(patientsAccepted?.count ?? 0),
      totalPsychologists: Number(totalPsychologists?.count ?? 0),
      psychologistsAccepted: Number(psychologistsAccepted?.count ?? 0),
      psychologistsPending:
        Number(totalPsychologists?.count ?? 0) - Number(psychologistsAccepted?.count ?? 0),
    }
  }),
})
