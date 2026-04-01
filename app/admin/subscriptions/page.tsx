'use client'

import {
  RiAlertLine,
  RiArrowUpLine,
  RiBankCardLine,
  RiCloseLine,
  RiEyeLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiRefreshLine,
  RiSearchLine,
} from '@remixicon/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

type SubStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending'

interface AdminPlan {
  id: string
  name: string
  slug: string
  subscriberCount: number
}

interface SubscriptionRow {
  subscription: {
    id: string
    therapistId: string
    planId: string
    status: string
    billingType: string | null
    cycle: string | null
    amount: string
    currentPeriodStart: Date | string | null
    currentPeriodEnd: Date | string | null
    asaasSubscriptionId: string | null
    createdAt: Date | string
  }
  plan: { name: string; id: string }
  therapistName: string | null
  therapistEmail: string | null
}

interface RevenueStat {
  planId: string
  planName: string | null
  count: number
  revenue: string
}

const statusLabels: Record<SubStatus, string> = {
  active: 'Ativa',
  past_due: 'Vencida',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  pending: 'Pendente',
}

const statusColors: Record<SubStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  past_due: 'bg-amber-500/20 text-amber-400',
  cancelled: 'bg-rose-500/20 text-rose-400',
  expired: 'bg-red-500/20 text-red-400',
  pending: 'bg-blue-500/20 text-blue-400',
}

const cycleLabels: Record<string, string> = {
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
}

