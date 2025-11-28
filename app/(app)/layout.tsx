'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import AchievementManager from '@/components/AchievementManager'
import { BottomNav } from '@/components/BottomNav'
import LevelUpManager from '@/components/LevelUpManager'
import { RoleGuard } from '@/components/RoleGuard'
import { SkipLink } from '@/components/SkipLink'
import { SuspendedAccountModal } from '@/components/SuspendedAccountModal'
import { GameProvider, RANKS, useGame } from '@/context/GameContext'

function AppHeader() {
  const { stats } = useGame()
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate current rank based on level
  const currentRank = useMemo(() => {
    const rank = [...RANKS].reverse().find((r) => stats.level >= r.level)
    return rank ?? RANKS[0]
  }, [stats.level])

  // Calculate XP progress within current level
  const xpProgress = stats.xp % 100
  const xpToNext = 100 - xpProgress

  return (
    <header className='relative z-10   pt-safe  '>
      <div
        className={`px-4 transition-all duration-300 sm:px-6 ${
          isScrolled ? 'pb-3 pt-3 sm:pb-4 sm:pt-4' : 'pb-4 sm:pb-6'
        }`}
      >
        <section
          aria-label='Seu progresso'
          className='rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6'
        >
          <div className='mb-3 flex items-center justify-between sm:mb-4'>
            <div>
              <p className='font-medium text-xs text-violet-100 sm:text-sm'>
                {stats.name || 'Carregando...'}
              </p>
              <h2 className='font-bold text-xl sm:text-2xl'>{currentRank.name}</h2>
            </div>
            <div className='text-right'>
              <p className='text-xs text-violet-100 sm:text-sm'>Nível {stats.level}</p>
              <p className='font-bold text-xl sm:text-2xl'>
                {stats.xp} XP
                <span className='sr-only'> pontos de experiência</span>
              </p>
            </div>
          </div>
          <div
            aria-label='Progresso para o próximo nível'
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={xpProgress}
            className='h-2.5 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm sm:h-3'
            role='progressbar'
          >
            <div
              className='h-full rounded-full bg-white transition-all duration-500'
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className='mt-2 text-sm text-violet-100'>{xpToNext} XP para o próximo nível</p>
        </section>
      </div>
    </header>
  )
}

function AppLayoutContent({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['patient']}>
      <SuspendedAccountModal />
      <SkipLink />
      <LevelUpManager />
      <AchievementManager />
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-colors duration-300 dark:from-slate-900 dark:to-slate-800'>
        <div className='mx-auto flex h-screen max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950'>
          <AppHeader />
          <main className='flex-1 overflow-y-auto' id='main-content'>
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </RoleGuard>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </GameProvider>
  )
}
