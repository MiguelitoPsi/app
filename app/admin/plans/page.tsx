'use client'

import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiGroupLine,
  RiToggleLine,
} from '@remixicon/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

interface PlanData {
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
  subscriberCount: number
}

interface FeatureDef {
  key: string
  label: string
  description: string
  type: 'boolean' | 'number'
  default: boolean | number
}

export default function PlansPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: plans, isLoading } = trpc.subscriptionPlans.getAll.useQuery() as {
    data: PlanData[] | undefined
    isLoading: boolean
  }
  const { data: featureDefs } = trpc.subscriptionPlans.getFeatureDefinitions.useQuery() as {
    data: FeatureDef[] | undefined
  }

  const createMutation = trpc.subscriptionPlans.create.useMutation({
    onSuccess: () => {
      utils.subscriptionPlans.getAll.invalidate()
      setIsModalOpen(false)
      toast.success('Plano criado com sucesso!')
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.subscriptionPlans.update.useMutation({
    onSuccess: () => {
      utils.subscriptionPlans.getAll.invalidate()
      setEditingPlan(null)
      setIsModalOpen(false)
      toast.success('Plano atualizado!')
    },
    onError: (err) => toast.error(err.message),
  })

  const deactivateMutation = trpc.subscriptionPlans.deactivate.useMutation({
    onSuccess: () => {
      utils.subscriptionPlans.getAll.invalidate()
      toast.success('Plano desativado')
    },
  })

  const activateMutation = trpc.subscriptionPlans.activate.useMutation({
    onSuccess: () => {
      utils.subscriptionPlans.getAll.invalidate()
      toast.success('Plano reativado')
    },
  })

  const openCreate = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }

  const openEdit = (planId: string) => {
    setEditingPlan(planId)
    setIsModalOpen(true)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Planos</h1>
          <p className='mt-1 text-slate-400'>Configure os planos de assinatura da plataforma</p>
        </div>
        <button
          className='flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700'
          onClick={openCreate}
          type='button'
        >
          <RiAddLine className='h-4 w-4' />
          Novo Plano
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div className='animate-pulse rounded-2xl bg-slate-800/50 p-6 h-64' key={i} />
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {plans.map((plan) => (
            <div
              className={`relative rounded-2xl border p-6 transition-all ${
                plan.isActive
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-800 bg-slate-900/50 opacity-60'
              }`}
              key={plan.id}
            >
              {/* Status badge */}
              <div className='absolute right-4 top-4 flex items-center gap-2'>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    plan.isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <span className='rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-400'>
                  <RiGroupLine className='mr-1 inline h-3 w-3' />
                  {plan.subscriberCount}
                </span>
              </div>

              {/* Plan info */}
              <div className='mb-4'>
                <h3 className='text-lg font-bold text-white'>{plan.name}</h3>
                <p className='text-xs text-slate-500'>/{plan.slug}</p>
                {plan.description && (
                  <p className='mt-1 text-sm text-slate-400 line-clamp-2'>{plan.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className='mb-4 space-y-1'>
                <div className='flex items-baseline gap-1'>
                  <span className='text-2xl font-bold text-white'>
                    R$ {Number(plan.monthlyPrice).toFixed(2)}
                  </span>
                  <span className='text-sm text-slate-400'>/mês</span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-lg font-semibold text-emerald-400'>
                    R$ {Number(plan.yearlyPrice).toFixed(2)}
                  </span>
                  <span className='text-xs text-slate-500'>/ano</span>
                  {Number(plan.monthlyPrice) > 0 && (
                    <span className='ml-1 text-xs text-emerald-400'>
                      (
                      {Math.round(
                        (1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100
                      )}
                      % off)
                    </span>
                  )}
                </div>
              </div>

              {/* Features summary */}
              <div className='mb-4 space-y-1'>
                <p className='text-xs font-medium uppercase tracking-wider text-slate-500'>
                  Features
                </p>
                <div className='flex flex-wrap gap-1'>
                  {plan.features && typeof plan.features === 'object'
                    ? Object.entries(plan.features).map(([key, value]) => {
                        const enabled = typeof value === 'boolean' ? value : Number(value) > 0
                        const def = featureDefs?.find((d) => d.key === key)
                        if (!def) return null
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              enabled
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                            key={key}
                          >
                            {enabled ? (
                              <RiCheckLine className='h-2.5 w-2.5' />
                            ) : (
                              <RiCloseLine className='h-2.5 w-2.5' />
                            )}
                            {def.label}
                          </span>
                        )
                      })
                    : null}
                </div>
              </div>

              {/* Max patients */}
              {plan.maxPatients !== null && (
                <p className='mb-4 text-xs text-slate-500'>
                  Máx. pacientes:{' '}
                  <span className='text-white font-medium'>
                    {plan.maxPatients === 0 ? 'Ilimitado' : plan.maxPatients}
                  </span>
                </p>
              )}

              {/* Actions */}
              <div className='flex items-center gap-2 border-t border-slate-700 pt-4'>
                <button
                  className='flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-600'
                  onClick={() => openEdit(plan.id)}
                  type='button'
                >
                  <RiEditLine className='h-3 w-3' />
                  Editar
                </button>
                {plan.isActive ? (
                  <button
                    className='flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20'
                    onClick={() => deactivateMutation.mutate({ id: plan.id })}
                    type='button'
                  >
                    <RiToggleLine className='h-3 w-3' />
                    Desativar
                  </button>
                ) : (
                  <button
                    className='flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20'
                    onClick={() => activateMutation.mutate({ id: plan.id })}
                    type='button'
                  >
                    <RiToggleLine className='h-3 w-3' />
                    Ativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16'>
          <p className='text-lg font-medium text-white'>Nenhum plano criado</p>
          <p className='mt-1 text-sm text-slate-400'>
            Crie o primeiro plano para começar a cobrar terapeutas
          </p>
          <button
            className='mt-4 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700'
            onClick={openCreate}
            type='button'
          >
            <RiAddLine className='h-4 w-4' />
            Criar primeiro plano
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <PlanModal
          featureDefs={featureDefs ?? []}
          isCreating={createMutation.isPending}
          isUpdating={updateMutation.isPending}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPlan(null)
          }}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(data) => updateMutation.mutate(data)}
          planId={editingPlan}
          plans={plans ?? []}
        />
      )}
    </div>
  )
}

// ============================================
// Plan Modal Component
// ============================================

interface PlanModalProps {
  planId: string | null
  featureDefs: FeatureDef[]
  plans: PlanData[]
  onClose: () => void
  onCreate: (data: {
    name: string
    slug: string
    description?: string
    monthlyPrice: string
    yearlyPrice: string
    maxPatients: number | null
    features: Record<string, boolean | number>
    isActive: boolean
  }) => void
  onUpdate: (data: {
    id: string
    name?: string
    slug?: string
    description?: string | null
    monthlyPrice?: string
    yearlyPrice?: string
    maxPatients?: number | null
    features?: Record<string, boolean | number>
    isActive?: boolean
  }) => void
  isCreating: boolean
  isUpdating: boolean
}

function PlanModal({
  planId,
  featureDefs,
  plans,
  onClose,
  onCreate,
  onUpdate,
  isCreating,
  isUpdating,
}: PlanModalProps) {
  const existingPlan = planId ? plans.find((p) => p.id === planId) : null
  const isEditing = !!existingPlan

  const [name, setName] = useState(existingPlan?.name ?? '')
  const [slug, setSlug] = useState(existingPlan?.slug ?? '')
  const [description, setDescription] = useState(existingPlan?.description ?? '')
  const [monthlyPrice, setMonthlyPrice] = useState(existingPlan?.monthlyPrice ?? '')
  const [yearlyPrice, setYearlyPrice] = useState(existingPlan?.yearlyPrice ?? '')
  const [maxPatients, setMaxPatients] = useState<string>(
    existingPlan?.maxPatients !== null && existingPlan?.maxPatients !== undefined
      ? String(existingPlan.maxPatients)
      : ''
  )
  const [isActive, setIsActive] = useState(existingPlan?.isActive ?? true)

  // Initialize features from existing plan or defaults
  const [features, setFeatures] = useState<Record<string, boolean | number>>(() => {
    if (existingPlan?.features) {
      return { ...existingPlan.features }
    }
    const defaults: Record<string, boolean | number> = {}
    for (const def of featureDefs) {
      defaults[def.key] = def.default
    }
    return defaults
  })

  const autoSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing) {
      setSlug(autoSlug(val))
    }
  }

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const setFeatureNumber = (key: string, val: string) => {
    setFeatures((prev) => ({ ...prev, [key]: Number.parseInt(val, 10) || 0 }))
  }

  const handleSubmit = () => {
    if (!(name && slug && monthlyPrice && yearlyPrice)) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const mp = maxPatients ? Number.parseInt(maxPatients, 10) : null

    if (isEditing && planId) {
      onUpdate({
        id: planId,
        name,
        slug,
        description: description || null,
        monthlyPrice,
        yearlyPrice,
        maxPatients: mp,
        features,
        isActive,
      })
    } else {
      onCreate({
        name,
        slug,
        description: description || undefined,
        monthlyPrice,
        yearlyPrice,
        maxPatients: mp,
        features,
        isActive,
      })
    }
  }

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
      <div className='relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl'>
        {/* Header */}
        <div className='sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4'>
          <h2 className='text-xl font-bold text-white'>
            {isEditing ? 'Editar Plano' : 'Novo Plano'}
          </h2>
          <button
            className='rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white'
            onClick={onClose}
            type='button'
          >
            <RiCloseLine className='h-5 w-5' />
          </button>
        </div>

        {/* Form */}
        <div className='space-y-6 p-6'>
          {/* Basic info */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-1.5 block text-sm font-medium text-slate-300'>Nome *</label>
              <input
                className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder='Ex: Profissional'
                type='text'
                value={name}
              />
            </div>
            <div>
              <label className='mb-1.5 block text-sm font-medium text-slate-300'>Slug *</label>
              <input
                className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                onChange={(e) => setSlug(e.target.value)}
                placeholder='ex: profissional'
                type='text'
                value={slug}
              />
            </div>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-medium text-slate-300'>Descrição</label>
            <textarea
              className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Breve descrição do plano...'
              rows={2}
              value={description}
            />
          </div>

          {/* Pricing */}
          <div>
            <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400'>
              Preços
            </h3>
            <div className='grid gap-4 sm:grid-cols-3'>
              <div>
                <label className='mb-1.5 block text-sm font-medium text-slate-300'>
                  Mensal (R$) *
                </label>
                <input
                  className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                  min='0'
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder='99.90'
                  step='0.01'
                  type='number'
                  value={monthlyPrice}
                />
              </div>
              <div>
                <label className='mb-1.5 block text-sm font-medium text-slate-300'>
                  Anual (R$) *
                </label>
                <input
                  className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                  min='0'
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  placeholder='999.00'
                  step='0.01'
                  type='number'
                  value={yearlyPrice}
                />
              </div>
              <div>
                <label className='mb-1.5 block text-sm font-medium text-slate-300'>
                  Máx. Pacientes
                </label>
                <input
                  className='w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                  min='0'
                  onChange={(e) => setMaxPatients(e.target.value)}
                  placeholder='0 = ilimitado'
                  type='number'
                  value={maxPatients}
                />
              </div>
            </div>
            {monthlyPrice && yearlyPrice && Number(monthlyPrice) > 0 && (
              <p className='mt-2 text-xs text-emerald-400'>
                Desconto anual:{' '}
                {Math.round((1 - Number(yearlyPrice) / (Number(monthlyPrice) * 12)) * 100)}%
              </p>
            )}
          </div>

          {/* Features */}
          <div>
            <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400'>
              Funcionalidades
            </h3>
            <div className='space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4'>
              {featureDefs.map((def) => (
                <div
                  className='flex items-center justify-between gap-4 rounded-lg bg-slate-800/50 px-4 py-3'
                  key={def.key}
                >
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-white'>{def.label}</p>
                    <p className='text-xs text-slate-500'>{def.description}</p>
                  </div>
                  {def.type === 'boolean' ? (
                    <button
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                        features[def.key] ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                      onClick={() => toggleFeature(def.key)}
                      type='button'
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                          features[def.key] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  ) : (
                    <input
                      className='w-20 rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-center text-sm text-white focus:border-violet-500 focus:outline-none'
                      min='0'
                      onChange={(e) => setFeatureNumber(def.key, e.target.value)}
                      type='number'
                      value={
                        typeof features[def.key] === 'number' ? (features[def.key] as number) : 0
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className='flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3'>
            <div>
              <p className='text-sm font-medium text-white'>Plano ativo</p>
              <p className='text-xs text-slate-500'>
                Planos inativos não aparecem para novos assinantes
              </p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                isActive ? 'bg-violet-600' : 'bg-slate-600'
              }`}
              onClick={() => setIsActive(!isActive)}
              type='button'
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                  isActive ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-800 px-6 py-4'>
          <button
            className='rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white'
            onClick={onClose}
            type='button'
          >
            Cancelar
          </button>
          <button
            className='flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50'
            disabled={isCreating || isUpdating}
            onClick={handleSubmit}
            type='button'
          >
            {(isCreating || isUpdating) && (
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            )}
            {isEditing ? 'Salvar alterações' : 'Criar plano'}
          </button>
        </div>
      </div>
    </div>
  )
}
