'use client'

import { useRouter } from 'next/navigation'
import { JournalView } from '@/views/JournalView'

export default function JournalPage() {
  const router = useRouter()

  return <JournalView goHome={() => router.push('/home')} />
}
