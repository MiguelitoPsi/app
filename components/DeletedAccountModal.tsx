'use client'

import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'

// Constante para o canal de broadcast de exclusão
const DELETION_CHANNEL = 'nepsis-deletion-channel'

/**
 * Modal exibido quando a conta do usuário é excluída pelo administrador.
 * Impede o uso do app e força o logout.
 */
export function DeletedAccountModal() {
  const [isOpen, setIsOpen] = useState(false)

  const utils = trpc.useUtils()

  const {
    data: suspensionData,
    isLoading,
    refetch,
  } = trpc.user.checkSuspension.useQuery(undefined, {
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  })

  // Função para forçar verificação imediata
  const forceCheck = useCallback(() => {
    utils.user.checkSuspension.invalidate()
    refetch()
  }, [utils.user.checkSuspension, refetch])

  // Escutar mensagens do BroadcastChannel para notificação instantânea
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel(DELETION_CHANNEL)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'USER_DELETED') {
        forceCheck()
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [forceCheck])

  // Escutar mudanças no localStorage como fallback
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'deletion-event') {
        forceCheck()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [forceCheck])

  // Verificar quando a aba volta ao foco
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceCheck()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [forceCheck])

  useEffect(() => {
    if (suspensionData?.isDeleted) {
      setIsOpen(true)
    }
  }, [suspensionData])

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      window.location.href = '/auth/signin'
    }
  }

  if (isLoading || !isOpen || !suspensionData?.isDeleted) {
    return null
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))

  const isTherapist = suspensionData.role === 'psychologist'

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md'>
      <div className='mx-4 w-full max-w-md rounded-xl border border-red-500/50 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20'>
            <svg
              className='h-8 w-8 text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <title>Conta Excluída</title>
              <path
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>

        <h2 className='mb-2 text-center font-semibold text-white text-xl'>Conta Excluída</h2>

        <p className='mb-4 text-center text-slate-300'>
          {isTherapist
            ? 'Sua conta de terapeuta foi excluída pelo administrador. Você não pode mais acessar o sistema.'
            : 'Sua conta foi excluída pelo administrador e você não pode mais acessar o sistema.'}
        </p>

        {suspensionData.deletedAt && (
          <div className='mb-4 rounded-lg bg-slate-800/50 p-4'>
            <p className='text-slate-400 text-sm'>
              <span className='font-medium text-slate-300'>Data da exclusão:</span>{' '}
              {formatDate(suspensionData.deletedAt)}
            </p>
          </div>
        )}

        {suspensionData.deletedReason && (
          <div className='mb-6 rounded-lg bg-red-500/10 p-4'>
            <p className='mb-1 font-medium text-red-300 text-sm'>Motivo da exclusão:</p>
            <p className='text-slate-300 text-sm'>{suspensionData.deletedReason}</p>
          </div>
        )}

        {isTherapist && (
          <div className='mb-6 rounded-lg border border-amber-500/30 bg-amber-900/20 p-4'>
            <p className='mb-2 font-medium text-amber-300 text-sm'>Atenção Terapeuta</p>
            <p className='text-slate-300 text-sm'>
              Todos os seus dados profissionais e vínculos com pacientes foram removidos do sistema.
              Se você acredita que isso foi um erro, entre em contato com o suporte.
            </p>
          </div>
        )}

        <a
          className='mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 font-medium text-sm text-white transition-colors hover:bg-amber-700'
          href='mailto:suporte@nepsis.com.br?subject=Conta%20Exclu%C3%ADda%20-%20Solicita%C3%A7%C3%A3o%20de%20Suporte'
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <title>Email</title>
            <path
              d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
            />
          </svg>
          Entrar em Contato com Suporte
        </a>

        <button
          className='w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-sm text-white transition-colors hover:bg-red-700'
          onClick={handleLogout}
          type='button'
        >
          Sair da Conta
        </button>
      </div>
    </div>
  )
}
