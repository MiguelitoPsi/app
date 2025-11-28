'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type SubscriptionPlan = 'trial' | 'monthly' | 'quarterly' | 'yearly'
type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending'
type DisplayStatus =
  | 'no_subscription'
  | 'active'
  | 'expired'
  | 'expiring_soon'
  | 'cancelled'
  | 'pending'

const planLabels: Record<SubscriptionPlan, string> = {
  trial: 'Trial',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

const statusLabels: Record<DisplayStatus, string> = {
  no_subscription: 'Sem Assinatura',
  active: 'Ativa',
  expired: 'Expirada',
  expiring_soon: 'Expirando',
  cancelled: 'Cancelada',
  pending: 'Pendente',
}

const statusColors: Record<DisplayStatus, string> = {
  no_subscription: 'bg-slate-500/20 text-slate-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  expired: 'bg-red-500/20 text-red-400',
  expiring_soon: 'bg-amber-500/20 text-amber-400',
  cancelled: 'bg-rose-500/20 text-rose-400',
  pending: 'bg-blue-500/20 text-blue-400',
}

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPsychologist, setSelectedPsychologist] = useState<{
    id: string
    name: string
    email: string
    subscription: {
      plan: SubscriptionPlan
      status: SubscriptionStatus
      amount: number
      startDate: Date
      endDate: Date
      lastPaymentDate: Date | null
      nextPaymentDate: Date | null
      paymentMethod: string | null
      notes: string | null
    } | null
  } | null>(null)

  const {
    data: psychologists,
    isLoading,
    refetch,
  } = trpc.admin.getPsychologistsWithSubscriptions.useQuery()
  const { data: stats } = trpc.admin.getSubscriptionStats.useQuery()

  const filteredPsychologists = psychologists?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.subscriptionStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const openEditModal = (psychologist: typeof selectedPsychologist) => {
    setSelectedPsychologist(psychologist)
    setIsModalOpen(true)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-white'>Assinaturas</h1>
        <p className='mt-1 text-slate-400'>Gerencie as assinaturas dos psicólogos</p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        <StatsCard
          color='violet'
          icon='🧠'
          title='Total Psicólogos'
          value={stats?.totalPsychologists ?? 0}
        />
        <StatsCard
          color='emerald'
          icon='✅'
          title='Assinaturas Ativas'
          value={stats?.activeSubscriptions ?? 0}
        />
        <StatsCard
          color='amber'
          icon='⚠️'
          title='Expirando em 7 dias'
          value={stats?.expiringSoon ?? 0}
        />
        <StatsCard
          color='red'
          icon='❌'
          title='Expiradas'
          value={stats?.expiredSubscriptions ?? 0}
        />
        <StatsCard
          color='blue'
          icon='💰'
          isMonetary
          title='Receita Mensal'
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
        />
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='relative flex-1'>
          <SearchIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
          <input
            className='w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar por nome ou email...'
            type='text'
            value={searchQuery}
          />
        </div>
        <select
          className='rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
          onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | 'all')}
          value={statusFilter}
        >
          <option value='all'>Todos os Status</option>
          <option value='active'>Ativas</option>
          <option value='expiring_soon'>Expirando</option>
          <option value='expired'>Expiradas</option>
          <option value='pending'>Pendentes</option>
          <option value='cancelled'>Canceladas</option>
          <option value='no_subscription'>Sem Assinatura</option>
        </select>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-700 bg-slate-800'>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Psicólogo
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Status
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Plano
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Valor
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Vencimento
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Último Pagamento
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {isLoading ? (
                [...new Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className='px-6 py-4' colSpan={7}>
                      <div className='h-10 animate-pulse rounded bg-slate-700' />
                    </td>
                  </tr>
                ))
              ) : filteredPsychologists?.length === 0 ? (
                <tr>
                  <td className='px-6 py-12 text-center text-slate-400' colSpan={7}>
                    Nenhum psicólogo encontrado
                  </td>
                </tr>
              ) : (
                filteredPsychologists?.map((psychologist) => (
                  <tr className='transition-colors hover:bg-slate-800/50' key={psychologist.id}>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400'>
                          {psychologist.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='font-medium text-white'>{psychologist.name}</p>
                          <p className='text-sm text-slate-400'>{psychologist.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColors[psychologist.subscriptionStatus]
                        }`}
                      >
                        {statusLabels[psychologist.subscriptionStatus]}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-slate-300'>
                      {psychologist.subscription
                        ? planLabels[psychologist.subscription.plan as SubscriptionPlan]
                        : '-'}
                    </td>
                    <td className='px-6 py-4 text-slate-300'>
                      {psychologist.subscription
                        ? formatCurrency(psychologist.subscription.amount)
                        : '-'}
                    </td>
                    <td className='px-6 py-4 text-slate-300'>
                      {psychologist.subscription
                        ? formatDate(psychologist.subscription.endDate)
                        : '-'}
                    </td>
                    <td className='px-6 py-4 text-slate-300'>
                      {psychologist.subscription?.lastPaymentDate
                        ? formatDate(psychologist.subscription.lastPaymentDate)
                        : '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        className='rounded-lg bg-violet-600/20 px-3 py-1.5 text-sm font-medium text-violet-400 transition-colors hover:bg-violet-600/30'
                        onClick={() =>
                          openEditModal({
                            id: psychologist.id,
                            name: psychologist.name,
                            email: psychologist.email,
                            subscription: psychologist.subscription,
                          })
                        }
                        type='button'
                      >
                        {psychologist.subscription ? 'Editar' : 'Adicionar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedPsychologist && (
        <SubscriptionModal
          onClose={() => {
            setIsModalOpen(false)
            setSelectedPsychologist(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedPsychologist(null)
            refetch()
          }}
          psychologist={selectedPsychologist}
        />
      )}
    </div>
  )
}

function SubscriptionModal({
  psychologist,
  onClose,
  onSuccess,
}: {
  psychologist: {
    id: string
    name: string
    email: string
    subscription: {
      plan: SubscriptionPlan
      status: SubscriptionStatus
      amount: number
      startDate: Date
      endDate: Date
      lastPaymentDate: Date | null
      nextPaymentDate: Date | null
      paymentMethod: string | null
      notes: string | null
    } | null
  }
  onClose: () => void
  onSuccess: () => void
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>(psychologist.subscription?.plan ?? 'monthly')
  const [status, setStatus] = useState<SubscriptionStatus>(
    psychologist.subscription?.status ?? 'active'
  )
  const [amount, setAmount] = useState(
    psychologist.subscription ? (psychologist.subscription.amount / 100).toString() : ''
  )
  const [startDate, setStartDate] = useState(
    psychologist.subscription
      ? formatDateInput(psychologist.subscription.startDate)
      : formatDateInput(new Date())
  )
  const [endDate, setEndDate] = useState(
    psychologist.subscription
      ? formatDateInput(psychologist.subscription.endDate)
      : formatDateInput(addMonths(new Date(), 1))
  )
  const [lastPaymentDate, setLastPaymentDate] = useState(
    psychologist.subscription?.lastPaymentDate
      ? formatDateInput(psychologist.subscription.lastPaymentDate)
      : ''
  )
  const [paymentMethod, setPaymentMethod] = useState(psychologist.subscription?.paymentMethod ?? '')
  const [notes, setNotes] = useState(psychologist.subscription?.notes ?? '')
  const [error, setError] = useState('')

  const upsertSubscription = trpc.admin.upsertSubscription.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const deleteSubscription = trpc.admin.deleteSubscription.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (amount === '' || startDate === '' || endDate === '') {
      setError('Preencha os campos obrigatórios')
      return
    }

    const amountInCents = Math.round(Number.parseFloat(amount) * 100)
    if (Number.isNaN(amountInCents) || amountInCents < 0) {
      setError('Valor inválido')
      return
    }

    upsertSubscription.mutate({
      psychologistId: psychologist.id,
      plan,
      status,
      amount: amountInCents,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      lastPaymentDate: lastPaymentDate !== '' ? new Date(lastPaymentDate) : undefined,
      nextPaymentDate: undefined,
      paymentMethod: paymentMethod !== '' ? paymentMethod : undefined,
      notes: notes !== '' ? notes : undefined,
    })
  }

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja remover a assinatura deste psicólogo?')) {
      deleteSubscription.mutate({ psychologistId: psychologist.id })
    }
  }

  // Auto-calculate end date when plan changes
  const handlePlanChange = (newPlan: SubscriptionPlan) => {
    setPlan(newPlan)
    const start = new Date(startDate)
    let months = 1
    switch (newPlan) {
      case 'trial':
        months = 0
        setEndDate(formatDateInput(addDays(start, 14))) // 14 days trial
        return
      case 'monthly':
        months = 1
        break
      case 'quarterly':
        months = 3
        break
      case 'yearly':
        months = 12
        break
    }
    setEndDate(formatDateInput(addMonths(start, months)))
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-white'>
              {psychologist.subscription ? 'Editar Assinatura' : 'Nova Assinatura'}
            </h2>
            <p className='text-sm text-slate-400'>{psychologist.name}</p>
          </div>
          <button
            aria-label='Fechar modal'
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:scale-110 active:scale-95'
            onClick={onClose}
            type='button'
          >
            <CloseIcon />
          </button>
        </div>

        <form className='space-y-4' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400'>{error}</div>
          )}

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='plan'>
                Plano
              </label>
              <select
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='plan'
                onChange={(e) => handlePlanChange(e.target.value as SubscriptionPlan)}
                value={plan}
              >
                <option value='trial'>Trial (14 dias)</option>
                <option value='monthly'>Mensal</option>
                <option value='quarterly'>Trimestral</option>
                <option value='yearly'>Anual</option>
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='status'>
                Status
              </label>
              <select
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='status'
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                value={status}
              >
                <option value='active'>Ativa</option>
                <option value='pending'>Pendente</option>
                <option value='expired'>Expirada</option>
                <option value='cancelled'>Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='amount'>
              Valor (R$)
            </label>
            <input
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='amount'
              onChange={(e) => setAmount(e.target.value)}
              placeholder='99.90'
              step='0.01'
              type='number'
              value={amount}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='startDate'>
                Data de Início
              </label>
              <input
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='startDate'
                onChange={(e) => setStartDate(e.target.value)}
                type='date'
                value={startDate}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='endDate'>
                Data de Vencimento
              </label>
              <input
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='endDate'
                onChange={(e) => setEndDate(e.target.value)}
                type='date'
                value={endDate}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label
                className='mb-2 block text-sm font-medium text-slate-300'
                htmlFor='lastPaymentDate'
              >
                Último Pagamento
              </label>
              <input
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='lastPaymentDate'
                onChange={(e) => setLastPaymentDate(e.target.value)}
                type='date'
                value={lastPaymentDate}
              />
            </div>

            <div>
              <label
                className='mb-2 block text-sm font-medium text-slate-300'
                htmlFor='paymentMethod'
              >
                Método de Pagamento
              </label>
              <select
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='paymentMethod'
                onChange={(e) => setPaymentMethod(e.target.value)}
                value={paymentMethod}
              >
                <option value=''>Selecionar...</option>
                <option value='pix'>PIX</option>
                <option value='credit_card'>Cartão de Crédito</option>
                <option value='debit_card'>Cartão de Débito</option>
                <option value='bank_transfer'>Transferência</option>
                <option value='boleto'>Boleto</option>
              </select>
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='notes'>
              Observações
            </label>
            <textarea
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='notes'
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Observações sobre a assinatura...'
              rows={3}
              value={notes}
            />
          </div>

          <div className='flex gap-3 pt-4'>
            {psychologist.subscription && (
              <button
                className='rounded-lg border border-red-500/50 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20'
                disabled={deleteSubscription.isPending}
                onClick={handleDelete}
                type='button'
              >
                Remover
              </button>
            )}
            <div className='flex flex-1 gap-3'>
              <button
                className='flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800'
                onClick={onClose}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={upsertSubscription.isPending}
                type='submit'
              >
                {upsertSubscription.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Stats Card Component
type StatsCardProps = {
  title: string
  value: number | string
  icon: string
  color: 'violet' | 'emerald' | 'amber' | 'red' | 'blue'
  isMonetary?: boolean
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    violet: 'bg-violet-600/20 text-violet-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400',
    red: 'bg-red-600/20 text-red-400',
    blue: 'bg-blue-600/20 text-blue-400',
  }

  return (
    <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs text-slate-400'>{title}</p>
          <p className='mt-1 text-xl font-bold text-white'>{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}
        >
          <span className='text-lg'>{icon}</span>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Buscar</title>
      <path
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Fechar</title>
      <path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}
