import * as dotenv from 'dotenv'
dotenv.config()
import { db } from '../lib/db'
import { journalEntries } from '../lib/db/schema'
import { eq, isNotNull, and } from 'drizzle-orm'

async function testFeedbackSystem() {
  console.log('🔍 Testing Feedback Notification System...\n')

  try {
    // 1. Find all journal entries
    const allEntries = await db.select().from(journalEntries).all()
    console.log(`📊 Total journal entries: ${allEntries.length}`)

    // 2. Find entries with feedback
    const entriesWithFeedback = allEntries.filter(e => e.therapistFeedback)
    console.log(`💬 Entries with feedback: ${entriesWithFeedback.length}`)

    // 3. Find unviewed feedback
    const unviewedFeedback = allEntries.filter(
      e => e.therapistFeedback && e.feedbackViewed === false
    )
    console.log(`🔔 Unviewed feedback: ${unviewedFeedback.length}`)

    if (unviewedFeedback.length > 0) {
      console.log('\n📋 Unviewed feedback details:')
      unviewedFeedback.forEach(entry => {
        console.log(`  - Entry ${entry.id.substring(0, 8)}...`)
        console.log(`    User: ${entry.userId}`)
        console.log(`    Feedback: "${entry.therapistFeedback?.substring(0, 50)}..."`)
        console.log(`    Viewed: ${entry.feedbackViewed}`)
      })
    }

    // 4. If no entries with feedback, add test feedback to first entry
    if (entriesWithFeedback.length === 0 && allEntries.length > 0) {
      console.log('\n⚠️  No feedback found. Adding test feedback to first entry...')
      const firstEntry = allEntries[0]
      
      await db.update(journalEntries)
        .set({
          therapistFeedback: 'Este é um feedback de teste do terapeuta. Parabéns pelo registro!',
          feedbackAt: new Date(),
          feedbackViewed: false
        })
        .where(eq(journalEntries.id, firstEntry.id))
      
      console.log(`✅ Test feedback added to entry ${firstEntry.id.substring(0, 8)}...`)
      console.log(`   Patient ID: ${firstEntry.userId}`)
      console.log('\n🔄 Please refresh the patient home page to see the notification!')
    }

    console.log('\n✅ Test complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testFeedbackSystem().catch(console.error)
