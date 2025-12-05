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

      {/* Desktop Sidebar - hidden on mobile (w-56 = 224px) */}
      <TherapistSidebar />

      {/* XP Header - visible on mobile, hidden on desktop (sidebar shows XP there) */}
      <div className='lg:hidden'>
        <TherapistHeader />
      </div>

      {/* Main content - with left margin for sidebar (56 = 14rem = 224px) and right margin for profile card on xl: */}
      <main className='min-h-screen bg-slate-50 pb-24 transition-colors duration-300 lg:ml-56 lg:pb-0  dark:bg-transparent'>
        {children}
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <TherapistBottomNav />
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
