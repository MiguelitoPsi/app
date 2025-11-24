'use client'

import { useRouter } from 'next/navigation'
import { TherapistView } from '@/views/TherapistView'

export default function DashboardPage() {
  const router = useRouter()

  // O especialista pode voltar para a área do paciente se também for paciente
  // ou simplesmente fazer logout
  return <TherapistView goBack={() => router.push('/profile')} />
}
