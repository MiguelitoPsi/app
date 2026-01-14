'use client'

import { useState } from 'react'
import { AccountSection } from './components/AccountSection'
import { SettingsProfileForm } from './components/SettingsProfileForm'
import { SettingsSidebar } from './components/SettingsSidebar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'account'>('profile')

  return (
    <div className='flex min-h-full flex-col lg:flex-row px-2 sm:px-4 lg:px-6 pt-6 gap-4 lg:gap-8'>
      {/* Left Column (Menu & Header) - Approx 30% */}
      <aside className='shrink-0 lg:w-[280px] xl:w-[320px]'>
        <div className='sticky top-6 space-y-6'>
          {/* Header moved here */}
          <div>
            <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Perfil</h2>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              Gerencie suas preferências e conta
            </p>
          </div>
          
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </aside>

      {/* Right Column (Content) - Rest (Approx 70%) */}
      <main className='flex-1 pb-10 lg:pb-0'>
        <div className='mx-auto max-w-3xl lg:max-w-none'>
          {activeTab === 'profile' && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-300'>
              <div className='mb-6'>
                <h3 className='text-2xl font-bold text-slate-800 dark:text-white'>
                  Perfil Profissional
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Seus dados pessoais e profissionais
                </p>
              </div>
              <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <SettingsProfileForm activeTab='profile' />
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-300'>
              <div className='mb-6'>
                <h3 className='text-2xl font-bold text-slate-800 dark:text-white'>
                  Dados da Clínica
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Localização e informações de atendimento
                </p>
              </div>
              <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <SettingsProfileForm activeTab='clinic' />
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-300'>
              <div className='mb-6'>
                <h3 className='text-2xl font-bold text-slate-800 dark:text-white'>
                  Configurações da Conta
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Segurança e preferências do sistema
                </p>
              </div>
              <AccountSection />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