const billingLabels: Record<string, string> = {
  CREDIT_CARD: 'Cartão',
  PIX: 'PIX',
}

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubStatus | 'all'>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [detailSubId, setDetailSubId] = useState<string | null>(null)
  const [overrideSubId, setOverrideSubId] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const { data: stats } = trpc.therapistSubscription.getRevenueStats.useQuery() as {
    data:
      | {
          activeSubscriptions: number
          pastDueSubscriptions: number
          mrr: string
          byPlan: RevenueStat[]
          byBillingType: { billingType: string; count: number }[]
        }
      | undefined
  }
  const { data: plans } = trpc.subscriptionPlans.getAll.useQuery() as {
    data: AdminPlan[] | undefined
  }

  const {
    data: rawData,
    isLoading,
    refetch,
  } = trpc.therapistSubscription.getAllSubscriptions.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    planId: planFilter === 'all' ? undefined : planFilter,
    search: searchQuery || undefined,
    limit: 50,
    offset: 0,
  })

  const data = rawData as { subscriptions: SubscriptionRow[]; total: number } | undefined

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Assinaturas</h1>
          <p className='mt-1 text-slate-400'>Gerencie assinaturas Asaas dos terapeutas</p>
        </div>
        <button
          className='flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700'
          onClick={() => refetch()}
          type='button'
        >
          <RiRefreshLine className='h-4 w-4' />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatsCard
          color='emerald'
          icon={<RiGroupLine className='h-5 w-5' />}
          title='Assinaturas Ativas'
          value={stats?.activeSubscriptions ?? 0}
        />
        <StatsCard
          color='amber'
          icon={<RiAlertLine className='h-5 w-5' />}
          title='Vencidas'
          value={stats?.pastDueSubscriptions ?? 0}
        />
        <StatsCard
          color='violet'
          icon={<RiArrowUpLine className='h-5 w-5' />}
          title='MRR'
          value={formatCurrency(Number(stats?.mrr ?? 0))}
        />
        <StatsCard
          color='blue'
          icon={<RiBankCardLine className='h-5 w-5' />}
          title='Total Registros'
          value={data?.total ?? 0}
        />
      </div>

      {/* Revenue by plan */}
      {stats?.byPlan && stats.byPlan.length > 0 && (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.byPlan.map((p) => (
            <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-3' key={p.planId}>
              <p className='text-xs text-slate-400'>{p.planName}</p>
              <p className='text-lg font-bold text-white'>{p.count} assinantes</p>
              <p className='text-xs text-emerald-400'>R$ {Number(p.revenue).toFixed(2)} total</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <RiSearchLine className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <input
            className='w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar por nome ou email...'
            type='text'
            value={searchQuery}
          />
        </div>
        <select
          className='rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none'
          onChange={(e) => setStatusFilter(e.target.value as SubStatus | 'all')}
          value={statusFilter}
        >
          <option value='all'>Todos os Status</option>
          <option value='active'>Ativas</option>
          <option value='past_due'>Vencidas</option>
          <option value='expired'>Expiradas</option>
          <option value='pending'>Pendentes</option>
          <option value='cancelled'>Canceladas</option>
        </select>
        <select
          className='rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none'
          onChange={(e) => setPlanFilter(e.target.value)}
          value={planFilter}
        >
          <option value='all'>Todos os Planos</option>
          {plans?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-700 bg-slate-800'>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Terapeuta
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Plano
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Status
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Ciclo
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Valor
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Período
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {isLoading ? (
                [...new Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className='px-5 py-4' colSpan={7}>
                      <div className='h-10 animate-pulse rounded bg-slate-700' />
                    </td>
                  </tr>
                ))
              ) : data?.subscriptions.length === 0 ? (
                <tr>
                  <td className='px-5 py-12 text-center text-slate-400' colSpan={7}>
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : (
                data?.subscriptions.map((row) => (
                  <tr className='transition-colors hover:bg-slate-800/50' key={row.subscription.id}>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/20 text-sm font-medium text-violet-400'>
                          {row.therapistName?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className='text-sm font-medium text-white'>{row.therapistName}</p>
                          <p className='text-xs text-slate-500'>{row.therapistEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3 text-sm text-slate-300'>{row.plan.name}</td>
                    <td className='px-5 py-3'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[row.subscription.status as SubStatus] ??
                          'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {statusLabels[row.subscription.status as SubStatus] ??
                          row.subscription.status}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-sm text-slate-300'>
                      <span className='text-xs'>
                        {cycleLabels[row.subscription.cycle ?? ''] ?? row.subscription.cycle}
                      </span>
                      <span className='ml-1 text-xs text-slate-500'>
                        (
                        {billingLabels[row.subscription.billingType ?? ''] ??
                          row.subscription.billingType}
                        )
                      </span>
                    </td>
                    <td className='px-5 py-3 text-sm font-medium text-white'>
                      R$ {Number(row.subscription.amount).toFixed(2)}
                    </td>
                    <td className='px-5 py-3 text-xs text-slate-400'>
                      {row.subscription.currentPeriodStart
                        ? formatDate(row.subscription.currentPeriodStart)
                        : '-'}
                      {' → '}
                      {row.subscription.currentPeriodEnd
                        ? formatDate(row.subscription.currentPeriodEnd)
                        : '-'}
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-1'>
                        <button
                          className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white'
                          onClick={() => setDetailSubId(row.subscription.id)}
                          title='Detalhes'
                          type='button'
                        >
                          <RiEyeLine className='h-4 w-4' />
                        </button>
                        <button
                          className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white'
                          onClick={() => setOverrideSubId(row.subscription.id)}
                          title='Alterar status'
                          type='button'
                        >
                          <RiRefreshLine className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.total > 50 && (
          <div className='border-t border-slate-700 px-5 py-3 text-center text-xs text-slate-400'>
            Mostrando 50 de {data.total} assinaturas
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailSubId && (
        <DetailModal onClose={() => setDetailSubId(null)} subscriptionId={detailSubId} />
      )}

      {/* Override Modal */}
      {overrideSubId && (
        <OverrideModal
          onClose={() => setOverrideSubId(null)}
          onSuccess={() => {
            setOverrideSubId(null)
            utils.therapistSubscription.getAllSubscriptions.invalidate()
            utils.therapistSubscription.getRevenueStats.invalidate()
          }}
          subscriptionId={overrideSubId}
        />
      )}
    </div>
  )
}

// ============================================
// Detail Modal
// ============================================

function DetailModal({ subscriptionId, onClose }: { subscriptionId: string; onClose: () => void }) {
  const { data: rawDetail, isLoading } = trpc.therapistSubscription.getSubscriptionDetail.useQuery({
    subscriptionId,
  })

  const data = rawDetail as
    | {
        subscription: SubscriptionRow['subscription']
        plan: { name: string; id: string }
        therapistName: string | null
        therapistEmail: string | null
        payments: {
          id: string
          amount: string
          status: string | null
          dueDate: Date | string | null
          invoiceUrl: string | null
        }[]
      }
    | null
    | undefined

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl'>
        <div className='sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4'>
          <h2 className='text-lg font-bold text-white'>Detalhes da Assinatura</h2>
          <button
            className='rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white'
            onClick={onClose}
            type='button'
          >
            <RiCloseLine className='h-5 w-5' />
          </button>
        </div>

        {isLoading ? (
          <div className='p-6 space-y-3'>
            {[1, 2, 3].map((i) => (
              <div className='h-6 animate-pulse rounded bg-slate-700' key={i} />
            ))}
          </div>
        ) : data ? (
          <div className='p-6 space-y-6'>
            {/* Therapist info */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <InfoRow label='Terapeuta' value={data.therapistName ?? '-'} />
              <InfoRow label='Email' value={data.therapistEmail ?? '-'} />
              <InfoRow label='Plano' value={data.plan.name} />
              <InfoRow
                label='Status'
                value={
                  statusLabels[data.subscription.status as SubStatus] ?? data.subscription.status
                }
              />
              <InfoRow label='Ciclo' value={cycleLabels[data.subscription.cycle ?? ''] ?? '-'} />
              <InfoRow
                label='Forma de pagamento'
                value={billingLabels[data.subscription.billingType ?? ''] ?? '-'}
              />
              <InfoRow label='Valor' value={`R$ ${Number(data.subscription.amount).toFixed(2)}`} />
              <InfoRow label='Asaas ID' value={data.subscription.asaasSubscriptionId ?? '-'} />
            </div>

            {/* Payment history */}
            <div>
              <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400'>
                Histórico de Pagamentos
              </h3>
              {data.payments.length === 0 ? (
                <p className='text-sm text-slate-500'>Nenhum pagamento registrado</p>
              ) : (
                <div className='space-y-2'>
                  {data.payments.map((pmt) => (
                    <div
                      className='flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5'
                      key={pmt.id}
                    >
                      <div className='flex items-center gap-3'>
                        <RiMoneyDollarCircleLine className='h-4 w-4 text-slate-500' />
                        <div>
                          <p className='text-sm text-white'>R$ {Number(pmt.amount).toFixed(2)}</p>
                          <p className='text-xs text-slate-500'>
                            {pmt.dueDate ? formatDate(pmt.dueDate) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            pmt.status === 'RECEIVED' || pmt.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : pmt.status === 'OVERDUE'
                                ? 'bg-red-500/20 text-red-400'
                                : pmt.status === 'PENDING'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {pmt.status}
                        </span>
                        {pmt.invoiceUrl && (
                          <a
                            className='ml-2 text-xs text-violet-400 hover:underline'
                            href={pmt.invoiceUrl}
                            rel='noopener noreferrer'
                            target='_blank'
                          >
                            Fatura
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='p-6 text-center text-slate-400'>Assinatura não encontrada</div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-xs text-slate-500'>{label}</p>
      <p className='text-sm font-medium text-white'>{value}</p>
    </div>
  )
}

// ============================================
// Override Status Modal
// ============================================

function OverrideModal({
  subscriptionId,
  onClose,
  onSuccess,
}: {
  subscriptionId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [newStatus, setNewStatus] = useState<'active' | 'past_due' | 'cancelled' | 'expired'>(
    'active'
  )
  const [reason, setReason] = useState('')

  const mutation = trpc.therapistSubscription.overrideStatus.useMutation({
    onSuccess: () => {
      toast.success('Status alterado com sucesso')
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl'>
        <div className='flex items-center justify-between border-b border-slate-700 px-6 py-4'>
          <h2 className='text-lg font-bold text-white'>Alterar Status</h2>
          <button
            className='rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white'
            onClick={onClose}
            type='button'
          >
            <RiCloseLine className='h-5 w-5' />
          </button>
        </div>

        <div className='space-y-4 p-6'>
          <div>
            <label className='mb-1.5 block text-sm font-medium text-slate-300'>Novo Status</label>
            <select
              className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-violet-500 focus:outline-none'
              onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
              value={newStatus}
            >
              <option value='active'>Ativa</option>
              <option value='past_due'>Vencida</option>
              <option value='cancelled'>Cancelada</option>
              <option value='expired'>Expirada</option>
            </select>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-medium text-slate-300'>
              Motivo (opcional)
            </label>
            <textarea
              className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none'
              onChange={(e) => setReason(e.target.value)}
              placeholder='Motivo da alteração manual...'
              rows={2}
              value={reason}
            />
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <button
              className='rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-700'
              onClick={onClose}
              type='button'
            >
              Cancelar
            </button>
            <button
              className='rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50'
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  subscriptionId,
                  status: newStatus,
                  reason: reason || undefined,
                })
              }
              type='button'
            >
              {mutation.isPending ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stats Card
// ============================================

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'violet' | 'emerald' | 'amber' | 'blue'
}) {
  const colorClasses = {
    violet: 'bg-violet-600/20 text-violet-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400',
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
          {icon}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Helpers
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}
