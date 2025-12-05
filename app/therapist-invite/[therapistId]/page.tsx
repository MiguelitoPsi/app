'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TherapistInvitePage() {
  const params = useParams()
  const router = useRouter()
  const therapistId = params.therapistId as string

  useEffect(() => {
    if (!therapistId || therapistId === 'unknown') {
      router.push('/auth/signin')
    }
  }, [therapistId, router])

  const handleAccept = () => {
    // Redirect to signup with therapist ID
    router.push(`/auth/signup?therapistId=${therapistId}`)
  }

  const handleLogin = () => {
    // Redirect to login with therapist ID to link after login
    router.push(`/auth/signin?therapistId=${therapistId}`)
  }

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Animated gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <motion.div 
          className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl'
          animate={{ 
            x: [0, 80, 0, -60, 0],
            y: [0, -50, 40, 0, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl'
          animate={{ 
            x: [0, -70, 40, 0],
            y: [0, 60, -40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl'
          animate={{ 
            x: [0, 60, -50, 0],
            y: [0, -70, 50, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Invite Card */}
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Icon */}
            <div className='mb-6 flex justify-center'>
              <div className='rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 shadow-lg'>
                <UserPlus className='h-10 w-10 text-white' />
              </div>
            </div>

            {/* Title */}
            <div className='mb-8 text-center'>
              <h1 className='font-bold text-3xl text-white'>Convite de Terapeuta</h1>
              <p className='mt-2 text-violet-400'>
                Você foi convidado para participar do programa de acompanhamento psicológico
              </p>
            </div>

            {/* Info Card */}
            <div className='mb-8 space-y-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400' />
                <div>
                  <h3 className='font-semibold text-white'>Acompanhamento Personalizado</h3>
                  <p className='text-sm text-slate-400'>
                    Seu terapeuta poderá acompanhar seu progresso e oferecer suporte personalizado
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400' />
                <div>
                  <h3 className='font-semibold text-white'>Privacidade Garantida</h3>
                  <p className='text-sm text-slate-400'>
                    Apenas seu terapeuta vinculado terá acesso aos seus dados
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400' />
                <div>
                  <h3 className='font-semibold text-white'>Ferramentas Completas</h3>
                  <p className='text-sm text-slate-400'>
                    Acesso a meditação, diário, tarefas e sistema de recompensas
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3'>
              <button
                className='w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                onClick={handleAccept}
              >
                Aceitar Convite e Criar Conta
              </button>

              <button
                className='w-full rounded-xl border border-slate-700 bg-slate-800/50 py-4 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                onClick={handleLogin}
              >
                Já tenho conta - Fazer Login
              </button>
            </div>

            {/* Info Alert */}
            <div className='mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400' />
              <p className='text-sm text-amber-200'>
                <strong>Importante:</strong> Ao criar sua conta através deste link, você será
                automaticamente vinculado ao seu terapeuta.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
