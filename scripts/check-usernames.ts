import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { therapistProfiles, users } from '@/lib/db/schema'

async function main() {
  console.log('--- Therapist Profiles ---')
  const profiles = await db.select().from(therapistProfiles)
  if (profiles.length === 0) {
    console.log('No therapist profiles found.')
  } else {
    profiles.forEach((p) => {
      console.log(`Username: "${p.username}", Name: "${p.fullName}", ID: ${p.therapistId}`)
    })
  }

  console.log('\n--- Users with Role "psychologist" ---')
  const psychologists = await db.select().from(users).where(eq(users.role, 'psychologist'))
  if (psychologists.length === 0) {
    console.log('No users with role "psychologist" found.')
  } else {
    psychologists.forEach((u) => {
      console.log(`Name: "${u.name}", Email: "${u.email}", ID: ${u.id}`)
    })
  }
}

main().catch(console.error)
