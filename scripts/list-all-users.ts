
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

async function main() {
  try {
    const list = await db.select({ 
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    }).from(users)
    
    console.log('--- ALL USERS ---')
    list.forEach(item => {
      console.log(`[${item.role}] ${item.name} (${item.email}) - ID: ${item.id}`)
    })
    console.log(`Total users: ${list.length}`)
    console.log('--- END OF LIST ---')
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

main().catch(console.error)
