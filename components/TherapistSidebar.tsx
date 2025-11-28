'use client'

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Home,
  LogOut,
  Menu,
  Moon,
  Sun,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { memo, useState } from 'react'
import { useSidebar } from '@/context/SidebarContext'
import { authClient } from '@/lib/auth-client'

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home, description: 'Painel principal' },
  { path: '/therapist-routine', label: 'Rotina', icon: Calendar, description: 'Gerenciar tarefas' },
  { path: '/reports', label: 'Relatórios', icon: BarChart3, description: 'Documentos e análises' },
  { path: '/financial', label: 'Financeiro', icon: DollarSign, description: 'Gestão financeira' },
] as const

export const TherapistSidebar: React.FC = memo(function TherapistSidebarComponent() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const { isOpen, setIsOpen } = useSidebar()

  const isActive = (path: string): boolean => pathname === path

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/auth/signin')
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <>
      {/* Botão para abrir sidebar quando fechada */}
      {!isOpen && (
        <button
          aria-label='Abrir menu'
          className='hidden lg:flex fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-violet-600/30 transition-all'
          onClick={() => setIsOpen(true)}
          type='button'
        >
          <Menu className='h-5 w-5' />
        </button>
      )}

      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl transition-all duration-300 ${isOpen ? 'lg:w-72' : 'lg:w-0 lg:overflow-hidden'}`}
      >
        {/* Botão para fechar */}
        <div className='flex justify-end p-4'>
          <button
            aria-label='Fechar menu'
            className='p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors'
            onClick={() => setIsOpen(false)}
            type='button'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 py-2 space-y-1'>
          <p className='px-4 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider'>
            Menu Principal
          </p>
          {navItems.map((item) => (
            <Link
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-600/30'
                  : 'hover:bg-white/5'
              }`}
              href={item.path}
              key={item.path}
              prefetch={true}
            >
              <div
                className={`p-2 rounded-lg ${isActive(item.path) ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}
              >
                <item.icon aria-hidden='true' className='h-5 w-5' />
              </div>
              <div className='flex-1'>
                <span className='font-medium block'>{item.label}</span>
                <span
                  className={`text-xs ${isActive(item.path) ? 'text-white/70' : 'text-slate-500'}`}
                >
                  {item.description}
                </span>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isActive(item.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
              />
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className='border-t border-white/10 p-4 space-y-2'>
          <button
            className='flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition-colors'
            onClick={toggleTheme}
            type='button'
          >
            {isDark ? (
              <Sun aria-hidden='true' className='h-5 w-5' />
            ) : (
              <Moon aria-hidden='true' className='h-5 w-5' />
            )}
            <span className='font-medium'>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button
            className='flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors'
            onClick={handleLogout}
            type='button'
          >
            <LogOut aria-hidden='true' className='h-5 w-5' />
            <span className='font-medium'>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
})
