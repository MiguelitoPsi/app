
import { randomBytes, scrypt } from 'node:crypto'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env.local' })

import { db } from '@/lib/db'
import { accounts, sessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Better Auth scrypt config (from scripts/add-passwords.ts)
const scryptConfig = {
  N: 16_384,
  r: 16,
  p: 1,
  dkLen: 64,
}

function hashPasswordScrypt(password: string): Promise<string> {
  const normalizedPassword = password.normalize('NFKC')
  const salt = randomBytes(16).toString('hex')

  return new Promise((resolve, reject) => {
    scrypt(
      normalizedPassword,
      salt,
      scryptConfig.dkLen,
      {
        N: scryptConfig.N,
        r: scryptConfig.r,
        p: scryptConfig.p,
        maxmem: 128 * scryptConfig.N * scryptConfig.r * 2,
      },
      (err, derivedKey) => {
        if (err) reject(err)
        else resolve(`${salt}:${derivedKey.toString('hex')}`)
      }
    )
  })
}

async function fixAccount() {
  const userId = 'Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu'
  const password = 'mudar12345'
  
  console.log('--- APPLYING DEFINITIVE AUTH FIX ---')
  
  // 1. Hash the password correctly
  const hashedPassword = await hashPasswordScrypt(password)
  console.log('New scrypt hash generated.')

  // 2. Update the account record
  // Pattern: id = userId (observed in working accounts), accountId = userId
  const [existingAcc] = await db.select().from(accounts).where(eq(accounts.userId, userId))
  
  if (existingAcc) {
    console.log('Updating existing account record...')
    await db.update(accounts).set({
        id: userId, // Match working pattern id == userId
        accountId: userId,
        password: hashedPassword,
        updatedAt: new Date()
    }).where(eq(accounts.userId, userId))
  } else {
    console.log('Creating new account record...')
    await db.insert(accounts).values({
        id: userId,
        userId: userId,
        accountId: userId,
        providerId: 'credential',
        password: hashedPassword
    })
  }

  // 3. Clear sessions
  await db.delete(sessions).where(eq(sessions.userId, userId))
  console.log('Sessions cleared.')

  console.log('--- FIX APPLIED SUCCESSFULLY ---')
}

fixAccount().catch(console.error)
