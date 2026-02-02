
import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { therapistProfiles } from '@/lib/db/schema'

async function main() {
  try {
    const list = await db.select({ 
      username: therapistProfiles.username,
      id: therapistProfiles.therapistId,
      name: therapistProfiles.fullName,
      cpf: therapistProfiles.cpf
    }).from(therapistProfiles)
    
    console.log('--- ALL THERAPIST PROFILES ---')
    list.forEach(item => {
      console.log(`User: ${item.name}`)
      console.log(`  ID: ${item.id}`)
      console.log(`  Username: [${item.username}]`)
      console.log(`  CPF: [${item.cpf}]`)
      console.log('---------------------------')
    })
    console.log(`Total profiles: ${list.length}`)
    console.log('--- END OF LIST ---')
  } catch (error) {
    console.error('Error fetching profiles:', error)
  }
}

main().catch(console.error)
