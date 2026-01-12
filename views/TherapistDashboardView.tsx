'use client'

import {
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Gift,
  MoreHorizontal,
  RefreshCw,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

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

  const totalPatients = patientsData?.length ?? 0
  const pendingInvites = invitesData?.filter((inv) => inv.status === 'pending').length ?? 0
  const totalSessions = dashboardSummary?.activePatients ?? 0

  const pendingItems = [
    { id: 1, icon: Clock, iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', text: 'Sessão sem registro de frequência' },
    { id: 2, icon: FileText, iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', text: 'Documentos pendentes de upload' },
    { id: 3, icon: Users, iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', text: 'Cadastro incompleto' },
  ]

  const isLoading = isLoadingPatients || isLoadingInvites || isLoadingSummary

  return (
    <div className='box-border h-full w-full overflow-hidden bg-slate-50 p-5 dark:bg-slate-900'>
      {/* CORPO PRINCIPAL - GRID */}
      <div className='grid h-full grid-cols-12 gap-5'>
        {/* COLUNA ESQUERDA (30%) */}
        <div className='col-span-12 flex flex-col gap-5 lg:col-span-4'>
          {/* Próximas Sessões */}
          <Card>
            <div className='flex flex-row items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
              <Calendar className='h-5 w-5 flex-shrink-0 text-purple-500' />
              <h2 className='text-base font-semibold text-slate-800 dark:text-white'>Próximas sessões</h2>
            </div>
            <div className='flex flex-col'>
              {isLoading ? (
                <div className='flex flex-col gap-2'>
                  <div className='h-4 w-full rounded bg-slate-100 dark:bg-slate-700' />
                  <div className='h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-700' />
                </div>
              ) : totalSessions === 0 ? (
                <div className='flex flex-col gap-4'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Você ainda não cadastrou sessões para os próximos dias.
                  </p>
                  <button className='flex flex-row items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700'>
                    <Calendar className='h-4 w-4' />
                    Cadastrar horário
                  </button>
                </div>
              ) : (
                <p className='text-sm text-slate-600 dark:text-slate-300'>{totalSessions} sessões agendadas.</p>
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
              count={totalSessions}
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
                <CounterBadge count={pendingItems.length + pendingInvites} />
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
    </div>
  )
}

export default TherapistDashboardView
