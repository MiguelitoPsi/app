'use client'

import type { ReactNode } from 'react'
import { RoleGuard } from '@/components/RoleGuard'
import { TherapistBottomNav } from '@/components/TherapistBottomNav'
import { TherapistSidebar } from '@/components/TherapistSidebar'
import { GameProvider } from '@/context/GameContext'
import { SelectedPatientProvider } from '@/context/SelectedPatientContext'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function SpecialistContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-colors duration-300 dark:from-slate-900 dark:to-slate-800'>
      {/* Desktop Sidebar - hidden on mobile */}
      <TherapistSidebar />

      {/* Main content - with left margin on desktop for sidebar (72 = 18rem = 288px) */}
      <main
        className={`min-h-screen pb-24 lg:pb-0 transition-all duration-300 ${isOpen ? 'lg:pl-72' : 'lg:pl-0'}`}
      >
        {children}
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <TherapistBottomNav />
    </div>
  )
}

export default function SpecialistLayout({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <RoleGuard allowedRoles={['psychologist']}>
        <SelectedPatientProvider>
          <SidebarProvider>
            <SpecialistContent>{children}</SpecialistContent>
          </SidebarProvider>
        </SelectedPatientProvider>
      </RoleGuard>
    </GameProvider>
  )
}
