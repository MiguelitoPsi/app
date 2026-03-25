import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq, or } from 'drizzle-orm'
import { writeFileSync } from 'fs'
import { db } from '../lib/db'
import { users } from '../lib/db/schema'

async function main() {
  try {
    const userIds = ['Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu', 'tbb0Hgu5g446mBRS1cas2w3ChwiXW66I']
    const list = await db
      .select()
      .from(users)
      .where(or(eq(users.id, userIds[0]), eq(users.id, userIds[1])))

    writeFileSync('scripts/admin_users_dump.json', JSON.stringify(list, null, 2))
    console.log('Dump created in scripts/admin_users_dump.json')
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

main().catch(console.error)
