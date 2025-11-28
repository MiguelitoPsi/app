'use client'

import { useRouter } from 'next/navigation'
import { MeditationView } from '@/views/MeditationView'

export default function MeditationPage() {
  const router = useRouter()

  return <MeditationView goHome={() => router.push('/home')} />
}
