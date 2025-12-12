/**
 * Script para sincronizar níveis de todos os pacientes baseado no XP
 */

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { users } from '../lib/db/schema'

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 700,
  4: 1200,
  5: 1800,
  6: 2500,
  7: 3300,
  8: 4200,
  9: 5200,
  10: 6500,
}

function getLevelFromXP(xp: number): number {
  for (let level = 10; level >= 1; level--) {
    if (xp >= LEVEL_THRESHOLDS[level]) {
      return level
    }
  }
  return 1
}

async function main() {
  console.log('🔍 Verificando níveis de pacientes...\n')

  const patients = await db
    .select({
      id: users.id,
      name: users.name,
      experience: users.experience,
      level: users.level,
    })
    .from(users)
    .where(eq(users.role, 'patient'))

  let fixed = 0

  for (const patient of patients) {
    const correctLevel = getLevelFromXP(patient.experience)
    const isCorrect = patient.level === correctLevel

    console.log(
      `${patient.name}: XP=${patient.experience}, Level=${patient.level}, Should be=${correctLevel} ${isCorrect ? '✅' : '❌ FIXING...'}`
    )

    if (!isCorrect) {
      await db
        .update(users)
        .set({ level: correctLevel, updatedAt: new Date() })
        .where(eq(users.id, patient.id))
      fixed++
      console.log(`   ✅ Fixed: ${patient.level} → ${correctLevel}`)
    }
  }

  console.log(`\n✅ Done! Fixed ${fixed} patient(s).`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
