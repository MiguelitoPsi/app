'use client'

import type { ReactNode } from 'react'
import { RoleGuard } from '@/components/RoleGuard'
import { GameProvider } from '@/context/GameContext'

export default function SpecialistLayout({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <RoleGuard allowedRoles={['psychologist', 'admin']} fallbackPath='/home'>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-colors duration-300 dark:from-slate-900 dark:to-slate-800'>
          <main className='min-h-screen'>{children}</main>
        </div>
      </RoleGuard>
    </GameProvider>
  )
}
