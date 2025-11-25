import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { users } from '@/lib/db/schema'
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
})
