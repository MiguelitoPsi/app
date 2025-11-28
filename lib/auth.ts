import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { db } from './db'
import * as schema from './db/schema'

export const auth = betterAuth({
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Verificar se o usuário está suspenso antes de criar a sessão
          const [user] = await db
            .select({ bannedAt: schema.users.bannedAt })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1)

          if (user?.bannedAt) {
            throw new Error('Sua conta foi suspensa. Entre em contato com o suporte.')
          }

          return { data: session }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'patient',
        input: false,
      },
      level: {
        type: 'number',
        required: false,
        defaultValue: 1,
      },
      experience: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      streak: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      coins: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
    },
  },
  socialProviders: {
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
})

export type Session = typeof auth.$Infer.Session
