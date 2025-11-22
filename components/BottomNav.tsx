'use client'

import { Calendar, Gift, Home, Plus, User } from 'lucide-react'
import type React from 'react'
import { Tab } from '../types'

type BottomNavProps = {
  currentTab: Tab
  onTabChange: (tab: Tab) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItemClass = (tab: Tab) => `
    relative flex flex-col items-center justify-center w-full h-full space-y-1
    ${currentTab === tab ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
    transition-all duration-300 group
  `

  const activeIndicator = (
    <span className='-top-3 fade-in zoom-in absolute h-1 w-8 animate-in rounded-b-full bg-violet-600 shadow-[0_2px_8px_rgba(139,92,246,0.5)] duration-300 dark:bg-violet-400 dark:shadow-[0_2px_8px_rgba(167,139,250,0.3)]' />
  )

  return (
    <div className='fixed right-0 bottom-0 left-0 z-50 mx-auto h-[5.5rem] max-w-md rounded-t-[2rem] border-slate-100 border-t bg-white/90 px-6 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90'>
      <div className='relative flex h-full items-center justify-between'>
        <button className={navItemClass(Tab.HOME)} onClick={() => onTabChange(Tab.HOME)}>
          {currentTab === Tab.HOME && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${currentTab === Tab.HOME ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
          >
            <Home
              className='transition-transform duration-300 group-active:scale-90'
              size={24}
              strokeWidth={currentTab === Tab.HOME ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${currentTab === Tab.HOME ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'}`}
          >
            Início
          </span>
        </button>

        <button className={navItemClass(Tab.ROUTINE)} onClick={() => onTabChange(Tab.ROUTINE)}>
          {currentTab === Tab.ROUTINE && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${currentTab === Tab.ROUTINE ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
          >
            <Calendar
              className='transition-transform duration-300 group-active:scale-90'
              size={24}
              strokeWidth={currentTab === Tab.ROUTINE ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${currentTab === Tab.ROUTINE ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'}`}
          >
            Rotina
          </span>
        </button>

        {/* Central Floating Action Button */}
        <div className='-top-8 group relative'>
          <div className='absolute inset-0 rounded-full bg-violet-600 opacity-40 blur-lg transition-opacity duration-300 group-hover:opacity-60' />
          <button
            className='hover:-translate-y-1 relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-violet-300/50 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-slate-900 dark:shadow-none'
            onClick={() => onTabChange(Tab.ADD)}
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>

        <button className={navItemClass(Tab.REWARDS)} onClick={() => onTabChange(Tab.REWARDS)}>
          {currentTab === Tab.REWARDS && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${currentTab === Tab.REWARDS ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
          >
            <Gift
              className='transition-transform duration-300 group-active:scale-90'
              size={24}
              strokeWidth={currentTab === Tab.REWARDS ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${currentTab === Tab.REWARDS ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'}`}
          >
            Prêmios
          </span>
        </button>

        <button className={navItemClass(Tab.PROFILE)} onClick={() => onTabChange(Tab.PROFILE)}>
          {currentTab === Tab.PROFILE && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${currentTab === Tab.PROFILE ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
          >
            <User
              className='transition-transform duration-300 group-active:scale-90'
              size={24}
              strokeWidth={currentTab === Tab.PROFILE ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${currentTab === Tab.PROFILE ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'}`}
          >
            Perfil
          </span>
        </button>
      </div>
    </div>
  )
}
