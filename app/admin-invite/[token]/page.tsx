'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export default function AdminInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [error, setError] = useState<string | null>(null)

  const {
    data: invite,
    isLoading,
    error: fetchError,
  } = trpc.admin.getInviteByToken.useQuery({ token }, { enabled: !!token, retry: false })

  useEffect(() => {
    if (fetchError) {
      setError(fetchError.message)
    }
  }, [fetchError])

  const handleSignup = () => {
    router.push(`/auth/signup?adminInviteToken=${token}`)
  }

  const handleLogin = () => {
    router.push(`/auth/signin?adminInviteToken=${token}`)
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-800'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto' />
          <p className='mt-4 text-slate-400'>Verificando convite...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-800'>
          <div className='text-center'>
            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20'>
              <AlertCircle className='h-6 w-6 text-red-500' />
            </div>
            <h3 className='mt-4 text-lg font-medium text-white'>Convite Inválido</h3>
            <p className='mt-2 text-sm text-slate-400'>
              {error || 'Não foi possível encontrar este convite.'}
            </p>
            <button
              className='mt-6 w-full inline-flex justify-center rounded-lg px-4 py-2 bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 transition-colors'
              onClick={() => router.push('/auth/signin')}
              type='button'
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const roleLabel = invite.role === 'admin' ? 'Administrador' : 'Psicólogo'

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Animated gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <motion.div
          animate={{
            x: [0, 80, 0, -60, 0],
            y: [0, -50, 40, 0, 0],
          }}
          className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl'
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{
            x: [0, -70, 40, 0],
            y: [0, 60, -40, 0],
          }}
          className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl'
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Icon */}
            <div className='mb-6 flex justify-center'>
              <div className='rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 shadow-lg'>
                <UserPlus className='h-10 w-10 text-white' />
              </div>
            </div>

            {/* Title */}
            <div className='mb-8 text-center'>
              <h1 className='font-bold text-3xl text-white'>Convite Especial</h1>
              <p className='mt-2 text-violet-400'>
                Você foi convidado para se juntar à equipe como{' '}
                <strong className='text-white'>{roleLabel}</strong>
              </p>
              {invite.creatorName && (
                <p className='mt-1 text-xs text-slate-500'>Convidado por {invite.creatorName}</p>
              )}
            </div>

            {/* Info Card */}
            <div className='mb-8 space-y-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400' />
                <div>
                  <h3 className='font-semibold text-white'>Acesso Exclusivo</h3>
                  <p className='text-sm text-slate-400'>
                    Crie sua conta para acessar o painel de {roleLabel.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3'>
              <button
                className='w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]'
                onClick={handleSignup}
                type='button'
              >
                Aceitar Convite e Criar Conta
              </button>

              <button
                className='w-full rounded-xl border border-slate-700 bg-slate-800/50 py-4 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]'
                onClick={handleLogin}
                type='button'
              >
                Já tenho conta - Fazer Login
              </button>
            </div>

            <p className='mt-6 text-center text-xs text-slate-500'>
              Este convite expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
            </p>
          </main>
        </div>
      </div>
    </div>
  )
}
