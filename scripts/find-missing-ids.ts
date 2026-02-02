
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { 
  therapistProfiles, 
  therapistStats, 
  therapistFinancial, 
  psychologistPatients, 
  patientInvites 
} from '@/lib/db/schema'

async function main() {
  const ids = new Set<string>()
  
  const p = await db.select({id: therapistProfiles.therapistId}).from(therapistProfiles)
  p.forEach(r => ids.add(r.id))
  
  const s = await db.select({id: therapistStats.therapistId}).from(therapistStats)
  s.forEach(r => ids.add(r.id))
  
  const f = await db.select({id: therapistFinancial.therapistId}).from(therapistFinancial)
  f.forEach(r => ids.add(r.id))
  
  const pp = await db.select({id: psychologistPatients.psychologistId}).from(psychologistPatients)
  pp.forEach(r => ids.add(r.id))
  
  const pi = await db.select({id: patientInvites.psychologistId}).from(patientInvites)
  pi.forEach(r => ids.add(r.id))
  
  console.log('--- ALL UNIQUE THERAPIST IDS FOUND ---')
  console.log(Array.from(ids))
}

main()
