import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { users } from '../lib/db/schema'

async function main() {
  try {
    const id = 'Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu'
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (user) {
      console.log('--- USER FOUND ---')
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log('--- USER NOT FOUND ---')
    }
  } catch (error) {
    console.error('Error fetching user:', error)
  }
}

main().catch(console.error)
