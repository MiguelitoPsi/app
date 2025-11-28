'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { memo } from 'react'
import { authClient } from '@/lib/auth-client'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/therapist-routine', label: 'Rotina', icon: '📅' },
  { path: '/reports', label: 'Relatórios', icon: '📈' },
  { path: '/financial', label: 'Financeiro', icon: '💰' },
] as const

export const TherapistSidebar: React.FC = memo(function TherapistSidebarComponent() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      // Limpar o cookie de role via API
      await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <aside className='fixed left-0 top-0 z-40 hidden h-screen w-48 border-r border-slate-700 bg-slate-900/95 backdrop-blur lg:block'>
      <div className='flex h-full flex-col'>
        {/* Logo */}
        <div className='flex h-12 items-center gap-2 border-b border-slate-700 px-3'>
          <div className='flex h-7 w-7 items-center justify-center rounded-md bg-violet-600'>
            <span className='text-sm'>🧠</span>
          </div>
          <span className='text-sm font-bold text-white'>Terapeuta</span>
        </div>

        {/* Navigation */}
        <nav className='flex-1 space-y-0.5 p-2'>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                href={item.path}
                key={item.path}
              >
                <span className='text-sm'>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className='border-t border-slate-700 p-2'>
          <button
            className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white'
            onClick={handleLogout}
            type='button'
          >
            <span className='text-sm'>🚪</span>
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
})
