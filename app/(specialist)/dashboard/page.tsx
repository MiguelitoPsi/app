'use client'

import { TherapistView } from '@/views/TherapistView'

export default function DashboardPage() {
  // O especialista pode voltar para a área do paciente se também for paciente
  // ou simplesmente fazer logout
  return <TherapistView />
}
