import { db } from '../lib/db/index.js'
import { accounts } from '../lib/db/schema.js'

async function deleteAccounts() {
  await db.delete(accounts)
  console.log('✓ Todos os accounts foram deletados')
  process.exit(0)
}

deleteAccounts().catch(console.error)
