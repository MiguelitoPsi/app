
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db'
import { accounts } from '../lib/db/schema'
import { or, eq } from 'drizzle-orm'
import { writeFileSync } from 'fs'

async function main() {
  try {
    const userIds = ['Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu', 'tbb0Hgu5g446mBRS1cas2w3ChwiXW66I']
    const list = await db.select().from(accounts).where(or(
      eq(accounts.userId, userIds[0]),
      eq(accounts.userId, userIds[1])
    ))
    
    writeFileSync('scripts/admin_accounts_dump.json', JSON.stringify(list, null, 2))
    console.log('Dump created in scripts/admin_accounts_dump.json')
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }
}

main().catch(console.error)
