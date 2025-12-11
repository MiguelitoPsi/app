'use client'

import { AlertTriangle, CheckCircle, CreditCard, FileText, Scale, Shield, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type TherapistTermsModalProps = {
  isOpen: boolean
  onAccept?: () => void
  onClose?: () => void
  mode?: 'accept' | 'view'
  termsAcceptedAt?: Date | null
}

export function TherapistTermsModal({
  isOpen,
  onAccept,
  onClose,
  mode = 'accept',
  termsAcceptedAt,
}: TherapistTermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const utils = trpc.useUtils()

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

  const acceptTerms = trpc.user.acceptTerms.useMutation({
    onSuccess: () => {
      utils.user.checkTermsAccepted.invalidate()
      onAccept?.()
    },
  })

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50
    if (isAtBottom) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await acceptTerms.mutateAsync()
    } catch {
      setIsAccepting(false)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view'

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm'>
      <div className='relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 dark:border-slate-700'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'>
              <FileText className='h-5 w-5 text-white' />
            </div>
            <div>
              <h2 className='font-bold text-lg text-white'>Termo de Responsabilidade</h2>
              <p className='text-sm text-violet-200'>Profissional de Psicologia</p>
            </div>
          </div>
          {isViewMode && (
            <button
              aria-label='Fechar termo'
              className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30'
              onClick={handleClose}
              type='button'
            >
              <X className='h-5 w-5' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-5' onScroll={handleScroll}>
          <div className='prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed'>
            <p className='text-slate-600 dark:text-slate-400'>
              Este Termo de Responsabilidade estabelece as condições para o uso do aplicativo Nepsis
              pelo profissional de Psicologia ("Usuário Terapeuta"). Ao criar uma conta, acessar ou
              utilizar qualquer funcionalidade do Aplicativo, o Usuário Terapeuta declara que leu,
              compreendeu e concorda com todas as cláusulas abaixo.
            </p>

            {/* Section 1 */}
            <div className='mt-6 rounded-xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/30 dark:bg-violet-900/10'>
              <div className='mb-3 flex items-center gap-2'>
                <Scale className='h-5 w-5 text-violet-600 dark:text-violet-400' />
                <h3 className='m-0 font-semibold text-base text-violet-700 dark:text-violet-300'>
                  1. Exercício Profissional e Ética
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>1.1.</strong> O Usuário Terapeuta declara ser profissional habilitado,
                  devidamente inscrito em Conselho Regional de Psicologia (CRP),
                  responsabilizando-se integralmente pela veracidade dessa informação.
                </p>
                <p className='m-0'>
                  <strong>1.2.</strong> O Usuário Terapeuta reconhece que o Aplicativo é uma
                  ferramenta de apoio e não substitui a atuação profissional, supervisão clínica,
                  julgamento técnico, nem configura prestação de serviço psicológico.
                </p>
                <p className='m-0'>
                  <strong>1.3.</strong> O Usuário Terapeuta compromete-se a seguir integralmente as
                  diretrizes éticas aplicáveis ao exercício da Psicologia, incluindo, mas não se
                  limitando, ao Código de Ética Profissional do Psicólogo, legislações vigentes e
                  normas específicas sobre atendimento, registro, sigilo e manejo clínico.
                </p>
                <p className='m-0'>
                  <strong>1.4.</strong> Qualquer conduta antiética, negligente, imprudente ou
                  inadequada é de responsabilidade exclusiva do Usuário Terapeuta, ficando o
                  Aplicativo isento de qualquer responsabilidade decorrente dessas ações.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className='mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10'>
              <div className='mb-3 flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                <h3 className='m-0 font-semibold text-base text-amber-700 dark:text-amber-300'>
                  2. Uso das Funcionalidades e Supervisão de Conteúdo
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>2.1.</strong> O Aplicativo disponibiliza ferramentas auxiliares, incluindo
                  análise automática de textos, organização de dados, sugestões interventivas,
                  modelos de conceituação cognitiva e plano terapêutico gerados por inteligência
                  artificial.
                </p>
                <p className='m-0'>
                  <strong>2.2.</strong> O Usuário Terapeuta reconhece que toda informação gerada
                  pela IA possui caráter auxiliar, podendo conter erros, interpretações incorretas
                  ou sugestões inadequadas.
                </p>
                <p className='m-0'>
                  <strong>2.3.</strong> O Usuário Terapeuta é integralmente responsável por revisar,
                  validar, editar, corrigir e aprovar todas as informações, análises, relatórios,
                  conceituações cognitivas, hipóteses clínicas, tarefas ou recomendações fornecidas
                  pela IA.
                </p>
                <p className='m-0'>
                  <strong>2.4.</strong> O Aplicativo não se responsabiliza por decisões clínicas,
                  diagnósticas, interventivas ou comunicacionais tomadas com base em conteúdos não
                  revisados pelo Usuário Terapeuta.
                </p>
                <p className='m-0'>
                  <strong>2.5.</strong> O Usuário Terapeuta reconhece que qualquer uso da IA que
                  resulte em prejuízo ao paciente, violação ética, erro clínico, má prática ou dano
                  é de sua exclusiva responsabilidade.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className='mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10'>
              <div className='mb-3 flex items-center gap-2'>
                <Shield className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                <h3 className='m-0 font-semibold text-base text-emerald-700 dark:text-emerald-300'>
                  3. Privacidade, Sigilo e Armazenamento de Informações
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>3.1.</strong> O Usuário Terapeuta se compromete a utilizar o Aplicativo em
                  conformidade com leis de proteção de dados, sigilo profissional e normas éticas
                  sobre registros psicológicos.
                </p>
                <p className='m-0'>
                  <strong>3.2.</strong> É responsabilidade do Usuário Terapeuta garantir que o uso e
                  o armazenamento das informações de seus pacientes estejam em conformidade com a
                  legislação e que o consentimento informado dos pacientes seja obtido quando
                  necessário.
                </p>
                <p className='m-0'>
                  <strong>3.3.</strong> O Aplicativo não se responsabiliza por inserção inadequada
                  de dados, vazamentos decorrentes de negligência do Usuário Terapeuta ou uso
                  indevido das informações.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className='mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10'>
              <div className='mb-3 flex items-center gap-2'>
                <CreditCard className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                <h3 className='m-0 font-semibold text-base text-blue-700 dark:text-blue-300'>
                  4. Planos, Pagamentos e Suspensão de Acesso
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>4.1.</strong> O Usuário Terapeuta reconhece que o uso do Aplicativo pode
                  exigir pagamento mensal, anual ou outro modelo contratado.
                </p>
                <p className='m-0'>
                  <strong>4.2.</strong> O não pagamento nas datas estipuladas poderá resultar na
                  suspensão ou cancelamento do acesso às funcionalidades, sem obrigação de
                  restituição de dados que não tenham sido previamente exportados pelo Usuário
                  Terapeuta.
                </p>
                <p className='m-0'>
                  <strong>4.3.</strong> O Usuário Terapeuta reconhece que eventuais mudanças de
                  valores, planos ou condições poderão ocorrer, sendo previamente comunicadas pelos
                  canais oficiais do Aplicativo.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className='mt-4 rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-900/10'>
              <div className='mb-3 flex items-center gap-2'>
                <X className='h-5 w-5 text-red-600 dark:text-red-400' />
                <h3 className='m-0 font-semibold text-base text-red-700 dark:text-red-300'>
                  5. Isenção de Responsabilidade do Aplicativo
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>5.1.</strong> O Aplicativo não realiza atendimento psicológico,
                  psicoterapia, diagnóstico ou intervenção clínica.
                </p>
                <p className='m-0 font-medium'>
                  <strong>5.2.</strong> O Aplicativo não se responsabiliza por:
                </p>
                <ul className='m-0 ml-4 list-disc space-y-1'>
                  <li>a) decisões clínicas tomadas pelo Usuário Terapeuta;</li>
                  <li>b) resultados terapêuticos obtidos ou não obtidos;</li>
                  <li>
                    c) qualquer conduta antiética, imprópria ou ilegal praticada pelo Usuário
                    Terapeuta;
                  </li>
                  <li>
                    d) interpretações incorretas, uso inadequado ou falta de revisão de dados
                    gerados pela IA;
                  </li>
                  <li>
                    e) danos diretos ou indiretos decorrentes do uso inadequado da plataforma.
                  </li>
                </ul>
                <p className='m-0'>
                  <strong>5.3.</strong> O Usuário Terapeuta concorda em isentar o Aplicativo de
                  reclamações, processos, demandas ou responsabilidades decorrentes da prática
                  profissional realizada por meio ou com apoio das funcionalidades fornecidas.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className='mt-4 rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800'>
              <div className='mb-3 flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-slate-600 dark:text-slate-400' />
                <h3 className='m-0 font-semibold text-base text-slate-700 dark:text-slate-300'>
                  6. Aceite do Termo
                </h3>
              </div>
              <div className='space-y-2 text-slate-700 dark:text-slate-300'>
                <p className='m-0'>
                  <strong>6.1.</strong> O Usuário Terapeuta declara que leu e compreendeu todas as
                  cláusulas deste Termo.
                </p>
                <p className='m-0'>
                  <strong>6.2.</strong> O uso contínuo do Aplicativo implica concordância
                  irrevogável com todas as responsabilidades aqui estabelecidas.
                </p>
              </div>
            </div>
          </div>

          {/* Signature timestamp - only show in view mode if terms were accepted */}
          {isViewMode && termsAcceptedAt && (
            <div className='mt-6 rounded-xl border border-green-100 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-900/10'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                <div>
                  <p className='m-0 font-semibold text-green-700 text-sm dark:text-green-300'>
                    Termo assinado em:
                  </p>
                  <p className='m-0 text-green-600 text-sm dark:text-green-400'>
                    {new Date(termsAcceptedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}{' '}
                    às{' '}
                    {new Date(termsAcceptedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50'>
          {isViewMode ? (
            <button
              className='w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white transition-all duration-200 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98]'
              onClick={handleClose}
              type='button'
            >
              Fechar
            </button>
          ) : (
            <>
              {!hasScrolledToBottom && (
                <p className='mb-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400'>
                  <AlertTriangle className='h-4 w-4' />
                  Role até o final para habilitar o botão de aceite
                </p>
              )}
              <button
                className={`w-full rounded-xl py-3.5 font-semibold text-white transition-all duration-200 ${
                  hasScrolledToBottom && !isAccepting
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98]'
                    : 'cursor-not-allowed bg-slate-400 dark:bg-slate-600'
                }`}
                disabled={!hasScrolledToBottom || isAccepting}
                onClick={handleAccept}
                type='button'
              >
                {isAccepting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg
                      aria-hidden='true'
                      className='h-5 w-5 animate-spin'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <title>Carregando</title>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        fill='currentColor'
                      />
                    </svg>
                    Processando...
                  </span>
                ) : (
                  <span className='flex items-center justify-center gap-2'>
                    <CheckCircle className='h-5 w-5' />
                    Li e aceito o Termo de Responsabilidade
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
