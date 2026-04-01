import * as relations from '@shared/db/relations'
import * as schema from '@shared/db/schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const createDbClient = () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Create postgres client with connection pooling for serverless
  const client = postgres(connectionString, {
    prepare: false, // Disable prepared statements for Supabase pooler compatibility
    max: 10, // Maximum pool size
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema: { ...schema, ...relations } })
}

type DbClient = ReturnType<typeof createDbClient>

// Lazy initialization to avoid build-time errors
let _db: DbClient | null = null

export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop: string | symbol) {
    if (!_db) {
      _db = createDbClient()
    }
    return _db[prop as keyof DbClient]
  },
})

export * from '@shared/db/relations'
// Re-export schema and relations for convenience
export * from '@shared/db/schema'
