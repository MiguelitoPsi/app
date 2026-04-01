'use client'

import type React from 'react'
import { useState } from 'react'
import { ProfileView } from './app/(app)/pacient/profile/ProfileView'
import { RewardsView } from './app/(app)/rewards/RewardsView'
import { RoutineView } from './app/(app)/routine/RoutineView'
import { BottomNav } from './components/BottomNav'
import { GameProvider, useGame } from './context/GameContext'
import { Tab } from './types'

import { JournalView } from './views/JournalView'
import { MeditationView } from './views/MeditationView'

const AppContent = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME)
  const { stats } = useGame()

  const renderView = () => {
    switch (currentTab) {
      case Tab.MEDITATION:
        return <MeditationView goHome={() => setCurrentTab(Tab.HOME)} />
      case Tab.ADD:
        // Journal view is the main "Add" action
        return <JournalView goHome={() => setCurrentTab(Tab.HOME)} />
      case Tab.ROUTINE:
        return <RoutineView />
      case Tab.REWARDS:
        return <RewardsView />
      case Tab.PROFILE:
        return <ProfileView onNavigate={setCurrentTab} />
      default:
        return <RoutineView />
    }
  }

  return (
    <div
      className={`${stats.theme} flex h-screen w-full justify-center overflow-hidden bg-slate-100 transition-colors duration-500 dark:bg-black`}
    >
      {/* Mobile-first container limiting width on desktop */}
      <div className='relative flex h-full w-full max-w-md flex-col overflow-hidden bg-slate-50 shadow-2xl transition-colors duration-300 dark:bg-slate-950'>
        <main className='relative h-full flex-1 overflow-hidden'>{renderView()}</main>

        {/* Bottom nav always visible for patients */}
        <BottomNav />
      </div>
    </div>
  )
}

const App: React.FC = () => (
  <GameProvider>
    <AppContent />
  </GameProvider>
)

export default App
