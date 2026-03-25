import { config } from 'dotenv'

config({ path: '.env.local' })

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { therapistProfiles, users } from '@/lib/db/schema'

async function main() {
  try {
    const profileCount = await db.select({ count: sql`count(*)` }).from(therapistProfiles)
    console.log('Profile count:', profileCount[0].count)

    const userCount = await db.select({ count: sql`count(*)` }).from(users)
    console.log('User count:', userCount[0].count)

    const profiles = await db.select().from(therapistProfiles).limit(10)
    console.log('Sample profiles:', JSON.stringify(profiles, null, 2))
  } catch (error) {
    console.error('Error querying database:', error)
  }
}

main().catch(console.error)
