'use client'

import type { ReactNode } from 'react'
import { RoleGuard } from '@/components/RoleGuard'
import { TherapistBottomNav } from '@/components/TherapistBottomNav'
import { TherapistHeader } from '@/components/TherapistHeader'
import { TherapistLevelUpManager } from '@/components/TherapistLevelUpManager'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistSidebar } from '@/components/TherapistSidebar'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { TherapistXPGainToast } from '@/components/TherapistXPGainToast'
import { SelectedPatientProvider } from '@/context/SelectedPatientContext'
import { TherapistGameProvider } from '@/context/TherapistGameContext'
import { trpc } from '@/lib/trpc/client'

function SpecialistContent({ children }: { children: ReactNode }) {
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

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 transition-colors duration-300 dark:from-slate-900 dark:to-slate-800'>
      {/* Terms Modal - shown first */}
      <TherapistTermsModal isOpen={showTerms} />

      {/* Profile Modal - shown after terms are accepted */}
      <TherapistProfileModal isOpen={showProfile} mode='create' />

      {/* Level Up Manager - shows modal on level up */}
      <TherapistLevelUpManager />

      {/* XP Gain Toast - floating notifications */}
      <TherapistXPGainToast />

      {/* Desktop Sidebar - visible on all screens now (slim on mobile) */}
      <TherapistSidebar />

      {/* XP Header - visible on mobile, hidden on desktop (sidebar shows XP there) */}
      <div className='lg:hidden ml-20 transition-all duration-300'>
        <TherapistHeader />
      </div>

      {/* Main content - with left margin for sidebar (20 = 5rem = 80px on mobile, 56 = 14rem = 224px on desktop) */}
      <main className='min-h-screen bg-slate-100 pb-8 transition-all duration-300 ml-20 lg:ml-56 lg:pb-0 dark:bg-transparent'>
        {children}
      </main>
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
