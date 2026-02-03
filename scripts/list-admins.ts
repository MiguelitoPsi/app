
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  try {
    const list = await db.select({ 
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      bannedAt: users.bannedAt
    }).from(users).where(eq(users.role, 'admin'))
    
    console.log('--- ADMIN USERS ---')
    console.log(JSON.stringify(list, null, 2))
    console.log('--- END OF LIST ---')
  } catch (error) {
    console.error('Error fetching admins:', error)
  }
}

main().catch(console.error)
