import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { therapistProfiles, users } from '@/lib/db/schema'

async function main() {
  try {
    console.log('--- STARTING CLEANUP ---')

    // 1. Identify the user "Psicólogo Teste"
    const [testUser] = await db.select().from(users).where(eq(users.name, 'Psicólogo Teste'))

    if (testUser) {
      console.log(`Found test user: ${testUser.name} (${testUser.id})`)

      // 2. Delete the profile first (due to foreign key usually, though Drizzle handles cascaded deletes if defined)
      const profileDeleted = await db
        .delete(therapistProfiles)
        .where(eq(therapistProfiles.therapistId, testUser.id))
      console.log('Deleted therapist profile associated with test user.')

      // 3. Delete the user
      await db.delete(users).where(eq(users.id, testUser.id))
      console.log('Deleted test user.')
    } else {
      console.log('Test user "Psicólogo Teste" not found.')
    }

    // 4. Double check for the specific username 00000000000 just in case it belongs to another ID
    const [extraProfile] = await db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.username, '00000000000'))
    if (extraProfile) {
      console.log(
        `Found extra profile with username 00000000000 (ID: ${extraProfile.therapistId}). Deleting...`
      )
      await db.delete(therapistProfiles).where(eq(therapistProfiles.username, '00000000000'))
      // If we want to be thorough, delete the user too if they exist
      await db.delete(users).where(eq(users.id, extraProfile.therapistId))
    }

    console.log('--- CLEANUP FINISHED ---')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

main().catch(console.error)
