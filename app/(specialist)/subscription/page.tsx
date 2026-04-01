'use client'

import {
  RiAlertLine,
  RiBankCardLine,
  RiCheckLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiFlashlightLine,
  RiReceiptLine,
  RiVipCrownLine,
} from '@remixicon/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

type Cycle = 'MONTHLY' | 'YEARLY'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPrice: string
  yearlyPrice: string
  maxPatients: number | null
  features: Record<string, boolean | number>
  isActive: boolean
  sortOrder: number
}

interface Payment {
  id: string
  amount: string
  status: string | null
  dueDate: Date | string | null
  invoiceUrl: string | null
}

export default function SubscriptionPage() {
  const [selectedCycle, setSelectedCycle] = useState<Cycle>('MONTHLY')
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)

  const { data: subscriptionStatus, isLoading: isLoadingStatus } =
    trpc.therapistSubscription.getMySubscription.useQuery()

  const { data: activePlans, isLoading: isLoadingPlans } =
    trpc.subscriptionPlans.getActive.useQuery() as {
      data: Plan[] | undefined
      isLoading: boolean
    }

  const { data: paymentHistoryData } = trpc.therapistSubscription.getPaymentHistory.useQuery({
    limit: 10,
    offset: 0,
  })

  const paymentHistory = (paymentHistoryData?.payments ?? []) as Payment[]

  const { data: currentPaymentLink } = trpc.therapistSubscription.getCurrentPaymentLink.useQuery(
    undefined,
    {
      enabled: subscriptionStatus?.status !== 'none',
    }
  ) as { data: { invoiceUrl?: string } | null | undefined }

  const subscribeMutation = trpc.therapistSubscription.subscribe.useMutation({
    onSuccess: (data: { invoiceUrl?: string }) => {
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank')
        toast.success('Redirecionando para pagamento...')
      } else {
        toast.success('Assinatura criada! Aguardando confirmação de pagamento.')
      }
    },
    onError: (err) => toast.error(err.message),
  })

  const cancelMutation = trpc.therapistSubscription.cancel.useMutation({
    onSuccess: () => {
      toast.success('Assinatura cancelada. Você ainda tem acesso até o final do período.')
    },
    onError: (err) => toast.error(err.message),
  })

  const utils = trpc.useUtils()

  const handleSubscribe = (planId: string) => {
    setSubscribingPlanId(planId)
    subscribeMutation.mutate(
      { planId, cycle: selectedCycle, billingType: 'CREDIT_CARD' },
      {
        onSettled: () => {
          setSubscribingPlanId(null)
          utils.therapistSubscription.getMySubscription.invalidate()
        },
      }
    )
  }

  const handleCancel = () => {
    if (
      !window.confirm(
        'Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o final do período pago.'
      )
    )
      return
    cancelMutation.mutate(
      {},
      {
        onSettled: () => utils.therapistSubscription.getMySubscription.invalidate(),
      }
    )
  }

  const hasActiveSub =
    subscriptionStatus?.status === 'active' || subscriptionStatus?.status === 'past_due'

  const isLoading = isLoadingStatus || isLoadingPlans

  if (isLoading) {
    return (
      <div className='mx-auto max-w-5xl space-y-6 p-4 md:p-6'>
        <div className='h-8 w-48 animate-pulse rounded bg-slate-700' />
        <div className='grid gap-4 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div className='h-80 animate-pulse rounded-2xl bg-slate-800/50' key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-5xl space-y-8 p-4 md:p-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>Assinatura</h1>
        <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
          Gerencie seu plano e pagamentos
        </p>
      </div>

      {/* Current subscription info */}
      {subscriptionStatus?.status !== 'none' && 'subscription' in subscriptionStatus! && (
        <CurrentSubscriptionCard
          isCancelling={cancelMutation.isPending}
          onCancel={handleCancel}
          paymentLink={currentPaymentLink?.invoiceUrl ?? null}
          subscriptionStatus={subscriptionStatus!}
        />
      )}

      {/* Plan selector */}
      {!hasActiveSub && (
        <>
          {/* Cycle toggle */}
          <div className='flex items-center justify-center gap-3'>
            <span
              className={`text-sm font-medium ${
                selectedCycle === 'MONTHLY' ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              Mensal
            </span>
            <button
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                selectedCycle === 'YEARLY' ? 'bg-violet-600' : 'bg-slate-600'
              }`}
              onClick={() => setSelectedCycle((c) => (c === 'MONTHLY' ? 'YEARLY' : 'MONTHLY'))}
              type='button'
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  selectedCycle === 'YEARLY' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                selectedCycle === 'YEARLY' ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              Anual
            </span>
            {selectedCycle === 'YEARLY' && (
              <span className='rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400'>
                Até 20% off
              </span>
            )}
          </div>

          {/* Plans grid */}
          <div className='grid gap-5 md:grid-cols-3'>
            {activePlans?.map((plan, idx) => {
              const price =
                selectedCycle === 'MONTHLY'
                  ? Number(plan.monthlyPrice)
                  : Number(plan.yearlyPrice) / 12
              const totalPrice =
                selectedCycle === 'MONTHLY' ? Number(plan.monthlyPrice) : Number(plan.yearlyPrice)
              const isPopular = idx === 1 // middle plan highlighted

              return (
                <div
                  className={`relative rounded-2xl border p-6 transition-all ${
                    isPopular
                      ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10 dark:bg-violet-500/5'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                  }`}
                  key={plan.id}
                >
                  {isPopular && (
                    <div className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white'>
                      Mais Popular
                    </div>
                  )}

                  <div className='mb-4'>
                    <h3 className='text-lg font-bold text-slate-900 dark:text-white'>
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className='mt-1 text-xs text-slate-500'>{plan.description}</p>
                    )}
                  </div>

                  <div className='mb-6'>
                    <div className='flex items-baseline gap-1'>
                      <span className='text-3xl font-bold text-slate-900 dark:text-white'>
                        R$ {price.toFixed(2)}
                      </span>
                      <span className='text-sm text-slate-400'>/mês</span>
                    </div>
                    {selectedCycle === 'YEARLY' && (
                      <p className='mt-1 text-xs text-slate-400'>
                        R$ {totalPrice.toFixed(2)} cobrado anualmente
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className='mb-6 space-y-2'>
                    {plan.maxPatients !== null && plan.maxPatients > 0 && (
                      <FeatureItem enabled label={`Até ${plan.maxPatients} pacientes`} />
                    )}
                    {plan.maxPatients === 0 && <FeatureItem enabled label='Pacientes ilimitados' />}
                    {plan.features &&
                      typeof plan.features === 'object' &&
                      Object.entries(plan.features).map(([key, value]) => {
                        if (key === 'max_patients' || key === 'max_uploads_month') return null
                        const enabled = typeof value === 'boolean' ? value : Number(value) > 0
                        const label = featureLabel(key)
                        return <FeatureItem enabled={enabled} key={key} label={label} />
                      })}
                  </div>

                  <button
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      isPopular
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                    }`}
                    disabled={subscribeMutation.isPending}
                    onClick={() => handleSubscribe(plan.id)}
                    type='button'
                  >
                    {subscribingPlanId === plan.id ? (
                      <span className='inline-flex items-center gap-2'>
                        <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                        Processando...
                      </span>
                    ) : (
                      'Assinar'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div>
          <h2 className='mb-4 text-lg font-bold text-slate-900 dark:text-white'>
            <RiReceiptLine className='mr-2 inline h-5 w-5' />
            Histórico de Pagamentos
          </h2>
          <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500'>
                    Data
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500'>
                    Valor
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500'>
                    Fatura
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                {paymentHistory.map((pmt) => (
                  <tr className='bg-white dark:bg-slate-800/50' key={pmt.id}>
                    <td className='px-4 py-3 text-sm text-slate-700 dark:text-slate-300'>
                      {pmt.dueDate ? new Date(pmt.dueDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-slate-900 dark:text-white'>
                      R$ {Number(pmt.amount).toFixed(2)}
                    </td>
                    <td className='px-4 py-3'>
                      <PaymentStatusBadge status={pmt.status ?? ''} />
                    </td>
                    <td className='px-4 py-3'>
                      {pmt.invoiceUrl ? (
                        <a
                          className='inline-flex items-center gap-1 text-xs text-violet-500 hover:underline'
                          href={pmt.invoiceUrl}
                          rel='noopener noreferrer'
                          target='_blank'
                        >
                          <RiExternalLinkLine className='h-3 w-3' />
                          Ver
                        </a>
                      ) : (
                        <span className='text-xs text-slate-400'>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function CurrentSubscriptionCard({
  subscriptionStatus,
  paymentLink,
  onCancel,
  isCancelling,
}: {
  subscriptionStatus: {
    status: string
    subscription?: {
      planName?: string
      planSlug?: string
      status: string
      cycle?: string
      billingType?: string
      amount?: string
      currentPeriodEnd?: Date | string | null
    }
    daysRemaining?: number
  }
  paymentLink: string | null
  onCancel: () => void
  isCancelling: boolean
}) {
  const sub = subscriptionStatus.subscription
  const isActive = subscriptionStatus.status === 'active'
  const isPastDue = subscriptionStatus.status === 'past_due'
  const isCancelled = subscriptionStatus.status === 'cancelled'

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-900/10'
          : isPastDue
            ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-900/10'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
      }`}
    >
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isActive
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                : isPastDue
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
            }`}
          >
            {isActive ? (
              <RiVipCrownLine className='h-6 w-6' />
            ) : isPastDue ? (
              <RiAlertLine className='h-6 w-6' />
            ) : (
              <RiBankCardLine className='h-6 w-6' />
            )}
          </div>
          <div>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Plano atual</p>
            <p className='text-lg font-bold text-slate-900 dark:text-white'>
              {sub?.planName ?? 'N/A'}
            </p>
            <div className='mt-1 flex items-center gap-2 text-xs text-slate-400'>
              <span>{sub?.cycle === 'YEARLY' ? 'Anual' : 'Mensal'}</span>
              <span>·</span>
              <span>R$ {Number(sub?.amount ?? 0).toFixed(2)}</span>
              {sub?.currentPeriodEnd && (
                <>
                  <span>·</span>
                  <span>Vence em {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {isPastDue && paymentLink && (
            <a
              className='flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700'
              href={paymentLink}
              rel='noopener noreferrer'
              target='_blank'
            >
              <RiFlashlightLine className='h-4 w-4' />
              Pagar agora
            </a>
          )}
          {(isActive || isPastDue) && (
            <button
              className='rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50'
              disabled={isCancelling}
              onClick={onCancel}
              type='button'
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar plano'}
            </button>
          )}
          {isCancelled && (
            <span className='rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400'>
              Cancelada
            </span>
          )}
        </div>
      </div>

      {isPastDue && subscriptionStatus.daysRemaining !== undefined && (
        <div className='mt-3 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400'>
          <RiAlertLine className='mr-2 inline h-4 w-4' />
          Pagamento pendente. Você tem {subscriptionStatus.daysRemaining} dias restantes de acesso.
        </div>
      )}
    </div>
  )
}

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      {enabled ? (
        <RiCheckLine className='h-4 w-4 text-emerald-500' />
      ) : (
        <RiCloseLine className='h-4 w-4 text-slate-400' />
      )}
      <span
        className={`text-sm ${
          enabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RECEIVED: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    CONFIRMED: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    PENDING: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    OVERDUE: 'bg-red-500/20 text-red-600 dark:text-red-400',
    REFUNDED: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  }
  const labels: Record<string, string> = {
    RECEIVED: 'Pago',
    CONFIRMED: 'Confirmado',
    PENDING: 'Pendente',
    OVERDUE: 'Vencido',
    REFUNDED: 'Estornado',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] ?? 'bg-slate-500/20 text-slate-400'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}

function featureLabel(key: string): string {
  const labels: Record<string, string> = {
    ai_analysis: 'Análise com IA',
    transcription: 'Transcrição de sessões',
    weekly_reports: 'Relatórios semanais',
    cognitive_conceptualization: 'Conceitualização cognitiva',
    financial_module: 'Módulo financeiro',
    session_documents: 'Documentos de sessão',
    custom_tasks_for_patients: 'Tarefas personalizadas',
    therapeutic_plan: 'Plano terapêutico',
  }
  return labels[key] ?? key
}
