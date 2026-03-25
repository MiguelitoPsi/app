import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { accounts, sessions, users } from '../lib/db/schema'

async function fixAdminAccount() {
  const userId = 'tbb0Hgu5g446mBRS1cas2w3ChwiXW66I'
  const email = 'nepsis.app@gmail.com'

  console.log(`--- STARTING FIX FOR ADMIN: ${email} ---`)

  try {
    // 1. Verify User exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      console.error(`User with ID ${userId} not found!`)
      return
    }

    // 2. Update User: mark email as verified and terms as accepted
    console.log('Updating user flags (emailVerified, termsAcceptedAt)...')
    await db
      .update(users)
      .set({
        emailVerified: true,
        termsAcceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // 3. Fix Account record ID pattern (id should equal userId)
    console.log('Fixing account record structure...')
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1)

    if (account) {
      if (account.id !== userId) {
        console.log(`Mismatch found! Current account ID: ${account.id}. Changing to: ${userId}`)

        // Drizzle/Better-sqlite3 doesn't easily allow updating primary keys,
        // so we delete and re-insert the same account with the correct ID.
        await db.delete(accounts).where(eq(accounts.id, account.id))
        await db.insert(accounts).values({
          ...account,
          id: userId,
          updatedAt: new Date(),
        })
        console.log('Account ID updated successfully.')
      } else {
        console.log('Account ID already matches User ID.')
      }
    } else {
      console.log('No account record found for this user! This is unexpected.')
    }

    // 4. Clear any active sessions
    console.log('Clearing existing sessions...')
    await db.delete(sessions).where(eq(sessions.userId, userId))

    console.log('--- FIX COMPLETED SUCCESSFULLY ---')
  } catch (error) {
    console.error('An error occurred during the fix:', error)
  }
}

fixAdminAccount().catch(console.error)
