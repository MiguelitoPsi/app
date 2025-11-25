'use client'

import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TherapistInvitePage() {
  const params = useParams()
  const router = useRouter()
  const therapistId = params.therapistId as string

  const [copied, setCopied] = useState(false)

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
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-slate-100 dark:border-slate-800'>
        {/* Icon */}
        <div className='flex justify-center mb-6'>
          <div className='bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4 shadow-lg'>
            <UserPlus className='h-12 w-12 text-white' />
          </div>
        </div>

        {/* Title */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-black text-slate-900 dark:text-white mb-3'>
            Convite de Terapeuta
          </h1>
          <p className='text-slate-600 dark:text-slate-400 text-lg'>
            Você foi convidado para participar do programa de acompanhamento psicológico
          </p>
        </div>

        {/* Info Card */}
        <div className='bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 mb-8 border border-indigo-100 dark:border-indigo-900/50'>
          <div className='flex items-start gap-3 mb-4'>
            <CheckCircle2 className='h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='font-bold text-slate-900 dark:text-white mb-1'>
                Acompanhamento Personalizado
              </h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Seu terapeuta poderá acompanhar seu progresso e oferecer suporte personalizado
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 mb-4'>
            <CheckCircle2 className='h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='font-bold text-slate-900 dark:text-white mb-1'>
                Privacidade Garantida
              </h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Apenas seu terapeuta vinculado terá acesso aos seus dados
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <CheckCircle2 className='h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5' />
            <div>
              <h3 className='font-bold text-slate-900 dark:text-white mb-1'>
                Ferramentas Completas
              </h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Acesso a meditação, diário, tarefas e sistema de recompensas
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3 mb-6'>
          <button
            className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2'
            onClick={handleAccept}
          >
            <UserPlus className='h-5 w-5' />
            Aceitar Convite e Criar Conta
          </button>

          <button
            className='w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
            onClick={handleLogin}
          >
            Já tenho conta - Fazer Login
          </button>
        </div>

        {/* Info Alert */}
        <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' />
          <p className='text-sm text-amber-800 dark:text-amber-200'>
            <strong>Importante:</strong> Ao criar sua conta através deste link, você será
            automaticamente vinculado ao seu terapeuta.
          </p>
        </div>
      </div>
    </div>
  )
}
