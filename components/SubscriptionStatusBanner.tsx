'use client'

import { RiAlertLine, RiCloseLine, RiCoinLine, RiIdCardLine } from '@remixicon/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'

/**
 * Banner shown at the top of the therapist layout when subscription is past_due.
 * Can be temporarily dismissed but reappears on page navigation.
 */
export function SubscriptionStatusBanner() {
  const { data, isPastDue, isExpired, hasSubscription } = useSubscription()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (!hasSubscription) return null

  if (isPastDue) {
    const daysRemaining = data?.status === 'past_due' ? data.daysRemaining : 0

    return (
      <div className='bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3'>
        <div className='flex items-center justify-between max-w-7xl mx-auto'>
          <div className='flex items-center gap-3'>
            <RiAlertLine className='w-5 h-5 text-amber-600 shrink-0' />
            <p className='text-sm text-amber-800 dark:text-amber-200'>
              <span className='font-semibold'>Pagamento pendente.</span>{' '}
              {daysRemaining > 0
                ? `Você tem ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} para regularizar.`
                : 'Regularize seu pagamento para manter o acesso.'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              className='bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5'
              onClick={() => router.push('/subscription')}
              type='button'
            >
              <RiCoinLine className='w-4 h-4' />
              Regularizar
            </button>
            <button
              aria-label='Fechar aviso'
              className='text-amber-600 hover:text-amber-800 p-1'
              onClick={() => setDismissed(true)}
              type='button'
            >
              <RiCloseLine className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className='bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3'>
        <div className='flex items-center justify-between max-w-7xl mx-auto'>
          <div className='flex items-center gap-3'>
            <RiAlertLine className='w-5 h-5 text-red-600 shrink-0' />
            <p className='text-sm text-red-800 dark:text-red-200'>
              <span className='font-semibold'>Assinatura expirada.</span> Você está no modo leitura.
              Renove para voltar a utilizar a plataforma.
            </p>
          </div>
          <button
            className='bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5'
            onClick={() => router.push('/subscription')}
            type='button'
          >
            <RiIdCardLine className='w-4 h-4' />
            Renovar
          </button>
        </div>
      </div>
    )
  }

  return null
}
