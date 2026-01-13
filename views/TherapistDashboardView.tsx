'use client'

import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  ExternalLink,
  Flag,
  Gift,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  User,
  Users,
  X,
} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'

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

// Filtro Pill
const FilterPill: React.FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ active, onClick, children }) => (
  <button
    className={`flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
      active
        ? 'bg-purple-600 text-white'
        : 'border border-slate-200 text-slate-600 hover:border-purple-500 dark:border-slate-600 dark:text-slate-400'
    }`}
    onClick={onClick}
    type='button'
  >
    {children}
  </button>
)

// Item de pendência - flexbox alinhado
const PendingItem: React.FC<{
  icon: React.ElementType
  iconBg: string
  text: string
}> = ({ icon: Icon, iconBg, text }) => (
  <div className='flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
      <Icon className='h-4 w-4' />
    </div>
    <p className='flex-1 text-sm text-slate-700 dark:text-slate-300'>{text}</p>
    <ChevronRight className='h-5 w-5 flex-shrink-0 text-slate-400' />
  </div>
)

// ===========================================
// DASHBOARD VIEW
// ===========================================

export const TherapistDashboardView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'registrations' | 'sessions'>('all')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState<SessionFormData>(defaultSessionForm)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  // Dados reais do backend
  const { data: patientsData, isLoading: isLoadingPatients } = trpc.patient.getMyPatients.useQuery(undefined, {
    staleTime: 60000,
  })

  const { data: invitesData, isLoading: isLoadingInvites } = trpc.patient.getInvites.useQuery(undefined, {
    staleTime: 60000,
  })

  const { data: dashboardSummary, isLoading: isLoadingSummary } = trpc.analytics.getDashboardSummary.useQuery(undefined, {
    staleTime: 60000,
  })

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
      // Invalidate both dashboard and routine queries
      utils.analytics.getDashboardSummary.invalidate()
      utils.therapistTasks.getAll.invalidate()
    },
  })

  const totalPatients = patientsData?.length ?? 0
  const pendingInvites = invitesData?.filter((inv) => inv.status === 'pending').length ?? 0
  const scheduledSessions = dashboardSummary?.scheduledSessions ?? 0

  // Dynamic pending items based on real data
  const pendingItems = pendingInvites > 0
    ? [{ id: 1, icon: Users, iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', text: `${pendingInvites} convite(s) pendente(s) de resposta` }]
    : []

  const isLoading = isLoadingPatients || isLoadingInvites || isLoadingSummary

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
    <div className='box-border h-full w-full overflow-hidden bg-slate-50 p-5 dark:bg-slate-900'>
      {/* CORPO PRINCIPAL - GRID */}
      <div className='grid h-full grid-cols-12 gap-5'>
        {/* COLUNA ESQUERDA (30%) */}
        <div className='col-span-12 flex flex-col gap-5 lg:col-span-4'>
          {/* Próximas Sessões */}
          <Card>
            <div className='flex flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
              <div className='flex flex-row items-center gap-2'>
                <Calendar className='h-5 w-5 flex-shrink-0 text-purple-500' />
                <h2 className='text-base font-semibold text-slate-800 dark:text-white'>Próximas sessões</h2>
              </div>
              {(dashboardSummary?.upcomingSessions?.length ?? 0) > 0 && (
                <button
                  className='flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                  onClick={() => setShowSessionModal(true)}
                  type='button'
                >
                  <Plus className='h-3 w-3' />
                  Adicionar
                </button>
              )}
            </div>
            <div className='flex flex-col gap-3'>
              {isLoading ? (
                <div className='flex flex-col gap-2'>
                  <div className='h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-700' />
                  <div className='h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-700' />
                </div>
              ) : (dashboardSummary?.upcomingSessions?.length ?? 0) === 0 ? (
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
                  {dashboardSummary?.upcomingSessions?.map((session) => {
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
              isLoading={isLoadingSummary}
            />
            <SummaryCard
              icon={Users}
              iconColor='bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              count={totalPatients}
              label='Pacientes ativos'
              isLoading={isLoadingPatients}
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
                {pendingItems.length > 0 && <CounterBadge count={pendingItems.length} />}
              </div>
              <div className='flex flex-row items-center gap-2'>
                <button className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'>
                  <RefreshCw className='h-4 w-4' />
                </button>
                <button className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'>
                  <ExternalLink className='h-4 w-4' />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className='flex flex-row gap-2 pb-4 mb-4'>
              <FilterPill active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                Todos
              </FilterPill>
              <FilterPill active={activeFilter === 'registrations'} onClick={() => setActiveFilter('registrations')}>
                Cadastros ({pendingInvites})
              </FilterPill>
              <FilterPill active={activeFilter === 'sessions'} onClick={() => setActiveFilter('sessions')}>
                Sessões
              </FilterPill>
            </div>

            {/* Lista */}
            <div className='flex flex-col gap-3'>
              {isLoading ? (
                <>
                  <div className='h-14 rounded-lg bg-slate-100 dark:bg-slate-700' />
                  <div className='h-14 rounded-lg bg-slate-100 dark:bg-slate-700' />
                </>
              ) : pendingItems.length === 0 ? (
                <p className='py-4 text-center text-sm text-slate-500 dark:text-slate-400'>
                  Nenhuma pendência no momento. 🎉
                </p>
              ) : (
                pendingItems.map((item) => (
                  <PendingItem key={item.id} icon={item.icon} iconBg={item.iconBg} text={item.text} />
                ))
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
              <button className='flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'>
                <MoreHorizontal className='h-4 w-4' />
              </button>
            </div>

            {/* Input */}
            <div className='mb-4'>
              <input
                className='box-border w-full rounded bg-slate-50 py-2.5 px-3 text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500'
                placeholder='Adicionar tarefa'
                type='text'
              />
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

