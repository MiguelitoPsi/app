'use client'

import { FeatureGate } from '@/components/FeatureGate'
import TherapistFinancialView from '@/views/TherapistFinancialView'

export default function FinancialPage() {
  return (
    <FeatureGate
      fallback={
        <div className='flex flex-col items-center justify-center gap-4 py-24 text-center'>
          <p className='text-lg font-semibold text-slate-900 dark:text-white'>Módulo Financeiro</p>
          <p className='text-sm text-slate-500'>
            Faça upgrade do seu plano para acessar o módulo financeiro completo.
          </p>
          <a
            className='rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700'
            href='/subscription'
          >
            Ver planos
          </a>
        </div>
      }
      feature='financial_module'
    >
      <TherapistFinancialView />
    </FeatureGate>
  )
}
