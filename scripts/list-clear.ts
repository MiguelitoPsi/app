
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

async function main() {
  const all = await db.select().from(users)
  console.log('--- USERS IN DB ---')
  for (const u of all) {
    console.log(`- ID: ${u.id}`)
    console.log(`  Name: ${u.name}`)
    console.log(`  Email: ${u.email}`)
    console.log(`  Role: ${u.role}`)
    console.log('------------------')
  }
}

main()
