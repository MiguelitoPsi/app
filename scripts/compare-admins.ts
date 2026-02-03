
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db'
import { accounts } from '../lib/db/schema'
import { or, eq } from 'drizzle-orm'

async function main() {
  try {
    const userIds = ['Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu', 'tbb0Hgu5g446mBRS1cas2w3ChwiXW66I']
    const list = await db.select().from(accounts).where(or(
      eq(accounts.userId, userIds[0]),
      eq(accounts.userId, userIds[1])
    ))
    
    console.log('--- ADMIN ACCOUNTS ---')
    list.forEach(acc => {
      console.log(`User: ${acc.userId}`)
      console.log(`AccID: ${acc.id}`)
      console.log(`Provider: ${acc.providerId}`)
      console.log(`Password Hash: ${acc.password ? acc.password.substring(0, 20) + '...' : 'null'}`)
      console.log('---')
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }
}

main().catch(console.error)
