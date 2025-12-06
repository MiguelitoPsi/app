import * as dotenv from 'dotenv'

dotenv.config()

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { journalEntries } from '../lib/db/schema'

async function addTestFeedback() {
  console.log('🔧 Adding test feedback...\n')

  try {
    // Get all journal entries
    const allEntries = await db.select().from(journalEntries).all()

    if (allEntries.length === 0) {
      console.log('❌ No journal entries found. Please create a journal entry first.')
      return
    }

    // Find the first entry without feedback or update the first entry
    const targetEntry = allEntries[0]

    console.log(`📝 Adding feedback to entry: ${targetEntry.id.substring(0, 8)}...`)
    console.log(`   Patient ID: ${targetEntry.userId}`)
    console.log(`   Content: "${targetEntry.content.substring(0, 50)}..."`)

    await db
      .update(journalEntries)
      .set({
        therapistFeedback:
          'Olá! Este é um feedback de teste do seu terapeuta. Parabéns por registrar seus pensamentos! Continue assim! 💚',
        feedbackAt: new Date(),
        feedbackViewed: false, // IMPORTANTE: marcar como não visualizado
      })
      .where(eq(journalEntries.id, targetEntry.id))

    console.log('\n✅ Feedback adicionado com sucesso!')
    console.log('📱 Agora:')
    console.log(`   1. Faça login como PACIENTE (userId: ${targetEntry.userId})`)
    console.log('   2. Acesse a página /home')
    console.log('   3. Você deve ver o alerta verde de "Novo Feedback Recebido"')
    console.log('   4. Clique no alerta para ir ao diário')
    console.log('   5. O feedback deve aparecer na entrada')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addTestFeedback().catch(console.error)
