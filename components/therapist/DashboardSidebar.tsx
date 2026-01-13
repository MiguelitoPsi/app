'use client'

import {
  Bell,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Megaphone,

  Sparkles,
  User,
  Users,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

const navItems = [
  { path: '/dashboard', label: 'Painel', icon: Home },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/therapist-routine', label: 'Agenda', icon: Calendar },
  { path: '/financial', label: 'Financeiro', icon: DollarSign },
  { path: '/reports', label: 'Relatórios', icon: FileText },
]

export const DashboardSidebar: React.FC = () => {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)

  const { user } = useAuth()

  return (
    <aside className='fixed left-0 top-0 z-40 h-screen w-16 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 overflow-hidden'>
      <div className='flex h-full flex-col'>
        {/* Logo */}
        <div className='flex h-16 items-center justify-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0'>
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-cover"
          />
        </div>

        {/* Navigation */}
        <nav className='flex-1 space-y-1 p-2 overflow-y-auto'>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link
                className={`flex items-center justify-center gap-2 rounded-lg p-2.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
                href={item.path}
                key={item.path}
                title={item.label}
              >
                <item.icon className='h-5 w-5' strokeWidth={1.5} />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className='border-t border-slate-200 p-2 dark:border-slate-700 flex-shrink-0 space-y-1'>
          {/* Upgrade Button */}
          <Link
            className='flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 p-2.5 text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-md'
            href='/upgrade'
            title='Assinar'
          >
            <Sparkles className='h-5 w-5' strokeWidth={1.5} />
          </Link>

          {/* Video */}
          <Link
            className='flex items-center justify-center gap-2 rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            href='/videos'
            title='Vídeos'
          >
            <Video className='h-5 w-5' strokeWidth={1.5} />
          </Link>

          {/* Notifications */}
          <div className='relative'>
            <button
              className='flex w-full items-center justify-center gap-2 rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              onClick={() => setShowNotifications(!showNotifications)}
              title='Notificações'
            >
              <Bell className='h-5 w-5' strokeWidth={1.5} />
              <span className='absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500' />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className='absolute left-full top-0 ml-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800'>
                <div className='border-b border-slate-100 p-3 dark:border-slate-700'>
                  <h3 className='font-semibold text-slate-800 dark:text-white'>Notificações</h3>
                </div>
                <div className='p-3'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Nenhuma notificação nova
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <Link
            className='mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-sky-500 transition-all hover:ring-2 hover:ring-sky-500/30'
            href='/settings'
          >
            {user?.image ? (
              <Image
                alt={`Foto de perfil de ${user.name}`}
                className='h-full w-full object-cover'
                height={36}
                src={user.image}
                width={36}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white'>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
          </Link>


        </div>
      </div>
    </aside>
  )
}

export default DashboardSidebar
