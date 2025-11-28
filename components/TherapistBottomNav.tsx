'use client'

import { BarChart3, Calendar, DollarSign, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { memo } from 'react'

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/therapist-routine', label: 'Rotina', icon: Calendar },
  { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  { path: '/financial', label: 'Financeiro', icon: DollarSign },
] as const

export const TherapistBottomNav: React.FC = memo(function TherapistBottomNavComponent() {
  const pathname = usePathname()

  const isActive = (path: string): boolean => pathname === path

  // Hide on large screens (desktop) - sidebar takes over
  return (
    <nav className='fixed right-0 bottom-0 left-0 z-50 mx-auto h-20 max-w-md rounded-t-2xl border-slate-200 border-t bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 lg:hidden'>
      <div className='flex h-full items-center justify-around px-4'>
        {navItems.map((item) => (
          <Link
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              isActive(item.path)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            href={item.path}
            key={item.path}
            prefetch={true}
          >
            <item.icon aria-hidden='true' className='h-6 w-6' />
            <span className='font-medium text-xs'>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
})
