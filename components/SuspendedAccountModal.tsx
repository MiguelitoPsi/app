'use client'

import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'

// Constante para o canal de broadcast de suspensão
const SUSPENSION_CHANNEL = 'nepsis-suspension-channel'

export function SuspendedAccountModal() {
  const [isOpen, setIsOpen] = useState(false)

  const utils = trpc.useUtils()

  const {
    data: suspensionData,
    isLoading,
    refetch,
  } = trpc.user.checkSuspension.useQuery(undefined, {
    staleTime: 5 * 1000, // 5 segundos
    refetchInterval: 10 * 1000, // Verificar a cada 10 segundos para detecção mais rápida
    retry: false, // Não tentar novamente em caso de erro
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
  })

  // Função para forçar verificação imediata
  const forceCheck = useCallback(() => {
    utils.user.checkSuspension.invalidate()
    refetch()
  }, [utils.user.checkSuspension, refetch])

  // Escutar mensagens do BroadcastChannel para notificação instantânea
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel(SUSPENSION_CHANNEL)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'USER_SUSPENDED') {
        // Forçar verificação imediata quando receber notificação de suspensão
        forceCheck()
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [forceCheck])

  // Escutar mudanças no localStorage como fallback para BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'suspension-event') {
        // Forçar verificação imediata quando detectar mudança no localStorage
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
    if (suspensionData?.isSuspended) {
      setIsOpen(true)
    }
  }, [suspensionData])

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Força redirecionamento mesmo em caso de erro
      window.location.href = '/auth/signin'
    }
  }

  if (isLoading || !isOpen || !suspensionData?.isSuspended) {
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

  // Verificar se é paciente suspenso em cadeia (terapeuta foi suspenso)
  const isSuspendedByTherapist = Boolean(suspensionData.suspendedByTherapistId)

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
              <title>Conta Suspensa</title>
              <path
                d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>

        <h2 className='mb-2 text-center text-xl font-semibold text-white'>
          {isSuspendedByTherapist ? 'Acesso Bloqueado' : 'Conta Suspensa'}
        </h2>

        <p className='mb-4 text-center text-slate-300'>
          {isSuspendedByTherapist
            ? 'O acesso à sua conta foi temporariamente bloqueado.'
            : 'Sua conta foi suspensa pelo administrador e você não pode mais acessar o sistema.'}
        </p>

        {suspensionData.bannedAt && (
          <div className='mb-4 rounded-lg bg-slate-800/50 p-4'>
            <p className='text-sm text-slate-400'>
              <span className='font-medium text-slate-300'>Data do bloqueio:</span>{' '}
              {formatDate(suspensionData.bannedAt)}
            </p>
          </div>
        )}

        {isSuspendedByTherapist ? (
          <div className='mb-6 rounded-lg bg-amber-500/10 p-4'>
            <p className='mb-2 text-sm font-medium text-amber-300'>
              Sua conta foi suspensa temporariamente
            </p>
            <p className='text-sm text-slate-300'>
              Entre em contato com seu psicólogo para mais informações sobre o acesso à sua conta.
            </p>
          </div>
        ) : (
          <>
            {suspensionData.banReason && (
              <div className='mb-6 rounded-lg bg-red-500/10 p-4'>
                <p className='mb-1 text-sm font-medium text-red-300'>Motivo da suspensão:</p>
                <p className='text-sm text-slate-300'>{suspensionData.banReason}</p>
              </div>
            )}

            <a
              className='mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700'
              href='mailto:suporte@nepsis.com.br?subject=Conta%20Suspensa%20-%20Solicita%C3%A7%C3%A3o%20de%20Suporte'
            >
              <svg
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
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
          </>
        )}

        <button
          className='w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700'
          onClick={handleLogout}
          type='button'
        >
          {isSuspendedByTherapist ? 'Fechar Aplicativo' : 'Sair da Conta'}
        </button>
      </div>
    </div>
  )
}
