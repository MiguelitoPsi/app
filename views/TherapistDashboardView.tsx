'use client'

import {
  AlertCircle,
  Banknote,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Gift,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  User,
  Users,
  X,
  Check,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { translateMood } from '@/lib/utils/mood'
import { InvitePatientModal } from '@/components/InvitePatientModal'

// Types for session form
type SessionFormData = {
  frequency: 'once' | 'weekly' | 'biweekly'
  sessionPatientId?: string
  weekDays?: number[]
  dueDate?: string
  sessionValue?: number
}

const defaultSessionForm: SessionFormData = {
  frequency: 'weekly',
  sessionPatientId: undefined,
  weekDays: [],
  dueDate: undefined,
  sessionValue: undefined,
}

// Badge vermelho circular
const CounterBadge: React.FC<{ count: number }> = ({ count }) => (
  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
    {String(count).padStart(2, '0')}
  </span>
)

// Card container - flex column, sem position absolute
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 ${className}`}
  >
    {children}
  </div>
)

// Card de resumo - flexbox alinhado
const SummaryCard: React.FC<{
  icon: React.ElementType
  iconColor: string
  count: number | undefined | null
  label: string
  isLoading?: boolean
}> = ({ icon: Icon, iconColor, count, label, isLoading }) => (
  <div
    className='flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'
  >
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
      <Icon className='h-5 w-5' />
    </div>
    <div className='flex flex-col'>
      <p className='text-xl font-bold text-slate-800 dark:text-white'>{isLoading ? '-' : count ?? 0}</p>
      <p className='text-xs text-slate-500 dark:text-slate-400'>{label}</p>
    </div>
  </div>
)



// Item de pendência - flexbox alinhado
const PendingItem: React.FC<{
  icon: React.ElementType
  iconBg: string
  text: string
  href?: string
}> = ({ icon: Icon, iconBg, text, href }) => {
  const content = (
    <>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className='h-4 w-4' />
      </div>
      <p className='flex-1 text-sm text-slate-700 dark:text-slate-300'>{text}</p>
      <ChevronRight className='h-5 w-5 flex-shrink-0 text-slate-400' />
    </>
  )

  if (href) {
    return (
      <Link 
        href={href}
        className='flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 transition-all hover:border-sky-500 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-500'
      >
        {content}
      </Link>
    )
  }

  return (
    <div className='flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
      {content}
    </div>
  )
}

// ===========================================
// DASHBOARD VIEW
// ===========================================

export const TherapistDashboardView: React.FC = () => {

  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState<SessionFormData>(defaultSessionForm)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  // Consolidated query for all dashboard data (combines summary + pending items)
  const { data: dashboardData, isLoading } = trpc.analytics.getTherapistDashboardData.useQuery(undefined, {
    staleTime: 60000,
  })

  const [showInviteModal, setShowInviteModal] = useState(false)

  // All patients for search
  const { data: allPatients } = trpc.patient.getAll.useQuery()

  const utils = trpc.useUtils()

  // Mutation for creating session task
  const createSessionMutation = trpc.therapistTasks.create.useMutation({
    onSuccess: () => {
      setShowSessionModal(false)
      setSessionForm(defaultSessionForm)
      setPatientSearchQuery('')
      setShowPatientDropdown(false)
      // Invalidate dashboard data
      utils.analytics.getTherapistDashboardData.invalidate()
      utils.therapistTasks.getAll.invalidate()
    },
  })

  // Mutation for confirming payment
  const confirmPaymentMutation = trpc.therapistFinancial.confirmPayment.useMutation({
    onSuccess: () => {
      utils.analytics.getTherapistDashboardData.invalidate()
    },
  })

  // Extract data from consolidated query
  const totalPatients = dashboardData?.totalPatients ?? 0
  const scheduledSessions = dashboardData?.scheduledSessions ?? 0

  // Contadores de pendências
  const totalPendingRewards = dashboardData?.totalPendingRewards ?? 0
  const totalUnpaidSessions = dashboardData?.totalUnpaidSessions ?? 0
  const totalPendingJournals = dashboardData?.totalPendingJournals ?? 0
  const totalPendingItems = totalPendingRewards + totalUnpaidSessions + totalPendingJournals

  // Filter patients for search
  const filteredPatients = useMemo(() => {
    if (!allPatients) return []
    if (!patientSearchQuery.trim()) return allPatients
    const query = patientSearchQuery.toLowerCase()
    return allPatients.filter(
      (p) => p.name?.toLowerCase().includes(query) || p.email?.toLowerCase().includes(query)
    )
  }, [allPatients, patientSearchQuery])

  // Selected patient for session
  const selectedSessionPatient = useMemo(() => {
    if (!sessionForm.sessionPatientId) return null
    if (!allPatients) return null
    return allPatients.find((p) => p.id === sessionForm.sessionPatientId)
  }, [allPatients, sessionForm.sessionPatientId])

  // Handle session creation
  const handleCreateSession = () => {
    if (!sessionForm.sessionPatientId) return

    if (
      (sessionForm.frequency === 'weekly' || sessionForm.frequency === 'biweekly') &&
      !sessionForm.weekDays?.length
    ) {
      return
    }

    if (sessionForm.frequency === 'once' && !sessionForm.dueDate) {
      return
    }

    const sessionTitle = selectedSessionPatient
      ? `Sessão - ${selectedSessionPatient.name}`
      : 'Sessão'

    createSessionMutation.mutate({
      title: sessionTitle,
      type: 'session',
      priority: 'high',
      dueDate: sessionForm.dueDate,
      isRecurring: sessionForm.frequency !== 'once',
      frequency:
        sessionForm.frequency === 'once'
          ? undefined
          : (sessionForm.frequency as 'weekly' | 'biweekly'),
      taskCategory: 'sessao',
      patientId: sessionForm.sessionPatientId,
      weekDays: sessionForm.weekDays,
      sessionValue: sessionForm.sessionValue,
    })
  }

  return (
    <div className='flex h-full w-full flex-col box-border overflow-hidden bg-slate-50 p-5 dark:bg-slate-900'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Dashboard</h2>
          <p className='text-slate-500 dark:text-slate-400'>
            Visão geral do seu consultório
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className='flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-600 active:scale-95'
        >
          <UserPlus className='h-4 w-4' />
          Convidar Paciente
        </button>
      </div>

      {/* Invite Modal */}
      <InvitePatientModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />

      {/* CORPO PRINCIPAL - GRID */}
      <div className='grid min-h-0 flex-1 grid-cols-12 gap-5'>
        {/* COLUNA ESQUERDA (30%) */}
        <div className='col-span-12 flex flex-col gap-5 lg:col-span-4'>
          {/* Próximas Sessões */}
          <Card>
            <div className='flex flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
              <div className='flex flex-row items-center gap-2'>
                <Calendar className='h-5 w-5 flex-shrink-0 text-purple-500' />
                <h2 className='text-base font-semibold text-slate-800 dark:text-white'>Próximas sessões</h2>
              </div>
              {(dashboardData?.upcomingSessions?.length ?? 0) > 0 && (
                <div className='flex gap-2'>
                  <button
                    className='flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400'
                    onClick={() => setShowInviteModal(true)}
                    type='button'
                  >
                    <UserPlus className='h-3 w-3' />
                    Convidar
                  </button>
                  <button
                    className='flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                    onClick={() => setShowSessionModal(true)}
                    type='button'
                  >
                    <Plus className='h-3 w-3' />
                    Adicionar
                  </button>
                </div>
              )}
            </div>
            <div className='flex flex-col gap-3'>
              {isLoading ? (
                <div className='flex flex-col gap-2'>
                  <div className='h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-700' />
                  <div className='h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-700' />
                </div>
              ) : (dashboardData?.upcomingSessions?.length ?? 0) === 0 ? (
                <div className='flex flex-col gap-4'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Você ainda não cadastrou sessões para esta semana.
                  </p>
                  <button
                    className='flex flex-row items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700'
                    onClick={() => setShowSessionModal(true)}
                    type='button'
                  >
                    <Calendar className='h-4 w-4' />
                    Cadastrar horário
                  </button>
                </div>
              ) : (
                <div className='flex flex-col gap-2 max-h-[200px] overflow-y-auto'>
                  {dashboardData?.upcomingSessions?.map((session) => {
                    const sessionDate = session.dueDate ? new Date(session.dueDate) : null
                    const formattedDate = sessionDate
                      ? sessionDate.toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Data não definida'
                    
                    return (
                      <div
                        key={session.id}
                        className='flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50'
                      >
                        <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white text-sm'>
                          {session.patientName?.charAt(0) || 'P'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-slate-800 text-sm truncate dark:text-white'>
                            {session.patientName}
                          </p>
                          <p className='text-xs text-slate-500 dark:text-slate-400'>
                            {formattedDate}
                            {session.sessionValue && (
                              <span className='ml-2 text-emerald-600 dark:text-emerald-400'>
                                R$ {session.sessionValue}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className='h-4 w-4 flex-shrink-0 text-slate-400' />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Mini-cards de resumo - grid alinhado */}
          <div className='flex flex-col gap-5'>
            <SummaryCard
              icon={Gift}
              iconColor='bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              count={0}
              label='Aniversariantes do mês'
              isLoading={isLoading}
            />
            <SummaryCard
              icon={Calendar}
              iconColor='bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
              count={scheduledSessions}
              label='Sessões agendadas no mês'
              isLoading={isLoading}
            />
            <SummaryCard
              icon={Users}
              iconColor='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              count={totalPatients}
              label='Pacientes ativos'
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* COLUNA DIREITA (70%) */}
        <div className='col-span-12 flex flex-col gap-5 overflow-hidden lg:col-span-8'>
          {/* Pendências */}
          <Card>
            <div className='flex flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
              <div className='flex flex-row items-center gap-2'>
                <Clock className='h-5 w-5 flex-shrink-0 text-slate-400' />
                <h2 className='text-base font-semibold text-slate-800 dark:text-white'>Pendências</h2>
                {totalPendingItems > 0 && <CounterBadge count={totalPendingItems} />}
              </div>
            </div>

            {/* Lista de Pendências por Categoria */}
            <div className='flex flex-col gap-6 max-h-[400px] overflow-y-auto'>
              {isLoading ? (
                <>
                  <div className='animate-pulse space-y-3'>
                    <div className='h-14 rounded-lg bg-slate-100 dark:bg-slate-700' />
                    <div className='h-14 rounded-lg bg-slate-100 dark:bg-slate-700' />
                    <div className='h-14 rounded-lg bg-slate-100 dark:bg-slate-700' />
                  </div>
                </>
              ) : totalPendingItems === 0 ? (
                <p className='py-4 text-center text-sm text-slate-500 dark:text-slate-400'>
                  Nenhuma pendência no momento. 🎉
                </p>
              ) : (
                <>
                  {/* Prêmios para Precificar */}
                  {totalPendingRewards > 0 && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Gift className='h-4 w-4 text-rose-500' />
                        <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                          Prêmios para Precificar
                        </h3>
                        <span className='rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'>
                          {totalPendingRewards}
                        </span>
                      </div>
                      {dashboardData?.pendingRewards.slice(0, 5).map((reward) => (
                        <PendingItem
                          key={reward.id}
                          icon={Gift}
                          iconBg='bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                          text={`${reward.title} - ${reward.patientName}`}
                          href={`/clients/${reward.patientId}?tab=rewards`}
                        />
                      ))}
                      {totalPendingRewards > 5 && (
                        <p className='text-xs text-slate-500 text-center dark:text-slate-400'>
                          e mais {totalPendingRewards - 5} prêmio(s)...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sessões Não Pagas */}
                  {totalUnpaidSessions > 0 && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Banknote className='h-4 w-4 text-amber-500' />
                        <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                          Pagamentos Pendentes
                        </h3>
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
                          {totalUnpaidSessions}
                        </span>
                      </div>
                      {dashboardData?.unpaidSessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className='flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800'
                        >
                          <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
                            <Banknote className='h-4 w-4' />
                          </div>
                          <div className='flex-1'>
                            <p className='text-sm text-slate-700 dark:text-slate-300'>
                              {session.description || `Sessão de ${session.patientName}`}
                            </p>
                            <p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                              {session.sessionValue ? `R$ ${session.sessionValue}` : 'Valor a definir'}
                            </p>
                          </div>
                          <button
                            onClick={() => confirmPaymentMutation.mutate({ id: session.id })}
                            disabled={confirmPaymentMutation.isPending}
                            className='flex items-center gap-1 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                            title='Confirmar recebimento'
                          >
                            {confirmPaymentMutation.isPending ? (
                              <RefreshCw className='h-3 w-3 animate-spin' />
                            ) : (
                              <Check className='h-3 w-3' />
                            )}
                            Confirmar
                          </button>
                        </div>
                      ))}
                      {totalUnpaidSessions > 5 && (
                        <p className='text-xs text-slate-500 text-center dark:text-slate-400'>
                          e mais {totalUnpaidSessions - 5} sessão(ões)...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registros de Pensamento sem Feedback */}
                  {totalPendingJournals > 0 && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <BookOpen className='h-4 w-4 text-sky-500' />
                        <h3 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                          Registros para Feedback
                        </h3>
                        <span className='rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
                          {totalPendingJournals}
                        </span>
                      </div>
                      {dashboardData?.pendingJournals.slice(0, 5).map((journal) => (
                        <PendingItem
                          key={journal.id}
                          icon={BookOpen}
                          iconBg='bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                          text={`Registro de ${journal.patientName}${journal.mood ? ` (${translateMood(journal.mood)})` : ''}`}
                          href={`/clients/${journal.patientId}?tab=journal`}
                        />
                      ))}
                      {totalPendingJournals > 5 && (
                        <p className='text-xs text-slate-500 text-center dark:text-slate-400'>
                          e mais {totalPendingJournals - 5} registro(s)...
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Tarefas */}
          <Card className='flex-1 min-h-[200px]'>
            <div className='flex flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
              <div className='flex flex-row items-center gap-2'>
                <CheckSquare className='h-4 w-4 flex-shrink-0 text-slate-400' />
                <h2 className='text-sm font-semibold text-slate-800 dark:text-white'>Tarefas</h2>
              </div>
            </div>

            {/* Button to Routine */}
            <div className='mb-4'>
              <Link
                href='/therapist-routine'
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600'
              >
                <Plus className='h-3 w-3' />
                Nova Tarefa
              </Link>
            </div>

            {/* Lista */}
            <div className='flex-1 overflow-y-auto'>
              <p className='py-2 text-center text-xs text-slate-400 dark:text-slate-500'>
                Nenhuma tarefa ainda.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* SESSION MODAL */}
      {showSessionModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md max-h-[90vh] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
            <div className='relative bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-white'>
              <div className='absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10' />
              <h3 className='font-bold text-xl'>Nova Tarefa</h3>
              <p className='text-sky-100 text-sm'>
                {selectedSessionPatient ? `Sessão com ${selectedSessionPatient.name}` : 'Sessão'}
              </p>
            </div>

            <form
              className='p-6'
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateSession()
              }}
            >
              <div className='space-y-4'>
                {/* Task Type - Pre-selected as Session */}
                <div>
                  <label className='mb-2 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <Users className='mb-0.5 inline h-3 w-3' /> Tipo de Tarefa *
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      className='flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 opacity-50 cursor-not-allowed'
                      type='button'
                      disabled
                    >
                      <Users className='mb-2 h-6 w-6' />
                      <span className='text-sm'>Geral</span>
                      <span className='mt-1 font-normal text-[10px] opacity-70'>Tarefas pessoais</span>
                    </button>
                    <button
                      className='flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                      type='button'
                    >
                      <Users className='mb-2 h-6 w-6' />
                      <span className='text-sm'>Sessão</span>
                      <span className='mt-1 font-normal text-[10px] opacity-70'>Com paciente</span>
                    </button>
                  </div>
                </div>

                {/* Patient Search */}
                <div>
                  <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <User className='mb-0.5 inline h-3 w-3' /> Paciente *
                  </label>
                  <div className='relative'>
                    <div className='relative'>
                      <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
                      <input
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-3 pl-10 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30'
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value)
                          setShowPatientDropdown(true)
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder='Buscar paciente pelo nome...'
                        type='text'
                        value={
                          selectedSessionPatient
                            ? selectedSessionPatient.name || ''
                            : patientSearchQuery
                        }
                      />
                      {selectedSessionPatient && (
                        <button
                          className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700'
                          onClick={() => {
                            setSessionForm({
                              ...sessionForm,
                              sessionPatientId: undefined,
                            })
                            setPatientSearchQuery('')
                          }}
                          type='button'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      )}
                    </div>

                    {showPatientDropdown && !selectedSessionPatient && (
                      <div className='absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800'>
                        {filteredPatients.length === 0 ? (
                          <div className='p-4 text-center text-slate-500 text-sm'>
                            Nenhum paciente encontrado
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
                            <button
                              className='flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700'
                              key={patient.id}
                              onClick={() => {
                                setSessionForm({
                                  ...sessionForm,
                                  sessionPatientId: patient.id,
                                })
                                setPatientSearchQuery('')
                                setShowPatientDropdown(false)
                              }}
                              type='button'
                            >
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white text-sm'>
                                {patient.name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                                  {patient.name}
                                </p>
                                <p className='text-slate-500 text-xs dark:text-slate-400'>
                                  {patient.email}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Value */}
                <div>
                  <label
                    className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                    htmlFor='session-value'
                  >
                    <Banknote className='mb-0.5 inline h-3 w-3' /> Valor da Sessão (R$)
                  </label>
                  <input
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30'
                    id='session-value'
                    min='0'
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        sessionValue: Number(e.target.value),
                      })
                    }
                    placeholder='0.00'
                    type='number'
                    value={sessionForm.sessionValue || ''}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className='mb-1 block font-bold text-slate-400 text-[10px] uppercase tracking-wider'>
                    <Repeat className='mb-0.5 inline h-3 w-3' /> Frequência
                  </label>
                  <div className='grid grid-cols-3 gap-1.5'>
                    {(
                      [
                        { key: 'once', label: 'Única' },
                        { key: 'weekly', label: 'Semanal' },
                        { key: 'biweekly', label: 'Quinzenal' },
                      ] as const
                    ).map((freq) => (
                      <button
                        className={`rounded-md border-2 px-2 py-1.5 font-bold text-[10px] transition-all ${
                          sessionForm.frequency === freq.key
                            ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                            : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                        }`}
                        key={freq.key}
                        onClick={() =>
                          setSessionForm({
                            ...sessionForm,
                            frequency: freq.key,
                            weekDays: [],
                            dueDate: undefined,
                          })
                        }
                        type='button'
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>

                  {/* Week days selection */}
                  {(sessionForm.frequency === 'weekly' || sessionForm.frequency === 'biweekly') && (
                    <div className='mt-2'>
                      <p className='mb-1.5 text-slate-500 text-[10px] dark:text-slate-400'>
                        Selecione o dia da semana:
                      </p>
                      <div className='grid grid-cols-7 gap-1'>
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                          const isSelected = sessionForm.weekDays?.includes(index)
                          return (
                            <button
                              className={`aspect-square rounded-md border-2 font-bold text-[10px] transition-all ${
                                isSelected
                                  ? 'border-sky-500 bg-sky-500 text-white'
                                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-600'
                              }`}
                              key={index}
                              onClick={() => {
                                setSessionForm({
                                  ...sessionForm,
                                  weekDays: [index],
                                })
                              }}
                              type='button'
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Date for single sessions */}
                  {sessionForm.frequency === 'once' && (
                    <div className='mt-2'>
                      <label
                        className='mb-1 block font-medium text-slate-500 text-[10px] dark:text-slate-400'
                        htmlFor='session-date-once'
                      >
                        Data da Sessão:
                      </label>
                      <input
                        className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none transition-colors focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        id='session-date-once'
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            dueDate: e.target.value,
                          })
                        }
                        type='date'
                        value={sessionForm.dueDate || ''}
                      />
                    </div>
                  )}
                </div>

                {/* Session warning */}
                {selectedSessionPatient && (
                  <div className='flex items-start gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20'>
                    <AlertCircle className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500' />
                    <p className='text-amber-700 text-[10px] leading-tight dark:text-amber-400'>
                      {sessionForm.frequency === 'weekly'
                        ? 'Sessão semanal no mesmo dia'
                        : sessionForm.frequency === 'biweekly'
                          ? 'Sessão quinzenal no mesmo dia'
                          : sessionForm.frequency === 'once' && sessionForm.dueDate
                            ? `Sessão em ${new Date(sessionForm.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                            : 'Tarefa adicionada'}
                      {' para '}
                      <strong>{selectedSessionPatient.name}</strong>.
                    </p>
                  </div>
                )}

                {/* Priority indicator */}
                <div className='flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 dark:bg-red-900/20'>
                  <Flag className='h-3.5 w-3.5 text-red-500' fill='currentColor' />
                  <span className='font-medium text-red-600 text-[10px] dark:text-red-400'>
                    Prioridade Alta
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className='mt-6 flex gap-3'>
                <button
                  className='flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  onClick={() => {
                    setShowSessionModal(false)
                    setSessionForm(defaultSessionForm)
                    setPatientSearchQuery('')
                    setShowPatientDropdown(false)
                  }}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className='flex flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900'
                  disabled={
                    createSessionMutation.isPending ||
                    !sessionForm.sessionPatientId ||
                    ((sessionForm.frequency === 'weekly' || sessionForm.frequency === 'biweekly') &&
                      !sessionForm.weekDays?.length) ||
                    (sessionForm.frequency === 'once' && !sessionForm.dueDate)
                  }
                  type='submit'
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      Criar Tarefa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TherapistDashboardView

