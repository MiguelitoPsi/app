'use client'

import { useRouter } from 'next/navigation'
import { JournalHistoryView } from '@/views/JournalHistoryView'

export default function JournalHistoryPage() {
  const router = useRouter()

  return <JournalHistoryView goBack={() => router.back()} />
}
