import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  badges,
  journalEntries,
  meditationSessions,
  moodHistory,
  notifications,
  rewards,
  tasks,
  userStats,
  users,
} from '@/lib/db/schema'

async function main() {
  console.log('🔍 Buscando usuário "Miguel Paciente"...')

  const [user] = await db.select().from(users).where(eq(users.name, 'Miguel Paciente')).limit(1)

  if (!user) {
    console.error('❌ Usuário não encontrado!')
    process.exit(1)
  }

  console.log(`👤 Usuário encontrado: ${user.name} (${user.email})`)
  console.log('⚠️  INICIANDO RESET TOTAL COMPLETO...')

  // 1. Resetar status do usuário
  await db
    .update(users)
    .set({
      level: 1,
      experience: 0,
      coins: 0,
      streak: 0,
      lastTaskXpDate: null,
      lastJournalXpDate: null,
      lastMeditationXpDate: null,
      lastMoodXpDate: null,
    })
    .where(eq(users.id, user.id))
  console.log('✅ Status do usuário resetado (Nível 1, 0 XP, 0 Moedas, 0 Streak)')

  // 2. Limpar Conquistas
  await db.delete(badges).where(eq(badges.userId, user.id))
  console.log('✅ Conquistas removidas')

  // 3. Limpar Registros (Diário)
  await db.delete(journalEntries).where(eq(journalEntries.userId, user.id))
  console.log('✅ Entradas do diário removidas')

  // 4. Limpar Histórico de Humor
  await db.delete(moodHistory).where(eq(moodHistory.userId, user.id))
  console.log('✅ Histórico de humor removido')

  // 5. Limpar Sessões de Meditação
  await db.delete(meditationSessions).where(eq(meditationSessions.userId, user.id))
  console.log('✅ Sessões de meditação removidas')

  // 6. Limpar Tarefas (Tasks)
  await db.delete(tasks).where(eq(tasks.userId, user.id))
  console.log('✅ Tarefas removidas')

  // 7. Limpar Recompensas (Rewards)
  await db.delete(rewards).where(eq(rewards.userId, user.id))
  console.log('✅ Recompensas removidas')

  // 8. Limpar Notificações
  await db.delete(notifications).where(eq(notifications.userId, user.id))
  console.log('✅ Notificações removidas')

  // 9. Resetar Estatísticas
  await db.delete(userStats).where(eq(userStats.userId, user.id))
  console.log('✅ Estatísticas removidas')

  console.log('\n✨ RESET CONCLUÍDO COM SUCESSO! ✨')
}

main().catch((err) => {
  console.error('Erro ao executar script:', err)
  process.exit(1)
})
