'use client'

import { Flame, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { memo, useState } from 'react'
import { useTherapistGame } from '@/context/TherapistGameContext'
import { authClient } from '@/lib/auth-client'

import { getIconByKey } from '@/lib/utils/icon-map'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/therapist-routine', label: 'Rotina', icon: 'routine' },
  { path: '/reports', label: 'Relatórios', icon: 'reports_nav' },
  { path: '/financial', label: 'Financeiro', icon: 'finance' },
  { path: '/achievements', label: 'Conquistas', icon: 'achievements' },
] as const

export const TherapistSidebar: React.FC = memo(function TherapistSidebarComponent() {
  const pathname = usePathname()
  const router = useRouter()
  const { stats, isLoading } = useTherapistGame()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    
    try {
      // Executar logout e limpeza em paralelo para otimizar tempo
      await Promise.all([
        authClient.signOut(),
        fetch('/api/auth/clear-role-cookie', { method: 'POST' }),
      ])
      
      router.push('/auth/signin')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <aside className='fixed left-0 top-0 z-40 h-screen w-20 border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 lg:w-56 dark:border-slate-700 dark:bg-slate-900/95'>
      <div className='flex h-full flex-col'>
        {/* Logo */}
        <div className='flex h-14 items-center justify-center gap-2.5 border-b border-slate-200 px-4 lg:justify-start dark:border-slate-700'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white overflow-hidden p-0.5 shadow-sm'>
            <img src='/logo.jpg' alt='Logo Nepsis' className='h-full w-full object-cover rounded-md' />
          </div>
          <span className='hidden text-base font-bold text-slate-800 lg:block dark:text-white'>
            Nepsis
          </span>
        </div>

        {/* XP Mini Header - Hidden on mobile (shown in top header instead) */}
        <div className='hidden border-b border-slate-200 p-4 lg:block dark:border-slate-700'>
          {isLoading ? (
            <div className='animate-pulse'>
              <div className='mb-2 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700' />
              <div className='h-2 w-full rounded bg-slate-200 dark:bg-slate-700' />
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500'>
                    {stats.rank?.name || 'Terapeuta'}
                  </p>
                  <p className='text-sm font-bold text-slate-800 dark:text-white'>
                    Nível {stats.level}
                  </p>
                </div>
                {stats.currentStreak >= 3 && (
                  <span
                    className='flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400'
                    title={`${stats.currentStreak} dias consecutivos`}
                  >
                    <Flame className='h-3.5 w-3.5' />
                    {stats.currentStreak}
                  </span>
                )}
              </div>
              <div>
                <div className='mb-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400'>
                  <span>{stats.experience} XP</span>
                  <span>{stats.xpToNextLevel} para subir</span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-500'
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className='flex-1 space-y-1 p-3'>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 lg:justify-start ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
                href={item.path}
                key={item.path}
                title={item.label}
              >
                <span className='shrink-0'>
                  {(() => {
                    const Icon = getIconByKey(item.icon)
                    return <Icon className='h-5 w-5' />
                  })()}
                </span>
                <span className='hidden lg:block'>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Card promocional */}
        <div className='hidden p-3 lg:block'>
          <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 dark:from-sky-900/20 dark:to-purple-900/20'>
            {/* Decoração */}
            <div className='absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-200/50 dark:bg-sky-700/20' />
            <div className='absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-purple-200/50 dark:bg-purple-700/20' />

            <div className='relative'>
              <div className='mb-2 flex items-center gap-1.5'>
                <Sparkles className='h-4 w-4 text-sky-600 dark:text-sky-400' />
                <span className='text-xs font-semibold text-sky-700 dark:text-sky-300'>
                  Dica do dia
                </span>
              </div>
              <p className='text-xs text-slate-600 dark:text-slate-400'>
                Complete suas tarefas para ganhar XP e subir de nível!
              </p>
            </div>

            {/* Mascote */}
            <div className='mt-3 flex justify-center'>
              <Image
                alt='Mascote meditando'
                className='h-16 w-16 object-contain opacity-80'
                height={64}
                src='/mascote/meditando.png'
                width={64}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='space-y-1 border-t border-slate-200 p-3 dark:border-slate-700'>
          <Link
            className='flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:justify-start dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            href='/settings'
            title='Configurações'
          >
            <span className='shrink-0'>
              {(() => {
                const Icon = getIconByKey('settings')
                return <Icon className='h-5 w-5' />
              })()}
            </span>
            <span className='hidden lg:block'>Configurações</span>
          </Link>
          <button
            className='flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:justify-start dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white disabled:opacity-70 disabled:cursor-not-allowed'
            onClick={handleLogout}
            title='Sair'
            type='button'
            disabled={isLoggingOut}
          >
            <span className='shrink-0'>
              {isLoggingOut ? (
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-transparent dark:border-slate-400' />
              ) : (
                (() => {
                  const Icon = getIconByKey('logout')
                  return <Icon className='h-5 w-5' />
                })()
              )}
            </span>
            <span className='hidden lg:block'>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
})

