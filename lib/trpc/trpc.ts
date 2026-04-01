import { initTRPC, TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import superjson from 'superjson'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

interface CreateContextOptions {
  headers: Headers
}

export async function createContext(opts: CreateContextOptions) {
  try {
    // Debug: log cookies
    const cookieHeader = opts.headers.get('cookie')
    console.log('[tRPC Context] Cookie header:', cookieHeader ? 'present' : 'missing')
    if (cookieHeader) {
      const hasSessionToken = cookieHeader.includes('better-auth.session_token')
      console.log('[tRPC Context] Has session token cookie:', hasSessionToken)
    }

    const session = await auth.api.getSession({
      headers: opts.headers,
    })

    console.log('[tRPC Context] Session result:', session ? 'found' : 'null')

    return {
      db,
      session: session?.session || null,
      user: session?.user || null,
    }
  } catch (error) {
    console.error('[tRPC Context] Error getting session:', error)
    return {
      db,
      session: null,
      user: null,
    }
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!(ctx.session && ctx.user)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Verificar se a conta está bloqueada nas requests protegidas
  const [user] = await ctx.db
    .select({
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, ctx.user.id))
    .limit(1)

  if (user?.deletedAt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Sua conta não está mais disponível para acesso.',
    })
  }

  if (user?.bannedAt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Sua conta está suspensa. Você não pode realizar esta ação.',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  })
})

// Procedimento especial para verificação de suspensão - NÃO bloqueia usuários suspensos
export const suspensionCheckProcedure = t.procedure.use(({ ctx, next }) => {
  if (!(ctx.session && ctx.user)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  })
})

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx })
})

export const psychologistProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'psychologist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx })
})

/**
 * Procedure for psychologists with an active subscription.
 * Blocks mutations when subscription is expired/cancelled.
 * Allows read operations for "read-only mode".
 */
export const subscribedProcedure = psychologistProcedure.use(async ({ ctx, next }) => {
  // Admins bypass subscription check
  if (ctx.user.role === 'admin') {
    return next({ ctx })
  }

  const { isSubscriptionActive } = await import('@/lib/subscription/guard')
  const active = await isSubscriptionActive(ctx.user.id)

  if (!active) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Sua assinatura não está ativa. Renove seu plano para continuar.',
    })
  }

  return next({ ctx })
})
