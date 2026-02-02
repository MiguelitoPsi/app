
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import * as fs from 'fs'

async function main() {
  const all = await db.select().from(users)
  fs.writeFileSync('scripts/db_users.json', JSON.stringify(all, null, 2))
  console.log(`Saved ${all.length} users to scripts/db_users.json`)
}

main()
