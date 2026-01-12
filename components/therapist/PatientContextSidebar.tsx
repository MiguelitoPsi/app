'use client'

import {
  Calendar,
  CreditCard,
  FileText,
  Home,
  Settings,
  User,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const tabs = [
  { id: 'principal', label: 'Principal', icon: Home },
  { id: 'cadastro', label: 'Cadastro', icon: User },
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'sessoes', label: 'Sessões', icon: Video },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'recursos', label: 'Recursos', icon: Users },
  { id: 'preferencias', label: 'Preferências', icon: Settings },
]

interface PatientContextSidebarProps {
  patientName: string
  patientInitials: string
  onBack: () => void
}

export const PatientContextSidebar: React.FC<PatientContextSidebarProps> = ({
  patientName,
  patientInitials,
  onBack,
}) => {
  const pathname = usePathname()
  const patientId = pathname.split('/').pop()

  return (
    <aside className='w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'>
      <div className='flex flex-col h-full'>
        {/* Back Button */}
        <div className='border-b border-slate-200 p-4 dark:border-slate-700'>
          <button
            className='flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            onClick={onBack}
          >
            <Home className='h-4 w-4' />
            Voltar ao Painel
          </button>
        </div>

        {/* Profile */}
        <div className='border-b border-slate-200 p-4 dark:border-slate-700'>
          <div className='flex flex-col items-center text-center'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-xl font-bold text-white'>
              {patientInitials}
            </div>
            <h2 className='mt-3 font-semibold text-slate-800 dark:text-white'>
              {patientName}
            </h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className='flex-1 overflow-y-auto p-2'>
          <ul className='space-y-1'>
            {tabs.map((tab) => {
              const isActive = pathname.includes(tab.id)
              return (
                <li key={tab.id}>
                  <Link
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? 'bg-sky-100 text-sky-700 font-medium dark:bg-sky-900/30 dark:text-sky-400'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                    href={`/patients/${patientId}/${tab.id}`}
                  >
                    <tab.icon className='h-4 w-4' strokeWidth={1.5} />
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default PatientContextSidebar
