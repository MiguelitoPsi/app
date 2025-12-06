import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getLevelFromXP, LEVEL_THRESHOLDS } from '@/lib/xp'

async function main() {
  console.log('🔍 Buscando usuário "Miguel Paciente"...')

  const [user] = await db.select().from(users).where(eq(users.name, 'Miguel Paciente')).limit(1)

  if (!user) {
    console.error('❌ Usuário não encontrado!')
    process.exit(1)
  }

  console.log(`👤 Usuário encontrado: ${user.name} (${user.email})`)
  console.log(`📊 Stats atuais: Nível ${user.level} | XP ${user.experience}`)

  // Recalcular nível baseado no XP atual e na nova tabela
  const correctLevel = getLevelFromXP(user.experience)

  console.log('🔄 Recalculando nível com base na nova curva...')
  console.log(`📈 XP Atual: ${user.experience}`)
  console.log(`🎯 Nível Correto: ${correctLevel}`)

  if (user.level === correctLevel) {
    console.log('✅ O nível já está correto. Nenhuma alteração necessária.')
    process.exit(0)
  }

  // Atualizar no banco
  await db
    .update(users)
    .set({
      level: correctLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  console.log(`✅ Nível atualizado com sucesso de ${user.level} para ${correctLevel}!`)

  // Mostrar próximo nível
  const nextLevel = correctLevel + 1
  const xpForNext = LEVEL_THRESHOLDS[nextLevel] || 'MAX'
  console.log(`🚀 Próximo nível (${nextLevel}) em: ${xpForNext} XP`)
}

main().catch((err) => {
  console.error('Erro ao executar script:', err)
  process.exit(1)
})
