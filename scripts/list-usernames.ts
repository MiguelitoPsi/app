import { config } from 'dotenv'

config({ path: '.env.local' })

import { db } from '@/lib/db'
import { therapistProfiles } from '@/lib/db/schema'

async function main() {
  try {
    const list = await db
      .select({
        username: therapistProfiles.username,
        id: therapistProfiles.therapistId,
        name: therapistProfiles.fullName,
      })
      .from(therapistProfiles)

    console.log('--- ALL THERAPIST USERNAMES ---')
    list.forEach((item) => {
      console.log(`[${item.username}] - ${item.name} (${item.id})`)
    })
    console.log('--- END OF LIST ---')
  } catch (error) {
    console.error('Error fetching usernames:', error)
  }
}

main().catch(console.error)
