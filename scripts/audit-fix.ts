
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { users, accounts, therapistProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const email = 'psijmrodrigues@gmail.com'
  
  console.log('--- AUDIT FOR EMAIL:', email, '---')
  
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (user) {
    console.log('User found:', user.id, user.name, user.role)
    
    const accs = await db.select().from(accounts).where(eq(accounts.userId, user.id))
    console.log(`Found ${accs.length} accounts for this user:`)
    accs.forEach(a => {
      console.log(`- Provider: ${a.providerId}, AccountID: ${a.accountId}, HasPassword: ${!!a.password}`)
    })
    
    const [profile] = await db.select().from(therapistProfiles).where(eq(therapistProfiles.therapistId, user.id))
    if (profile) {
      console.log('Profile found:', profile.username, profile.fullName)
    } else {
      console.log('NO PROFILE FOUND for this ID')
    }
  } else {
    console.log('USER NOT FOUND BY EMAIL')
  }
}

main()
