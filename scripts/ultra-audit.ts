import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { accounts, therapistProfiles, users } from '@/lib/db/schema'

async function main() {
  const email = 'psijmrodrigues@gmail.com'
  console.log('--- STARTING COMPREHENSIVE AUDIT ---')

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (user) {
    console.log('USER OBJECT:')
    console.log(JSON.stringify(user, null, 2))

    const accs = await db.select().from(accounts).where(eq(accounts.userId, user.id))
    console.log('\nACCOUNT(S) LINKED:')
    console.log(JSON.stringify(accs, null, 2))

    const [profile] = await db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.therapistId, user.id))
    console.log('\nTHERAPIST PROFILE:')
    console.log(JSON.stringify(profile, null, 2))
  } else {
    console.log('USER NOT FOUND IN DB!')
  }
  console.log('--- END OF AUDIT ---')
}

main()
