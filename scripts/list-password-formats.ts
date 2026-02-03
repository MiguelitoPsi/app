
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db'
import { accounts, users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeFileSync } from 'fs'

async function main() {
  try {
    const allAccounts = await db.select({
      id: accounts.id,
      userId: accounts.userId,
      accountId: accounts.accountId,
      providerId: accounts.providerId,
      password: accounts.password,
      email: users.email,
      name: users.name,
      role: users.role
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))

    console.log(`--- TOTAL ACCOUNTS: ${allAccounts.length} ---`)
    
    const results = allAccounts.map(acc => {
      const pwd = acc.password || ''
      let format = 'unknown'
      if (pwd.startsWith('$2a$') || pwd.startsWith('$2b$')) {
        format = 'bcrypt'
      } else if (pwd.includes(':')) {
        format = 'scrypt (salt:hash)'
      }
      
      return {
        email: acc.email,
        role: acc.role,
        accountId: acc.accountId,
        format,
        prefix: pwd.substring(0, 10),
        length: pwd.length
      }
    })

    writeFileSync('scripts/password_formats.json', JSON.stringify(results, null, 2))
    console.log('Results written to scripts/password_formats.json')

  } catch (error) {
    console.error('Error:', error)
  }
}

main()
