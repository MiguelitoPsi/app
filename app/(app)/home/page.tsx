'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Tab } from '@/types'
import { HomeView } from '@/views/HomeView'
import { JournalView } from '@/views/JournalView'
import { MeditationView } from '@/views/MeditationView'
import { ProfileView } from '@/views/ProfileView'
import { RewardsView } from '@/views/RewardsView'
import { RoutineView } from '@/views/RoutineView'
import { TherapistView } from '@/views/TherapistView'

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className='flex h-screen items-center justify-center bg-white dark:bg-slate-950'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent' />
      </div>
    )
  }

  const renderContent = () => {
    switch (currentTab) {
      case Tab.HOME:
        return <HomeView changeTab={setCurrentTab} />
      case Tab.ROUTINE:
        return <RoutineView />
      case Tab.ADD:
        return <JournalView goHome={() => setCurrentTab(Tab.HOME)} />
      case Tab.REWARDS:
        return <RewardsView />
      case Tab.PROFILE:
        return <ProfileView onNavigate={setCurrentTab} />
      case Tab.MEDITATION:
        return <MeditationView onComplete={() => setCurrentTab(Tab.HOME)} />
      case Tab.THERAPIST:
        return <TherapistView />
      default:
        return <HomeView changeTab={setCurrentTab} />
    }
  }

  return (
    <>
      <div className='h-full w-full'>{renderContent()}</div>
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </>
  )
}
