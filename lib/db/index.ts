import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as relations from './relations'
import * as schema from './schema'

const createDbClient = () => {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set')
  }
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
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
