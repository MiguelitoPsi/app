'use client'

import { Building2, LogOut, Settings, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

type TabId = 'profile' | 'clinic' | 'account'

type SettingsSidebarProps = {
  activeTab: TabId
  onTabChangeAction?: (tab: TabId) => void
  onTabChange?: (tab: TabId) => void
}

export function SettingsSidebar({
  activeTab,
  onTabChangeAction,
  onTabChange,
}: SettingsSidebarProps) {
  const handleTabChange = onTabChangeAction || onTabChange
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const menuItems = [
    {
      id: 'profile' as const,
      label: 'Perfil Profissional',
      icon: UserCircle,
    },
    {
      id: 'clinic' as const,
      label: 'Dados da Clínica',
      icon: Building2,
    },
    {
      id: 'account' as const,
      label: 'Conta',
      icon: Settings,
    },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await Promise.all([
        authClient.signOut(),
        fetch('/api/auth/clear-role-cookie', {
          method: 'POST',
        }),
      ])
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className='flex h-full flex-col justify-between space-y-4'>
      <nav className='space-y-2'>
        {menuItems.map((item) => (
          <button
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
            key={item.id}
            onClick={() => handleTabChange?.(item.id)}
            type='button'
          >
            <item.icon
              className={
                activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }
              size={20}
            />
            {item.label}
          </button>
        ))}
      </nav>

      <div className='border-t border-slate-100 pt-4 dark:border-slate-800'>
        <button
          className='flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20'
          disabled={isLoggingOut}
          onClick={handleLogout}
          type='button'
        >
          {isLoggingOut ? (
            <>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent' />
              Saindo...
            </>
          ) : (
            <>
              <LogOut size={18} /> Sair da conta
            </>
          )}
        </button>
      </div>
    </div>
  )
}
