import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { accounts } from '../lib/db/schema'

async function main() {
  try {
    const userId = 'Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu'
    const list = await db.select().from(accounts).where(eq(accounts.userId, userId))

    console.log('--- USER ACCOUNTS ---')
    console.log(JSON.stringify(list, null, 2))
    console.log('--- END OF LIST ---')
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }
}

main().catch(console.error)
