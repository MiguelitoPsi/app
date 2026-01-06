'use client'

import { Check, FileText } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type PatientConsentModalProps = {
  onSuccess: () => void
}

export function PatientConsentModal({ onSuccess }: PatientConsentModalProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const utils = trpc.useUtils()

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const acceptTermsMutation = trpc.user.acceptTerms.useMutation({
    onSuccess: () => {
      utils.user.checkTermsAccepted.invalidate()
      onSuccess()
    },
    onError: (error) => {
      console.error('Error accepting terms:', error)
      setIsAccepting(false)
    },
  })

  const handleAccept = () => {
    setIsAccepting(true)
    acceptTermsMutation.mutate()
  }

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm'>
      <div className='w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900'>
        {/* Header */}
        <div className='border-slate-100 border-b bg-slate-50/50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='flex items-center gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
              <FileText size={24} />
            </div>
            <div>
              <h2 className='font-bold text-xl text-slate-900 sm:text-2xl dark:text-white'>
                Termo de Consentimento
              </h2>
              <p className='text-slate-500 text-sm dark:text-slate-400'>
                Por favor, leia atentamente antes de prosseguir
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='max-h-[60vh] overflow-y-auto p-6 sm:p-8'>
          <div className='prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-strong:text-slate-900 dark:prose-strong:text-white'>
            <p className='text-slate-800 dark:text-slate-200 font-medium'>
              Este Termo de Consentimento Livre e Esclarecido (TCLE) tem como objetivo fornecer
              informações sobre a utilização da plataforma de acompanhamento terapêutico.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>1. Objetivo da Plataforma</h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Esta plataforma foi desenvolvida para auxiliar no acompanhamento do seu processo
              terapêutico, permitindo o registro de humor, diário de pensamentos, realização de
              tarefas e meditações.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>
              2. Confidencialidade e Privacidade
            </h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Todas as informações registradas na plataforma são confidenciais e protegidas. Apenas
              você e seu terapeuta vinculado terão acesso aos dados inseridos.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>3. Uso de Dados</h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Os dados coletados serão utilizados exclusivamente para fins terapêuticos e de
              melhoria do seu acompanhamento. Dados anonimizados poderão ser utilizados para fins
              estatísticos e de pesquisa.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>4. Compromisso do Usuário</h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Ao utilizar a plataforma, você se compromete a fornecer informações verídicas e a
              utilizar os recursos de forma responsável.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>5. Desistência</h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Você pode deixar de utilizar a plataforma a qualquer momento, sem prejuízo ao seu
              atendimento terapêutico presencial ou online.
            </p>

            <h3 className='text-slate-900 dark:text-white font-bold'>6. Documentos Importantes</h3>
            <p className='text-slate-800 dark:text-slate-200'>
              Para mais informações sobre como tratamos seus dados e as condições de uso da
              plataforma, consulte:
            </p>
            <ul className='text-slate-800 dark:text-slate-200'>
              <li>
                <Link
                  className='text-sky-600 underline hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'
                  href='/privacy'
                  target='_blank'
                >
                  Política de Privacidade
                </Link>{' '}
                - Como coletamos, usamos e protegemos seus dados pessoais
              </li>
              <li>
                <Link
                  className='text-sky-600 underline hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'
                  href='/terms'
                  target='_blank'
                >
                  Termos de Uso
                </Link>{' '}
                - Regras e condições de uso da plataforma
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className='border-slate-100 border-t bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end'>
            <p className='text-center text-slate-500 text-xs sm:text-left dark:text-slate-400'>
              Ao clicar em "Li e Concordo", você aceita os termos descritos acima.
            </p>
            <button
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-bold text-white transition-all hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-500/20 active:scale-95 sm:w-auto disabled:cursor-not-allowed disabled:opacity-70'
              disabled={isAccepting}
              onClick={handleAccept}
              type='button'
            >
              {isAccepting ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Processando...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Li e Concordo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
