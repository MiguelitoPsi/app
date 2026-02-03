
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  try {
    const email = 'nepsis.app@gmail.com'
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    
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
