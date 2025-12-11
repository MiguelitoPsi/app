'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { RoleGuard } from '@/components/RoleGuard'
import { GameProvider } from '@/context/GameContext'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Usuários', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Assinaturas', icon: '💳' },
  { href: '/admin/terms', label: 'Termos', icon: '📄' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' })
      // Limpar o cookie de role via API
      await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <GameProvider>
      <RoleGuard allowedRoles={['admin']}>
        <div className='flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800'>
          {/* Mobile Header */}
          <div className='fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/95 px-4 backdrop-blur lg:hidden'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600'>
                <span className='text-lg'>🛡️</span>
              </div>
              <span className='font-bold text-white'>Admin Panel</span>
            </div>
            <button
              className='rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white'
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              type='button'
            >
              {isSidebarOpen ? (
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <title>Close sidebar</title>
                  <path
                    d='M6 18L18 6M6 6l12 12'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                </svg>
              ) : (
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <title>Open sidebar</title>
                  <path
                    d='M4 6h16M4 12h16M4 18h16'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden'
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-slate-700 bg-slate-900/95 backdrop-blur transition-transform duration-200 lg:translate-x-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className='flex h-full flex-col'>
              {/* Logo (Desktop) */}
              <div className='hidden h-16 items-center gap-3 border-b border-slate-700 px-6 lg:flex'>
                <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600'>
                  <span className='text-lg'>🛡️</span>
                </div>
                <span className='font-bold text-white'>Admin Panel</span>
              </div>

              {/* Mobile Close Button Header */}
              <div className='flex h-16 items-center justify-between border-b border-slate-700 px-4 lg:hidden'>
                <span className='font-bold text-white'>Menu</span>
                <button
                  className='rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white'
                  onClick={() => setIsSidebarOpen(false)}
                  type='button'
                >
                  <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <title>Close menu</title>
                    <path
                      d='M6 18L18 6M6 6l12 12'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation */}
              <nav className='flex-1 space-y-1 p-4'>
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                      href={item.href}
                      key={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className='border-t border-slate-700 p-4'>
                <button
                  className='flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white'
                  onClick={handleLogout}
                  type='button'
                >
                  <span>🚪</span>
                  Sair
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className='flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8'>{children}</main>
        </div>
      </RoleGuard>
    </GameProvider>
  )
}
