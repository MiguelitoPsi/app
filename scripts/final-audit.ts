import { config } from 'dotenv'

config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  accounts,
  patientInvites,
  psychologistPatients,
  therapistFinancial,
  therapistProfiles,
  therapistStats,
  users,
} from '@/lib/db/schema'

async function main() {
  const userId = 'Ibahp2rLhlMCu3CiJJW0PGKRaijREtWu'

  console.log('--- DATA AUDIT FOR ID:', userId, '---')

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  console.log('User Record:', user ? 'OK' : 'MISSING')

  const [profile] = await db
    .select()
    .from(therapistProfiles)
    .where(eq(therapistProfiles.therapistId, userId))
  console.log('Therapist Profile:', profile ? 'OK' : 'MISSING')

  const [stats] = await db
    .select()
    .from(therapistStats)
    .where(eq(therapistStats.therapistId, userId))
  console.log('Therapist Stats:', stats ? 'OK' : 'MISSING')

  const financial = await db
    .select()
    .from(therapistFinancial)
    .where(eq(therapistFinancial.therapistId, userId))
  console.log('Financial Records:', financial.length)

  const patientsCount = await db
    .select()
    .from(psychologistPatients)
    .where(eq(psychologistPatients.psychologistId, userId))
  console.log('Linked Patients:', patientsCount.length)

  const invites = await db
    .select()
    .from(patientInvites)
    .where(eq(patientInvites.psychologistId, userId))
  console.log('Pending Invites:', invites.length)

  const accountsLinked = await db.select().from(accounts).where(eq(accounts.userId, userId))
  console.log('Auth Accounts:', accountsLinked.length)
  accountsLinked.forEach((a) => {
    console.log(`- Provider: ${a.providerId}, AccountID: ${a.accountId}, ID: ${a.id}`)
  })
}

main()
