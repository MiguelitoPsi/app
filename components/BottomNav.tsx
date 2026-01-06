'use client'

import { Calendar, Gift, Home, Plus, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { useSound } from '@/hooks/useSound'

export const BottomNav: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { playNavigation } = useSound()

  const isActive = (path: string) => pathname === path

  const navItemClass = (path: string) => `
    relative flex flex-col items-center justify-center w-full h-full space-y-1
    ${
      isActive(path)
        ? 'text-sky-600 dark:text-sky-400'
        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }
    transition-all duration-300 group
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 rounded-lg
  `

  const _activeIndicator = (
    <span
      aria-hidden='true'
      className='-top-3 fade-in zoom-in absolute h-1 w-8 animate-in rounded-b-full bg-sky-600 shadow-[0_2px_8px_rgba(14,165,233,0.5)] duration-300 dark:bg-sky-400 dark:shadow-[0_2px_8px_rgba(56,189,248,0.3)]'
    />
  )

  return (
    <nav
      aria-label='Navegação principal'
      className='fixed right-0 bottom-0 left-0 z-50 mx-auto h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-w-md rounded-t-[2rem] border-slate-100 border-t bg-white/95 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors duration-300 sm:px-6 dark:border-slate-800 dark:bg-slate-900/95'
    >
      <div className='relative flex h-full items-center justify-between'>
        {/* Home */}
        <button
          aria-current={isActive('/home') ? 'page' : undefined}
          aria-label='Ir para página inicial'
          className={navItemClass('/home')}
          onClick={() => {
            playNavigation()
            router.push('/home')
          }}
          type='button'
        >
          <div
            aria-hidden='true'
            className={`touch-target flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
              isActive('/home') ? 'bg-sky-50 dark:bg-sky-900/20' : ''
            }`}
          >
            <Home
              className='transition-transform duration-300 group-active:scale-90'
              size={22}
              strokeWidth={isActive('/home') ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 sm:text-[11px] ${
              isActive('/home') ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'
            }`}
          >
            Início
          </span>
        </button>

        {/* Routine */}
        <button
          aria-current={isActive('/routine') ? 'page' : undefined}
          aria-label='Ir para rotina de tarefas'
          className={navItemClass('/routine')}
          onClick={() => {
            playNavigation()
            router.push('/routine')
          }}
          type='button'
        >
          <div
            aria-hidden='true'
            className={`touch-target flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
              isActive('/routine') ? 'bg-sky-50 dark:bg-sky-900/20' : ''
            }`}
          >
            <Calendar
              className='transition-transform duration-300 group-active:scale-90'
              size={22}
              strokeWidth={isActive('/routine') ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 sm:text-[11px] ${
              isActive('/routine') ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'
            }`}
          >
            Rotina
          </span>
        </button>

        {/* Central Floating Action Button */}
        <div className='-top-6 group relative sm:-top-8'>
          <div
            aria-hidden='true'
            className='absolute inset-0 rounded-full bg-sky-500 opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-50'
          />
          <button
            aria-label={
              pathname === '/routine'
                ? 'Adicionar nova tarefa'
                : pathname === '/rewards'
                  ? 'Adicionar nova recompensa'
                  : 'Abrir diário de pensamentos'
            }
            className='hover:-translate-y-1 relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sky-300/50 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 sm:h-16 sm:w-16 dark:border-slate-900 dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4'
            onClick={() => {
              playNavigation()
              // Context-aware action based on current page
              if (pathname === '/routine') {
                // Dispatch event to toggle add task form in RoutineView
                window.dispatchEvent(new CustomEvent('toggleRoutineAdd'))
              } else if (pathname === '/rewards') {
                // Dispatch event to toggle add reward form in RewardsView
                window.dispatchEvent(new CustomEvent('toggleRewardsAdd'))
              } else {
                // Default action: open journal
                router.push('/journal')
              }
            }}
            type='button'
          >
            <Plus aria-hidden='true' className='sm:hidden' size={28} strokeWidth={2.5} />
            <Plus aria-hidden='true' className='hidden sm:block' size={32} strokeWidth={2.5} />
            <span className='sr-only'>
              {pathname === '/routine'
                ? 'Nova tarefa'
                : pathname === '/rewards'
                  ? 'Nova recompensa'
                  : 'Novo registro no diário'}
            </span>
          </button>
        </div>

        {/* Rewards */}
        <button
          aria-current={isActive('/rewards') ? 'page' : undefined}
          aria-label='Ir para loja de prêmios'
          className={navItemClass('/rewards')}
          onClick={() => {
            playNavigation()
            router.push('/rewards')
          }}
          type='button'
        >
          <div
            aria-hidden='true'
            className={`touch-target flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
              isActive('/rewards') ? 'bg-sky-50 dark:bg-sky-900/20' : ''
            }`}
          >
            <Gift
              className='transition-transform duration-300 group-active:scale-90'
              size={22}
              strokeWidth={isActive('/rewards') ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 sm:text-[11px] ${
              isActive('/rewards') ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'
            }`}
          >
            Prêmios
          </span>
        </button>

        {/* Profile */}
        <button
          aria-current={isActive('/profile') ? 'page' : undefined}
          aria-label='Ir para seu perfil'
          className={navItemClass('/profile')}
          onClick={() => {
            playNavigation()
            router.push('/profile')
          }}
          type='button'
        >
          <div
            aria-hidden='true'
            className={`touch-target flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
              isActive('/profile') ? 'bg-sky-50 dark:bg-sky-900/20' : ''
            }`}
          >
            <User
              className='transition-transform duration-300 group-active:scale-90'
              size={22}
              strokeWidth={isActive('/profile') ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 sm:text-[11px] ${
              isActive('/profile') ? 'translate-y-0 opacity-100' : 'hidden translate-y-2 opacity-0'
            }`}
          >
            Perfil
          </span>
        </button>
      </div>
    </nav>
  )
}

