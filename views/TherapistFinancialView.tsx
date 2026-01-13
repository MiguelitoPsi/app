'use client'

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FINANCIAL_CATEGORIES } from '@/lib/constants/therapist'
import {
  formatCurrency,
  formatDateShort,
  PERIOD_OPTIONS,
  type PeriodType,
  useFinancialData,
} from '@/lib/hooks/useFinancialData'
import { trpc } from '@/lib/trpc/client'

type AccountType = 'pj' | 'cpf' | 'all'

type RecordFormData = {
  accountType: 'pj' | 'cpf'
  type: 'income' | 'expense'
  category: string
  amount: string
  description: string
  date: string
}

const defaultFormData: RecordFormData = {
  accountType: 'cpf',
  type: 'income',
  category: 'session',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

const CHART_COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  pj: '#3B82F6',
  cpf: '#8B5CF6',
}

// Period Selector Component
function PeriodSelector({
  value,
  onChange,
  onPrevious,
  onNext,
}: {
  value: PeriodType
  onChange: (value: PeriodType) => void
  onPrevious: () => void
  onNext: () => void
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = PERIOD_OPTIONS.find((opt) => opt.value === value)

  return (
    <div className='flex items-center gap-1'>
      <button
        className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
        onClick={onPrevious}
        type='button'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>

      <div className='relative'>
        <button
          className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 text-sm shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          onClick={() => setIsOpen(!isOpen)}
          type='button'
        >
          <Calendar className='h-4 w-4' />
          <span>{selectedOption?.label}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
            <div className='absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800'>
              {PERIOD_OPTIONS.map((option) => (
                <button
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    value === option.value
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  type='button'
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
        onClick={onNext}
        type='button'
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  )
}

// Account Type Tabs Component
function AccountTypeTabs({
  value,
  onChange,
}: {
  value: AccountType
  onChange: (value: AccountType) => void
}) {
  const tabs = [
    { id: 'all' as const, label: 'Geral', icon: Wallet, color: 'emerald' },
    { id: 'pj' as const, label: 'Pessoa Jurídica', icon: Building2, color: 'blue' },
    { id: 'cpf' as const, label: 'Pessoa Física', icon: User, color: 'purple' },
  ]

  return (
    <div className='flex gap-2'>
      {tabs.map((tab) => (
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all ${
            value === tab.id
              ? tab.color === 'emerald'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : tab.color === 'blue'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type='button'
        >
          <tab.icon className='h-5 w-5' />
          <span className='hidden sm:inline'>{tab.label}</span>
          <span className='sm:hidden'>{tab.id === 'all' ? 'Geral' : tab.id.toUpperCase()}</span>
        </button>
      ))}
    </div>
  )
}

// Dashboard Card Component
function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  color: 'emerald' | 'rose' | 'blue' | 'purple' | 'amber'
}) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorClasses[color]} p-5 text-white shadow-lg`}>
      <div className='mb-3 flex items-start justify-between'>
        <div className='rounded-xl bg-white/20 p-2.5'>
          <Icon className='h-5 w-5' />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              trend.isPositive ? 'bg-white/20' : 'bg-black/10'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className='h-3 w-3' />
            ) : (
              <TrendingDown className='h-3 w-3' />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <p className='mb-1 text-sm text-white/80'>{title}</p>
      <p className='text-2xl font-bold'>{value}</p>
      {subtitle && <p className='mt-1 text-xs text-white/70'>{subtitle}</p>}
    </div>
  )
}

// Mini Chart Component for category breakdown
function CategoryBreakdown({
  data,
  type,
}: {
  data: Array<{ name: string; value: number; color: string }>
  type: 'income' | 'expense'
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className='flex h-32 items-center justify-center text-slate-400'>
        Sem dados no período
      </div>
    )
  }

  return (
    <div className='flex items-center gap-4'>
      <div className='h-24 w-24 flex-shrink-0'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              cx='50%'
              cy='50%'
              data={data}
              dataKey='value'
              innerRadius={25}
              outerRadius={40}
              paddingAngle={2}
              stroke='none'
            >
              {data.map((entry, index) => (
                <Cell fill={entry.color} key={`cell-${index}`} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderRadius: '8px',
                border: 'none',
                padding: '8px 12px',
              }}
              formatter={(value: number) => formatCurrency(value)}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className='flex-1 space-y-1.5'>
        {data.slice(0, 4).map((item, index) => (
          <div className='flex items-center justify-between text-sm' key={index}>
            <div className='flex items-center gap-2'>
              <div
                className='h-2.5 w-2.5 rounded-full'
                style={{ backgroundColor: item.color }}
              />
              <span className='text-slate-600 dark:text-slate-400'>{item.name}</span>
            </div>
            <span className='font-medium text-slate-800 dark:text-slate-200'>
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TherapistFinancialView(): React.ReactElement {
  const [accountType, setAccountType] = useState<AccountType>('all')
  const [period, setPeriod] = useState<PeriodType>('month')
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<RecordFormData>(defaultFormData)

  const utils = trpc.useUtils()

  // Get financial data with account type filter
  const { currentRange, currentSummary, records, isLoading, isLoadingRecords } = useFinancialData({
    period,
    enableComparison: false,
    historyMonths: 12,
    referenceDate,
    accountType: accountType === 'all' ? undefined : accountType,
  })

  // Mutations
  const addRecordMutation = trpc.therapistFinancial.addRecord.useMutation({
    onSuccess: () => {
      setShowAddForm(false)
      setFormData(defaultFormData)
      utils.therapistFinancial.getRecords.invalidate()
      utils.therapistFinancial.getSummary.invalidate()
    },
  })

  const deleteRecordMutation = trpc.therapistFinancial.deleteRecord.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(null)
      utils.therapistFinancial.getRecords.invalidate()
      utils.therapistFinancial.getSummary.invalidate()
    },
  })

  const handlePreviousPeriod = () => {
    const newDate = new Date(referenceDate)
    if (period === 'month') newDate.setMonth(newDate.getMonth() - 1)
    else if (period === 'quarter') newDate.setMonth(newDate.getMonth() - 3)
    else if (period === 'semester') newDate.setMonth(newDate.getMonth() - 6)
    else if (period === 'year') newDate.setFullYear(newDate.getFullYear() - 1)
    setReferenceDate(newDate)
  }

  const handleNextPeriod = () => {
    const newDate = new Date(referenceDate)
    if (period === 'month') newDate.setMonth(newDate.getMonth() + 1)
    else if (period === 'quarter') newDate.setMonth(newDate.getMonth() + 3)
    else if (period === 'semester') newDate.setMonth(newDate.getMonth() + 6)
    else if (period === 'year') newDate.setFullYear(newDate.getFullYear() + 1)
    setReferenceDate(newDate)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) return

    addRecordMutation.mutate({
      accountType: formData.accountType,
      type: formData.type,
      category: formData.category as
        | 'session'
        | 'plan'
        | 'workshop'
        | 'supervision'
        | 'consultation'
        | 'subscription'
        | 'rent'
        | 'equipment'
        | 'marketing'
        | 'training'
        | 'taxes'
        | 'utilities'
        | 'insurance'
        | 'software'
        | 'material'
        | 'other',
      amount: Number.parseFloat(formData.amount),
      description: formData.description || undefined,
      date: new Date(formData.date),
    })
  }

  const getCategoryInfo = (category: string): { label: string; icon: string } =>
    FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES] ?? {
      label: category,
      icon: '📦',
    }

  // Calculate category data for charts
  const categoryChartData = useMemo(() => {
    if (!currentSummary?.byCategory) return { income: [], expense: [] }

    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']

    const income = Object.entries(currentSummary.byCategory)
      .filter(([, v]) => v.income > 0)
      .map(([key, v], i) => ({
        name: FINANCIAL_CATEGORIES[key as keyof typeof FINANCIAL_CATEGORIES]?.label || key,
        value: v.income,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)

    const expense = Object.entries(currentSummary.byCategory)
      .filter(([, v]) => v.expense > 0)
      .map(([key, v], i) => ({
        name: FINANCIAL_CATEGORIES[key as keyof typeof FINANCIAL_CATEGORIES]?.label || key,
        value: v.expense,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)

    return { income, expense }
  }, [currentSummary])

  // Sort records by date
  const sortedRecords = useMemo(() => {
    if (!records) return []
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [records])

  // Calculate profit margin
  const profitMargin = useMemo(() => {
    if (!currentSummary || currentSummary.income === 0) return 0
    return ((currentSummary.balance / currentSummary.income) * 100)
  }, [currentSummary])

  return (
    <div className='h-full overflow-y-auto px-4 py-6 pb-28 pt-safe sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8'>
      {/* Header */}
      <div className='mb-6'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>
              Organizador Financeiro
            </h2>
            <p className='text-slate-500 dark:text-slate-400'>{currentRange.label}</p>
          </div>
          <div className='flex items-center gap-3'>
            <PeriodSelector
              onChange={setPeriod}
              onNext={handleNextPeriod}
              onPrevious={handlePreviousPeriod}
              value={period}
            />
            <button
              className='flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600'
              onClick={() => {
                setFormData({
                  ...defaultFormData,
                  accountType: accountType === 'all' ? 'cpf' : accountType,
                })
                setShowAddForm(true)
              }}
              type='button'
            >
              <Plus className='h-5 w-5' />
              <span className='hidden sm:inline'>Novo Registro</span>
            </button>
          </div>
        </div>

        {/* Account Type Tabs */}
        <AccountTypeTabs value={accountType} onChange={setAccountType} />
      </div>

      {/* Dashboard Grid */}
      {isLoading ? (
        <div className='flex h-48 items-center justify-center'>
          <div className='h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
        </div>
      ) : currentSummary ? (
        <div className='space-y-6'>
          {/* Stats Cards */}
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <DashboardCard
              color='emerald'
              icon={ArrowUpCircle}
              subtitle={`${currentSummary.sessionsCount} sessões`}
              title='Receitas'
              value={formatCurrency(currentSummary.income)}
            />
            <DashboardCard
              color='rose'
              icon={ArrowDownCircle}
              title='Despesas'
              value={formatCurrency(currentSummary.expenses)}
            />
            <DashboardCard
              color={currentSummary.balance >= 0 ? 'blue' : 'amber'}
              icon={Wallet}
              title='Saldo'
              value={formatCurrency(currentSummary.balance)}
            />
            <DashboardCard
              color='purple'
              icon={Target}
              subtitle={profitMargin >= 0 ? 'Lucro' : 'Prejuízo'}
              title='Margem'
              value={`${profitMargin.toFixed(1)}%`}
            />
          </div>

          {/* Charts Row */}
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Income by Category */}
            <div className='rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900'>
              <h3 className='mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-white'>
                <ArrowUpCircle className='h-5 w-5 text-emerald-500' />
                Receitas por Categoria
              </h3>
              <CategoryBreakdown data={categoryChartData.income} type='income' />
            </div>

            {/* Expense by Category */}
            <div className='rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900'>
              <h3 className='mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-white'>
                <ArrowDownCircle className='h-5 w-5 text-rose-500' />
                Despesas por Categoria
              </h3>
              <CategoryBreakdown data={categoryChartData.expense} type='expense' />
            </div>
          </div>

          {/* Recent Records */}
          <div className='rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900'>
            <h3 className='mb-4 font-semibold text-slate-800 dark:text-white'>
              Registros Recentes
            </h3>

            {isLoadingRecords ? (
              <div className='flex h-32 items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
              </div>
            ) : sortedRecords.length > 0 ? (
              <div className='space-y-3'>
                {sortedRecords.slice(0, 8).map((record) => {
                  const info = getCategoryInfo(record.category)
                  return (
                    <div
                      className='flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                      key={record.id}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          record.type === 'income'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-rose-100 dark:bg-rose-900/30'
                        }`}
                      >
                        {record.type === 'income' ? (
                          <ArrowUpCircle className='h-5 w-5 text-emerald-600' />
                        ) : (
                          <ArrowDownCircle className='h-5 w-5 text-rose-600' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-slate-800 dark:text-slate-200'>
                            {info.label}
                          </p>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                              record.accountType === 'pj'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}
                          >
                            {record.accountType?.toUpperCase() || 'CPF'}
                          </span>
                        </div>
                        <p className='text-xs text-slate-500'>{formatDateShort(record.date)}</p>
                      </div>
                      <div className='flex shrink-0 items-center gap-2'>
                        <p
                          className={`font-bold ${
                            record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {record.type === 'income' ? '+' : '-'}
                          {formatCurrency(record.amount)}
                        </p>
                        <button
                          className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30'
                          onClick={() => setShowDeleteConfirm(record.id)}
                          type='button'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='flex h-32 flex-col items-center justify-center'>
                <DollarSign className='mb-2 h-10 w-10 text-slate-300' />
                <p className='text-slate-500'>Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Add Record Form Modal */}
      {showAddForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900'>
            <h3 className='mb-4 text-lg font-bold text-slate-800 dark:text-white'>
              Novo Registro
            </h3>
            <form className='space-y-4' onSubmit={handleSubmit}>
              {/* Account Type */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Tipo de Conta
                </label>
                <div className='flex gap-2'>
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      formData.accountType === 'pj'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    onClick={() => setFormData({ ...formData, accountType: 'pj' })}
                    type='button'
                  >
                    <Building2 className='h-5 w-5' />
                    PJ
                  </button>
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      formData.accountType === 'cpf'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    onClick={() => setFormData({ ...formData, accountType: 'cpf' })}
                    type='button'
                  >
                    <User className='h-5 w-5' />
                    CPF
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Tipo
                </label>
                <div className='flex gap-2'>
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      formData.type === 'income'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    type='button'
                  >
                    <ArrowUpCircle className='h-5 w-5' />
                    Receita
                  </button>
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all ${
                      formData.type === 'expense'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    type='button'
                  >
                    <ArrowDownCircle className='h-5 w-5' />
                    Despesa
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Categoria
                </label>
                <select
                  className='w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  value={formData.category}
                >
                  {Object.entries(FINANCIAL_CATEGORIES).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Valor (R$)
                </label>
                <input
                  className='w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  min='0'
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder='0,00'
                  step='0.01'
                  type='number'
                  value={formData.amount}
                />
              </div>

              {/* Description */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Descrição (opcional)
                </label>
                <input
                  className='w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Descrição opcional'
                  type='text'
                  value={formData.description}
                />
              </div>

              {/* Date */}
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Data
                </label>
                <input
                  className='w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  type='date'
                  value={formData.date}
                />
              </div>

              {/* Actions */}
              <div className='flex gap-3 pt-2'>
                <button
                  className='flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  onClick={() => setShowAddForm(false)}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className='flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 disabled:opacity-50'
                  disabled={addRecordMutation.isPending || !formData.amount}
                  type='submit'
                >
                  {addRecordMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900'>
            <h3 className='mb-2 text-lg font-bold text-slate-800 dark:text-white'>
              Excluir Registro
            </h3>
            <p className='mb-4 text-slate-600 dark:text-slate-400'>
              Tem certeza que deseja excluir este registro?
            </p>
            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                onClick={() => setShowDeleteConfirm(null)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-xl bg-rose-500 px-4 py-3 font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:bg-rose-600 disabled:opacity-50'
                disabled={deleteRecordMutation.isPending}
                onClick={() => deleteRecordMutation.mutate({ id: showDeleteConfirm })}
                type='button'
              >
                {deleteRecordMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
