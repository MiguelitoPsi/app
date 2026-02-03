
import { randomBytes, scrypt } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '../lib/db'
import { accounts, users } from '../lib/db/schema'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

// Better Auth scrypt config (from add-passwords.ts)
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
        if (err) {
          console.error('Scrypt error:', err)
          reject(err)
        } else {
          resolve(`${salt}:${derivedKey.toString('hex')}`)
        }
      }
    )
  })
}

async function main() {
  const email = 'nepsis.app@gmail.com'
  const newPassword = process.argv[2] || 'admin123456'

  console.log(`🔐 Resetting password for ${email}...`)
  console.log(`🔑 New password will be: ${newPassword}`)

  try {
    // Find the user first to get the ID
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (!user) {
      console.error(`❌ User ${email} not found!`)
      process.exit(1)
    }

    const hashedPassword = await hashPasswordScrypt(newPassword)

    // Update the password in the accounts table
    const result = await db.update(accounts)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(and(
        eq(accounts.userId, user.id),
        eq(accounts.providerId, 'credential')
      ))

    console.log(`✅ Password successfully reset for ${email}`)
    console.log(`📝 Hash updated in accounts table for userId: ${user.id}`)
    
  } catch (error) {
    console.error('❌ Error resetting password:', error)
  }
}

main().then(() => {
  console.log('Script finished.')
})
