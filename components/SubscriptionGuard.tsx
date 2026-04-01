'use client'

import { RiAlertLine, RiCoinLine, RiVipCrownLine } from '@remixicon/react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'

interface SubscriptionGuardProps {
  children: React.ReactNode
  /** If true, renders content in read-only mode instead of showing paywall */
  readOnlyMode?: boolean
}

/**
 * Wraps content requiring an active subscription.
 * Shows paywall when subscription is expired/missing, or an overlay in read-only mode.
 */
export function SubscriptionGuard({ children, readOnlyMode = true }: SubscriptionGuardProps) {
  const { isActive, isExpired, hasSubscription, isLoading } = useSubscription()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600' />
      </div>
    )
  }

  // Active subscription — render normally
  if (isActive) {
    return <>{children}</>
  }

  // Read-only mode — render content with overlay
  if (readOnlyMode && hasSubscription) {
    return (
      <div className='relative'>
        <div className='pointer-events-none select-none opacity-60'>{children}</div>
        <div className='absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-40'>
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border border-amber-200 dark:border-amber-800'>
            <div className='mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4'>
              <RiAlertLine className='w-7 h-7 text-amber-600' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-2'>
              Assinatura expirada
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-6 text-sm'>
              Sua assinatura expirou. Seus dados estão seguros, mas você não pode fazer alterações.
              Renove para continuar utilizando todas as funcionalidades.
            </p>
            <button
              className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2'
              onClick={() => router.push('/subscription')}
              type='button'
            >
              <RiCoinLine className='w-5 h-5' />
              Renovar assinatura
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No subscription at all — show full paywall
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] p-6'>
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border border-indigo-100 dark:border-indigo-900'>
        <div className='mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6'>
          <RiVipCrownLine className='w-8 h-8 text-indigo-600' />
        </div>
        <h2 className='text-2xl font-bold text-slate-900 dark:text-white mb-3'>
          Escolha seu plano
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-8'>
          Para acessar as funcionalidades da plataforma, é necessário assinar um dos nossos planos.
          Escolha o que melhor se adapta à sua necessidade.
        </p>
        <button
          className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2'
          onClick={() => router.push('/subscription')}
          type='button'
        >
          <RiVipCrownLine className='w-5 h-5' />
          Ver planos disponíveis
        </button>
      </div>
    </div>
  )
}
