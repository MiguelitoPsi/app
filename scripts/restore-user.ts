import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

async function main() {
  const email = 'psijmrodrigues@gmail.com'
  const userId = 'Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu'
  const name = 'Jorge Miguel Rodrigues Vieira'

  try {
    console.log('--- RESTORING PSYCHOLOGIST ACCOUNT ---')

    // Check if it already exists (unlikely but safe)
    const [existing] = await db.select().from(users).where(eq(users.id, userId))

    if (existing) {
      console.log('User record already exists. Restoring role and email...')
      await db
        .update(users)
        .set({
          role: 'psychologist',
          email,
          name,
        })
        .where(eq(users.id, userId))
    } else {
      console.log(`Re-inserting user ${userId}...`)
      await db.insert(users).values({
        id: userId,
        name,
        email,
        role: 'psychologist',
        level: 1,
        experience: 0,
        streak: 0,
        coins: 0,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log('--- RESTORATION FINISHED ---')
    console.log(`You can now login with: ${email}`)
  } catch (error) {
    console.error('Error during restoration:', error)
  }
}

main()
