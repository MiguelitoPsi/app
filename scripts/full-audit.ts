
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { users, therapistProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  try {
    const allPsychologists = await db.select().from(users).where(eq(users.role, 'psychologist'))
    console.log(`Found ${allPsychologists.length} users with role "psychologist":`)
    
    for (const u of allPsychologists) {
      const [profile] = await db.select().from(therapistProfiles).where(eq(therapistProfiles.therapistId, u.id))
      console.log(`\nUser: ${u.name} (${u.id})`)
      console.log(`  Email: ${u.email}`)
      if (profile) {
        console.log(`  Profile Username: [${profile.username}]`)
        console.log(`  Profile CPF: [${profile.cpf}]`)
      } else {
        console.log(`  NO PROFILE FOUND`)
      }
    }

    console.log('\n--- ALL USERNAMES IN therapistProfiles ---')
    const allUsernames = await db.select({username: therapistProfiles.username}).from(therapistProfiles)
    allUsernames.forEach(p => console.log(`- ${p.username}`))

  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
