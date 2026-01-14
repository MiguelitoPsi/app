'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { RoleGuard } from '@/components/RoleGuard'
import { DashboardHeader } from '@/components/therapist/DashboardHeader'
import { DashboardSidebar } from '@/components/therapist/DashboardSidebar'
import { TherapistLevelUpManager } from '@/components/TherapistLevelUpManager'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { TherapistXPGainToast } from '@/components/TherapistXPGainToast'
import { SelectedPatientProvider, useSelectedPatient } from '@/context/SelectedPatientContext'
import { TherapistGameProvider } from '@/context/TherapistGameContext'
import { trpc } from '@/lib/trpc/client'

function SpecialistContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'
  const isRoutine = pathname === '/therapist-routine'
  const isProfile = pathname === '/profile'
  const { isPatientViewActive } = useSelectedPatient()

  const { data: termsData, isLoading: isLoadingTerms } = trpc.user.checkTermsAccepted.useQuery(
    undefined,
    {
      staleTime: 0,
      refetchOnMount: true,
    }
  )

  const { data: profileData, isLoading: isLoadingProfile } =
    trpc.therapistProfile.checkProfileComplete.useQuery(undefined, {
      staleTime: 0,
      refetchOnMount: true,
    })

  const isLoading = isLoadingTerms || isLoadingProfile

  // Determine which modal to show based on server data
  const getModalState = () => {
    if (isLoading) return { showTerms: false, showProfile: false }

    // First check if terms need to be accepted
    if (termsData?.needsToAcceptTerms) return { showTerms: true, showProfile: false }

    // Then check if profile needs to be created
    if (profileData?.needsProfile) return { showTerms: false, showProfile: true }

    return { showTerms: false, showProfile: false }
  }

  const { showTerms, showProfile } = getModalState()

  // Se estiver na visão detalhada do paciente, não mostra sidebar e header
  // Exceto na rota de relatórios e configurações, onde precisamos da sidebar
  if (isPatientViewActive && pathname !== '/reports' && pathname !== '/settings' && pathname !== '/financial') {
    return (
      <div className='min-h-screen bg-slate-50 dark:bg-slate-900'>
        <TherapistTermsModal isOpen={showTerms} />
        <TherapistProfileModal isOpen={showProfile} mode='create' />
        <TherapistLevelUpManager />
        <TherapistXPGainToast />
        <main className='min-h-screen'>{children}</main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900'>
      {/* Terms Modal - shown first */}
      <TherapistTermsModal isOpen={showTerms} />

      {/* Profile Modal - shown after terms are accepted */}
      <TherapistProfileModal isOpen={showProfile} mode='create' />

      {/* Level Up Manager - shows modal on level up */}
      <TherapistLevelUpManager />

      {/* XP Gain Toast - floating notifications */}
      <TherapistXPGainToast />

      {/* Sidebar based on route */}
      {isDashboard || isRoutine ? (
        <>
          <DashboardSidebar />
          <main className='ml-16 h-screen overflow-hidden bg-slate-50 dark:bg-slate-900'>
            <DashboardHeader />
            <div className='h-[calc(100vh-64px)] overflow-hidden'>{children}</div>
          </main>
        </>
      ) : isProfile ? (
        <>
          <DashboardSidebar />
          <main className='ml-16 min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900'>
            <DashboardHeader />
            <div className='min-h-[calc(100vh-64px)]'>{children}</div>
          </main>
        </>
      ) : (
        <>
          <DashboardSidebar />
          <main className='ml-16 min-h-screen bg-slate-50 pb-8 transition-colors duration-300 dark:bg-slate-900'>
            <div className='p-4'>{children}</div>
          </main>
        </>
      )}
    </div>
  )
}

export default function SpecialistLayout({ children }: { children: ReactNode }) {
  return (
    <TherapistGameProvider>
      <RoleGuard allowedRoles={['psychologist']}>
        <SelectedPatientProvider>
          <SpecialistContent>{children}</SpecialistContent>
        </SelectedPatientProvider>
      </RoleGuard>
    </TherapistGameProvider>
  )
}
