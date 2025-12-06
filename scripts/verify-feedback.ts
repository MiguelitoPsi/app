import * as dotenv from 'dotenv'

dotenv.config()

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { journalEntries } from '../lib/db/schema'

async function main() {
  console.log('Checking journal entries...')
  try {
    const entries = await db.select().from(journalEntries).all()
    console.log(`Found ${entries.length} entries.`)

    const feedbackEntries = entries.filter((e) => e.therapistFeedback)
    console.log(`Found ${feedbackEntries.length} entries with feedback.`)

    feedbackEntries.forEach((e) => {
      console.log(
        `Entry ${e.id}: FeedbackViewed = ${e.feedbackViewed}, Feedback = "${e.therapistFeedback?.substring(0, 20)}..."`
      )
    })

    if (feedbackEntries.length === 0 && entries.length > 0) {
      console.log('No feedback found. Adding dummy feedback to first entry...')
      const firstEntry = entries[0]
      await db
        .update(journalEntries)
        .set({
          therapistFeedback: 'Este é um feedback de teste para verificar a notificação.',
          feedbackAt: new Date(),
          feedbackViewed: false,
        })
        .where(eq(journalEntries.id, firstEntry.id))
      console.log('Dummy feedback added to entry', firstEntry.id)
    }
  } catch (e) {
    console.error('Error querying DB:', e)
  }
}

main().catch(console.error)
