'use client'

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Key,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCircle,
  X,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { useGame } from '@/context/GameContext'
import { authClient } from '@/lib/auth-client'
import { FINANCIAL_CATEGORIES, GOAL_CATEGORIES } from '@/lib/constants/therapist'
import {
  formatCurrency,
  formatDateShort,
  PERIOD_OPTIONS,
  type PeriodType,
  useFinancialData,
} from '@/lib/hooks/useFinancialData'
import { trpc } from '@/lib/trpc/client'

const CHART_COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  balance: '#3B82F6',
  categories: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#EF4444', '#F87171', '#FCA5A5'],
}

type RecordFormData = {
  type: 'income' | 'expense'
  category: string
  amount: string
  description: string
  date: string
  isRecurring: boolean
  frequency: 'weekly' | 'monthly' | 'yearly' | ''
}

type GoalFormData = {
  title: string
  description: string
  category: 'schedule' | 'revenue' | 'retention' | 'expansion' | 'professional_development'
  targetValue: string
  unit: string
  deadline: string
}

const defaultFormData: RecordFormData = {
  type: 'income',
  category: 'session',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  isRecurring: false,
  frequency: '',
}

const defaultGoalFormData: GoalFormData = {
  title: '',
  description: '',
  category: 'schedule',
  targetValue: '',
  unit: '',
  deadline: '',
}

// Componente para exibir variação percentual
function ChangeIndicator({
  value,
  inverted = false,
}: {
  value: number | null
  inverted?: boolean
}): React.ReactElement | null {
  // Não exibe nada se não há dados suficientes para comparação
  if (value === null) {
    return null
  }

  const isPositive = inverted ? value < 0 : value >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:gap-1 sm:px-2 sm:text-xs ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      <Icon className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

// Componente do seletor de período
function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodType
  onChange: (value: PeriodType) => void
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = PERIOD_OPTIONS.find((opt) => opt.value === value)

  return (
    <div className='relative'>
      <button
        className='flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-700 text-xs shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm'
        onClick={() => setIsOpen(!isOpen)}
        type='button'
      >
        <Calendar className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        <span className='max-w-[60px] truncate sm:max-w-none'>{selectedOption?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform sm:h-4 sm:w-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
          <div className='absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:w-48'>
            {PERIOD_OPTIONS.map((option) => (
              <button
                className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 sm:px-4 sm:text-sm ${
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
  )
}

// Componente de card de projeção
function ProjectionCard({
  projection,
}: {
  projection: NonNullable<ReturnType<typeof useFinancialData>['projection']>
}): React.ReactElement {
  const confidenceLabels = {
    low: { text: 'Baixa', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    medium: { text: 'Média', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    high: { text: 'Alta', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  }

  const conf = confidenceLabels[projection.confidence]

  return (
    <div className='overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white sm:rounded-xl sm:p-4'>
      <div className='mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3'>
        <h3 className='font-semibold text-sm sm:text-base'>Projeção do Período</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${conf.color}`}
        >
          Confiança: {conf.text}
        </span>
      </div>

      <div className='grid grid-cols-3 gap-2 sm:gap-4'>
        <div className='min-w-0'>
          <p className='truncate text-indigo-200 text-[10px] sm:text-xs'>Receita</p>
          <p className='truncate font-bold text-sm sm:text-lg'>
            {formatCurrency(projection.projectedIncome)}
          </p>
        </div>
        <div className='min-w-0'>
          <p className='truncate text-indigo-200 text-[10px] sm:text-xs'>Despesa</p>
          <p className='truncate font-bold text-sm sm:text-lg'>
            {formatCurrency(projection.projectedExpenses)}
          </p>
        </div>
        <div className='min-w-0'>
          <p className='truncate text-indigo-200 text-[10px] sm:text-xs'>Saldo</p>
          <p
            className={`truncate font-bold text-sm sm:text-lg ${projection.projectedBalance >= 0 ? 'text-white' : 'text-red-300'}`}
          >
            {formatCurrency(projection.projectedBalance)}
          </p>
        </div>
      </div>

      <div className='mt-2 flex flex-wrap items-center gap-1 text-[10px] text-indigo-200 sm:mt-3 sm:gap-2 sm:text-xs'>
        <span>📊 Média: {formatCurrency(projection.averageDailyIncome)}/dia</span>
        <span className='hidden sm:inline'>•</span>
        <span>{projection.daysRemaining} dias restantes</span>
      </div>
    </div>
  )
}

export default function TherapistFinancialView(): React.ReactElement {
  const { stats: realStats, toggleTheme } = useGame()
  const [showSettings, setShowSettings] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [period, setPeriod] = useState<PeriodType>('month')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showDeleteGoalConfirm, setShowDeleteGoalConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<RecordFormData>(defaultFormData)
  const [goalFormData, setGoalFormData] = useState<GoalFormData>(defaultGoalFormData)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'goals' | 'evolution'>(
    'overview'
  )

  const utils = trpc.useUtils()

  // Hook centralizado de dados financeiros
  const {
    currentRange,
    currentSummary,
    previousSummary,
    comparison,
    projection,
    metrics,
    chartData,
    records,
    isLoading,
    isLoadingRecords,
  } = useFinancialData({ period, enableComparison: true, historyMonths: 12 })

  // Goals e Alerts (mantidos separados)
  // autoRecalculate: true recalcula o progresso das metas automaticamente baseado nos dados reais
  const { data: goals, isLoading: isLoadingGoals } = trpc.therapistFinancial.getGoals.useQuery({
    autoRecalculate: true,
  })
  const { data: alerts } = trpc.therapistFinancial.getAlerts.useQuery()

  // Mutations
  const addRecordMutation = trpc.therapistFinancial.addRecord.useMutation({
    onSuccess: () => {
      setShowAddForm(false)
      setFormData(defaultFormData)
      utils.therapistFinancial.getRecords.invalidate()
      utils.therapistFinancial.getSummary.invalidate()
    },
  })

  const createGoalMutation = trpc.therapistFinancial.createGoal.useMutation({
    onSuccess: () => {
      setShowGoalForm(false)
      setGoalFormData(defaultGoalFormData)
      utils.therapistFinancial.getGoals.invalidate()
    },
  })

  const deleteGoalMutation = trpc.therapistFinancial.deleteGoal.useMutation({
    onSuccess: () => {
      setShowDeleteGoalConfirm(null)
      utils.therapistFinancial.getGoals.invalidate()
    },
  })

  const recalculateGoalsMutation = trpc.therapistFinancial.recalculateGoals.useMutation({
    onSuccess: () => {
      utils.therapistFinancial.getGoals.invalidate()
    },
  })

  const deleteRecordMutation = trpc.therapistFinancial.deleteRecord.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(null)
      utils.therapistFinancial.getRecords.invalidate()
      utils.therapistFinancial.getSummary.invalidate()
    },
  })

  const handleDeleteRecord = (id: string): void => {
    deleteRecordMutation.mutate({ id })
  }

  const handleDeleteGoal = (id: string): void => {
    deleteGoalMutation.mutate({ id })
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) return

    addRecordMutation.mutate({
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
      isRecurring: formData.isRecurring,
      frequency: formData.isRecurring && formData.frequency ? formData.frequency : undefined,
    })
  }

  const handleGoalSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!goalFormData.title) return
    if (!goalFormData.targetValue) return

    createGoalMutation.mutate({
      title: goalFormData.title,
      description: goalFormData.description || undefined,
      category: goalFormData.category,
      targetValue: Number.parseFloat(goalFormData.targetValue),
      unit: goalFormData.unit || 'count',
      deadline: goalFormData.deadline ? new Date(goalFormData.deadline) : undefined,
    })
  }

  const getCategoryInfo = (category: string): { label: string; icon: string } =>
    FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES] ?? {
      label: category,
      icon: '📦',
    }

  // Dados para gráficos
  const pieChartData = useMemo(() => {
    if (!currentSummary) return []

    const data: { name: string; value: number; type: string }[] = []
    if (currentSummary.income > 0) {
      data.push({ name: 'Receitas', value: currentSummary.income, type: 'income' })
    }
    if (currentSummary.expenses > 0) {
      data.push({ name: 'Despesas', value: currentSummary.expenses, type: 'expense' })
    }
    return data
  }, [currentSummary])

  const categoryChartData = useMemo(() => {
    if (!currentSummary?.byCategory) return []

    return Object.entries(currentSummary.byCategory)
      .map(([category, values], index) => {
        const info = FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES]
        return {
          name: info?.label ?? category,
          income: values.income,
          expense: values.expense,
          color: CHART_COLORS.categories[index % CHART_COLORS.categories.length],
        }
      })
      .filter((item) => item.income > 0 || item.expense > 0)
  }, [currentSummary])

  // Registros recorrentes
  const recurringData = useMemo(() => {
    if (!records) return null

    const recurringRecords = records.filter((r) => r.isRecurring)
    const recurringIncome = recurringRecords
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const recurringExpense = recurringRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      count: recurringRecords.length,
      income: recurringIncome,
      expense: recurringExpense,
      records: recurringRecords,
    }
  }, [records])

  const tabs: { id: typeof activeTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutGrid },
    { id: 'evolution', label: 'Evolução', icon: TrendingUp },
    { id: 'records', label: 'Registros', icon: FileText },
    { id: 'goals', label: 'Metas', icon: Target },
  ]

  // Reset password form state
  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  // Change password handler
  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    const allFieldsFilled = currentPassword && newPassword && confirmPassword
    if (!allFieldsFilled) {
      setPasswordError('Preencha todos os campos')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('A nova senha deve ser diferente da atual')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        if (error.message?.includes('Invalid password') || error.message?.includes('incorrect')) {
          setPasswordError('Senha atual incorreta')
        } else {
          setPasswordError(error.message || 'Erro ao alterar senha')
        }
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className='flex h-full flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='bg-gradient-to-br from-emerald-600 to-teal-700 pt-safe text-white'>
        <div className='mx-auto max-w-7xl px-3 pt-4 pb-3 sm:px-4 lg:px-8'>
          <div className='flex items-center justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <h1 className='mb-0.5 truncate font-bold text-lg sm:mb-1 sm:text-2xl lg:text-3xl'>
                Gestão Financeira
              </h1>
              <p className='truncate text-emerald-100 text-xs sm:text-sm lg:text-base'>
                {currentRange.label}
              </p>
            </div>
            <div className='flex flex-shrink-0 items-center gap-1.5 sm:gap-2'>
              <PeriodSelector onChange={setPeriod} value={period} />
              <button
                aria-label='Configurações'
                className='rounded-full p-1.5 transition-colors hover:bg-white/10 sm:p-2 lg:hidden'
                onClick={() => setShowSettings(true)}
                type='button'
              >
                <Settings className='h-5 w-5 sm:h-6 sm:w-6' />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats com Comparação */}
        {currentSummary && (
          <div className='mx-auto max-w-7xl grid grid-cols-3 gap-2 px-3 pb-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-8 lg:pb-4'>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3 lg:p-4'>
              <div className='flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-1'>
                <p className='text-emerald-100 text-[10px] sm:text-xs lg:text-sm'>Receitas</p>
                {comparison && <ChangeIndicator value={comparison.incomeChange} />}
              </div>
              <p className='text-center font-bold text-sm sm:text-left sm:text-lg lg:text-xl'>
                {formatCurrency(currentSummary.income)}
              </p>
              {previousSummary && (
                <p className='hidden text-emerald-200 text-xs sm:block lg:text-sm'>
                  Anterior: {formatCurrency(previousSummary.income)}
                </p>
              )}
            </div>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3 lg:p-4'>
              <div className='flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-1'>
                <p className='text-emerald-100 text-[10px] sm:text-xs lg:text-sm'>Despesas</p>
                {comparison && <ChangeIndicator inverted value={comparison.expenseChange} />}
              </div>
              <p className='text-center font-bold text-sm sm:text-left sm:text-lg lg:text-xl'>
                {formatCurrency(currentSummary.expenses)}
              </p>
              {previousSummary && (
                <p className='hidden text-emerald-200 text-xs sm:block lg:text-sm'>
                  Anterior: {formatCurrency(previousSummary.expenses)}
                </p>
              )}
            </div>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3 lg:p-4'>
              <div className='flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-1'>
                <p className='text-emerald-100 text-[10px] sm:text-xs lg:text-sm'>Saldo</p>
                {comparison && <ChangeIndicator value={comparison.balanceChange} />}
              </div>
              <p
                className={`text-center font-bold text-sm sm:text-left sm:text-lg lg:text-xl ${currentSummary.balance >= 0 ? 'text-white' : 'text-red-300'}`}
              >
                {formatCurrency(currentSummary.balance)}
              </p>
              {previousSummary && (
                <p className='hidden text-emerald-200 text-xs sm:block lg:text-sm'>
                  Anterior: {formatCurrency(previousSummary.balance)}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Tabs - Mobile: grid de botões, Desktop: tabs horizontais elegantes */}
      <div className='bg-white px-3 py-2 dark:bg-slate-900 sm:px-4 sm:py-3 lg:px-8 lg:py-4'>
        <div className='mx-auto max-w-7xl'>
          {/* Mobile tabs */}
          <div className='grid grid-cols-4 gap-1.5 sm:gap-2 lg:hidden'>
            {tabs.map((tab) => (
              <button
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 font-medium transition-all sm:gap-1.5 sm:rounded-xl sm:py-3 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type='button'
              >
                <tab.icon className='h-4 w-4 sm:h-5 sm:w-5' />
                <span className='text-[9px] sm:text-xs'>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop tabs */}
          <div className='hidden lg:flex lg:gap-2 lg:rounded-xl lg:bg-slate-100 lg:p-1.5 dark:lg:bg-slate-800'>
            {tabs.map((tab) => (
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type='button'
              >
                <tab.icon className='h-5 w-5' />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className='flex-1 overflow-x-hidden overflow-y-auto p-3 pb-24 sm:p-4 lg:pb-8 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Alerts */}
          {alerts && alerts.length > 0 && activeTab === 'overview' && (
            <div className='mb-4 space-y-2 lg:mb-6'>
              {alerts.map((alert, index) => (
                <div
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    alert.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                  key={index}
                >
                  <p
                    className={`text-sm ${alert.type === 'warning' ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}
                  >
                    <strong>{alert.title}:</strong> {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-4'>
              {isLoading ? (
                <div className='flex h-40 items-center justify-center'>
                  <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
                </div>
              ) : currentSummary ? (
                <>
                  {/* Projeção */}
                  {projection && projection.daysRemaining > 0 && (
                    <ProjectionCard projection={projection} />
                  )}

                  {/* Gráfico Circular - Receitas vs Despesas */}
                  {pieChartData.length > 0 && currentSummary && (
                    <div className='rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-lg dark:from-slate-900 dark:to-slate-800'>
                      <div className='mb-4 flex items-center justify-between'>
                        <h3 className='font-semibold text-lg text-slate-800 dark:text-slate-200'>
                          Balanço do Período
                        </h3>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            currentSummary.balance >= 0
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}
                        >
                          {currentSummary.balance >= 0 ? '+ ' : ''}
                          {formatCurrency(currentSummary.balance)}
                        </div>
                      </div>

                      <div className='flex flex-col items-center gap-4'>
                        {/* Gráfico */}
                        <div className='relative h-44 w-44 flex-shrink-0'>
                          <ResponsiveContainer height='100%' width='100%'>
                            <PieChart>
                              <Pie
                                cx='50%'
                                cy='50%'
                                data={pieChartData}
                                dataKey='value'
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={3}
                                stroke='none'
                              >
                                {pieChartData.map((entry) => (
                                  <Cell
                                    fill={entry.type === 'income' ? '#10B981' : '#EF4444'}
                                    key={`cell-${entry.type}`}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                  borderRadius: '12px',
                                  border: 'none',
                                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                  padding: '12px 16px',
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                                itemStyle={{ color: '#fff' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Centro do donut */}
                          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                            <span className='text-slate-400 text-xs dark:text-slate-500'>
                              Total
                            </span>
                            <span className='font-bold text-slate-800 dark:text-slate-200'>
                              {formatCurrency(currentSummary.income + currentSummary.expenses)}
                            </span>
                          </div>
                        </div>

                        {/* Legenda personalizada */}
                        <div className='flex w-full flex-col gap-3'>
                          <div className='rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800'>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500'>
                                <ArrowUpCircle className='h-5 w-5 text-white' />
                              </div>
                              <div className='flex-1'>
                                <p className='text-slate-500 text-xs dark:text-slate-400'>
                                  Receitas
                                </p>
                                <p className='font-bold text-emerald-600 text-lg dark:text-emerald-400'>
                                  {formatCurrency(currentSummary.income)}
                                </p>
                              </div>
                              <div className='rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-400'>
                                {currentSummary.income + currentSummary.expenses > 0
                                  ? (
                                      (currentSummary.income /
                                        (currentSummary.income + currentSummary.expenses)) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </div>
                            </div>
                          </div>

                          <div className='rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800'>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-500'>
                                <ArrowDownCircle className='h-5 w-5 text-white' />
                              </div>
                              <div className='flex-1'>
                                <p className='text-slate-500 text-xs dark:text-slate-400'>
                                  Despesas
                                </p>
                                <p className='font-bold text-lg text-red-600 dark:text-red-400'>
                                  {formatCurrency(currentSummary.expenses)}
                                </p>
                              </div>
                              <div className='rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700 text-xs dark:bg-red-900/40 dark:text-red-400'>
                                {currentSummary.income + currentSummary.expenses > 0
                                  ? (
                                      (currentSummary.expenses /
                                        (currentSummary.income + currentSummary.expenses)) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Métricas Financeiras */}
                  {metrics && (
                    <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                      <div className='mb-4 flex items-center gap-2'>
                        <FileText className='h-5 w-5 text-emerald-600' />
                        <h3 className='font-semibold text-slate-800 dark:text-slate-200'>
                          Indicadores Financeiros
                        </h3>
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div className='rounded-lg bg-slate-50 p-3 dark:bg-slate-800'>
                          <p className='text-slate-500 text-xs'>Margem de Lucro</p>
                          <p
                            className={`font-bold text-xl ${
                              metrics.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {metrics.profitMargin.toFixed(1)}%
                          </p>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 dark:bg-slate-800'>
                          <p className='text-slate-500 text-xs'>Ratio Despesas/Receitas</p>
                          <p
                            className={`font-bold text-xl ${
                              metrics.expenseRatio <= 70 ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {metrics.expenseRatio.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Top Categorias */}
                      {(metrics.topIncomeCategory || metrics.topExpenseCategory) && (
                        <div className='mt-4 space-y-2'>
                          {metrics.topIncomeCategory && (
                            <div className='flex items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20'>
                              <div className='flex items-center gap-2'>
                                <ArrowUpCircle className='h-4 w-4 text-emerald-600' />
                                <span className='text-emerald-800 text-sm dark:text-emerald-300'>
                                  Principal fonte de receita
                                </span>
                              </div>
                              <span className='font-medium text-emerald-700 text-sm dark:text-emerald-400'>
                                {getCategoryInfo(metrics.topIncomeCategory[0]).label} (
                                {formatCurrency(metrics.topIncomeCategory[1].income)})
                              </span>
                            </div>
                          )}
                          {metrics.topExpenseCategory && (
                            <div className='flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                              <div className='flex items-center gap-2'>
                                <ArrowDownCircle className='h-4 w-4 text-red-600' />
                                <span className='text-red-800 text-sm dark:text-red-300'>
                                  Maior despesa
                                </span>
                              </div>
                              <span className='font-medium text-red-700 text-sm dark:text-red-400'>
                                {getCategoryInfo(metrics.topExpenseCategory[0]).label} (
                                {formatCurrency(metrics.topExpenseCategory[1].expense)})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Por Categoria */}
                  {categoryChartData.length > 0 && (
                    <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                      <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                        Por Categoria
                      </h3>
                      <div className='h-64'>
                        <ResponsiveContainer height='100%' width='100%'>
                          <BarChart data={categoryChartData} layout='vertical'>
                            <CartesianGrid horizontal={false} strokeDasharray='3 3' />
                            <XAxis tickFormatter={(value) => `R$${value}`} type='number' />
                            <YAxis
                              dataKey='name'
                              tick={{ fontSize: 12 }}
                              type='category'
                              width={80}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                              }}
                              formatter={(value: number) => formatCurrency(value)}
                            />
                            <Bar
                              dataKey='income'
                              fill={CHART_COLORS.income}
                              name='Receita'
                              radius={[0, 4, 4, 0]}
                            />
                            <Bar
                              dataKey='expense'
                              fill={CHART_COLORS.expense}
                              name='Despesa'
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Sessões */}
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Sessões do Período
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-slate-500 text-sm'>Realizadas</p>
                        <div className='flex items-center gap-2'>
                          <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                            {currentSummary.sessionsCount}
                          </p>
                          {comparison && <ChangeIndicator value={comparison.sessionsChange} />}
                        </div>
                        {previousSummary && (
                          <p className='text-slate-400 text-xs'>
                            Anterior: {previousSummary.sessionsCount}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className='text-slate-500 text-sm'>Valor Médio</p>
                        <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                          {formatCurrency(currentSummary.averageSessionValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registros Recorrentes */}
                  {recurringData && recurringData.count > 0 && (
                    <div className='rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm dark:from-blue-900/20 dark:to-indigo-900/20'>
                      <div className='mb-3 flex items-center gap-2'>
                        <span className='text-xl'>🔄</span>
                        <h3 className='font-semibold text-slate-800 dark:text-slate-200'>
                          Registros Recorrentes
                        </h3>
                      </div>
                      <div className='grid grid-cols-3 gap-3'>
                        <div className='rounded-lg bg-white/60 p-3 dark:bg-slate-800/60'>
                          <p className='text-slate-500 text-xs'>Total</p>
                          <p className='font-bold text-lg text-slate-800 dark:text-slate-100'>
                            {recurringData.count}
                          </p>
                          <p className='text-slate-400 text-xs'>registros</p>
                        </div>
                        <div className='rounded-lg bg-white/60 p-3 dark:bg-slate-800/60'>
                          <p className='text-emerald-600 text-xs'>Receitas</p>
                          <p className='font-bold text-lg text-emerald-600'>
                            {formatCurrency(recurringData.income)}
                          </p>
                          <p className='text-slate-400 text-xs'>recorrente</p>
                        </div>
                        <div className='rounded-lg bg-white/60 p-3 dark:bg-slate-800/60'>
                          <p className='text-red-600 text-xs'>Despesas</p>
                          <p className='font-bold text-lg text-red-600'>
                            {formatCurrency(recurringData.expense)}
                          </p>
                          <p className='text-slate-400 text-xs'>recorrente</p>
                        </div>
                      </div>

                      {/* Lista de itens recorrentes */}
                      <details className='mt-3'>
                        <summary className='cursor-pointer font-medium text-blue-600 text-sm hover:text-blue-700'>
                          Ver detalhes dos registros recorrentes
                        </summary>
                        <div className='mt-2 space-y-2'>
                          {recurringData.records.map((record) => {
                            const info = getCategoryInfo(record.category)
                            return (
                              <div
                                className='flex items-center justify-between rounded-lg bg-white/80 p-2 dark:bg-slate-800/80'
                                key={record.id}
                              >
                                <div className='flex items-center gap-2'>
                                  <span>{info.icon}</span>
                                  <span className='text-slate-700 text-sm dark:text-slate-300'>
                                    {info.label}
                                  </span>
                                  <span className='rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400'>
                                    {record.frequency === 'weekly' && 'Semanal'}
                                    {record.frequency === 'monthly' && 'Mensal'}
                                    {record.frequency === 'yearly' && 'Anual'}
                                  </span>
                                </div>
                                <span
                                  className={`font-medium text-sm ${record.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}
                                >
                                  {record.type === 'income' ? '+' : '-'}
                                  {formatCurrency(record.amount)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    </div>
                  )}
                </>
              ) : (
                <div className='flex h-40 items-center justify-center'>
                  <p className='text-slate-500'>Sem dados para exibir</p>
                </div>
              )}
            </div>
          )}

          {/* Evolution Tab - Gráficos de linha */}
          {activeTab === 'evolution' && (
            <div className='space-y-4'>
              {chartData && chartData.length > 0 ? (
                <>
                  {/* Evolução Mensal */}
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Evolução Mensal (últimos 12 meses)
                    </h3>
                    <div className='h-72'>
                      <ResponsiveContainer height='100%' width='100%'>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='monthLabel' tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Line
                            dataKey='income'
                            dot={{ fill: CHART_COLORS.income }}
                            name='Receita'
                            stroke={CHART_COLORS.income}
                            strokeWidth={2}
                            type='monotone'
                          />
                          <Line
                            dataKey='expense'
                            dot={{ fill: CHART_COLORS.expense }}
                            name='Despesa'
                            stroke={CHART_COLORS.expense}
                            strokeWidth={2}
                            type='monotone'
                          />
                          <Line
                            dataKey='balance'
                            dot={{ fill: CHART_COLORS.balance }}
                            name='Saldo'
                            stroke={CHART_COLORS.balance}
                            strokeWidth={2}
                            type='monotone'
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Barras de Comparação */}
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Receitas vs Despesas por Mês
                    </h3>
                    <div className='h-64'>
                      <ResponsiveContainer height='100%' width='100%'>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='monthLabel' tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar
                            dataKey='income'
                            fill={CHART_COLORS.income}
                            name='Receita'
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey='expense'
                            fill={CHART_COLORS.expense}
                            name='Despesa'
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resumo de Evolução */}
                  {chartData.length >= 2 && (
                    <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                      <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                        Resumo da Evolução
                      </h3>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-slate-500 text-sm'>Total no Período</p>
                          <p className='font-bold text-xl text-emerald-600'>
                            {formatCurrency(chartData.reduce((acc, m) => acc + m.income, 0))}
                          </p>
                          <p className='text-slate-400 text-xs'>em receitas</p>
                        </div>
                        <div>
                          <p className='text-slate-500 text-sm'>Média Mensal</p>
                          <p className='font-bold text-xl text-slate-800 dark:text-slate-100'>
                            {formatCurrency(
                              chartData.reduce((acc, m) => acc + m.balance, 0) / chartData.length
                            )}
                          </p>
                          <p className='text-slate-400 text-xs'>de saldo</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className='flex h-40 flex-col items-center justify-center'>
                  <TrendingUp className='mb-3 h-12 w-12 text-slate-300' />
                  <p className='text-slate-500'>Adicione registros para ver a evolução</p>
                </div>
              )}
            </div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <div className='space-y-3'>
              {isLoadingRecords ? (
                <div className='flex h-40 items-center justify-center'>
                  <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
                </div>
              ) : records && records.length > 0 ? (
                <>
                  <button
                    className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:border-emerald-600'
                    onClick={() => setShowAddForm(true)}
                    type='button'
                  >
                    <Plus aria-hidden='true' className='h-5 w-5' />
                    <span className='font-medium'>Novo Registro</span>
                  </button>
                  {records.map((record) => {
                    const info = getCategoryInfo(record.category)
                    return (
                      <div
                        className='flex items-center gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'
                        key={record.id}
                      >
                        <div
                          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${record.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                        >
                          {record.type === 'income' ? (
                            <ArrowUpCircle aria-hidden='true' className='h-6 w-6 text-green-600' />
                          ) : (
                            <ArrowDownCircle aria-hidden='true' className='h-6 w-6 text-red-600' />
                          )}
                          {record.isRecurring && (
                            <span
                              className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs'
                              title={`Recorrente: ${record.frequency === 'weekly' ? 'Semanal' : record.frequency === 'monthly' ? 'Mensal' : 'Anual'}`}
                            >
                              🔄
                            </span>
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <span>{info.icon}</span>
                            <p className='truncate font-medium text-slate-800 dark:text-slate-200'>
                              {info.label}
                            </p>
                            {record.isRecurring && (
                              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400'>
                                {record.frequency === 'weekly' && 'Semanal'}
                                {record.frequency === 'monthly' && 'Mensal'}
                                {record.frequency === 'yearly' && 'Anual'}
                              </span>
                            )}
                          </div>
                          {record.description && (
                            <p className='text-slate-500 text-sm'>{record.description}</p>
                          )}
                          <p className='text-slate-400 text-xs'>{formatDateShort(record.date)}</p>
                        </div>
                        <div className='flex shrink-0 items-center gap-1'>
                          <p
                            className={`whitespace-nowrap text-sm font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {record.type === 'income' ? '+' : '-'}
                            {formatCurrency(record.amount)}
                          </p>
                          <button
                            aria-label='Excluir registro'
                            className='shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                            onClick={() => setShowDeleteConfirm(record.id)}
                            title='Excluir registro'
                            type='button'
                          >
                            <Trash2 aria-hidden='true' className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className='flex h-40 flex-col items-center justify-center'>
                  <DollarSign className='mb-3 h-12 w-12 text-slate-300' />
                  <p className='text-slate-500'>Nenhum registro encontrado</p>
                  <button
                    className='mt-3 font-medium text-emerald-600 text-sm hover:underline'
                    onClick={() => setShowAddForm(true)}
                    type='button'
                  >
                    Adicionar primeiro registro
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className='space-y-3'>
              {isLoadingGoals ? (
                <div className='flex h-40 items-center justify-center'>
                  <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
                </div>
              ) : goals && goals.length > 0 ? (
                <>
                  <div className='flex gap-2'>
                    <button
                      className='flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:border-emerald-600'
                      onClick={() => setShowGoalForm(true)}
                      type='button'
                    >
                      <Plus className='h-5 w-5' />
                      <span className='font-medium'>Nova Meta</span>
                    </button>
                    <button
                      className='flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
                      disabled={recalculateGoalsMutation.isPending}
                      onClick={() => recalculateGoalsMutation.mutate()}
                      title='Recalcular progresso das metas'
                      type='button'
                    >
                      <RefreshCw
                        className={`h-5 w-5 ${recalculateGoalsMutation.isPending ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                  {goals.map((goal) => (
                    <div
                      className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'
                      key={goal.id}
                    >
                      <div className='mb-2 flex items-start justify-between'>
                        <div className='flex items-center gap-2'>
                          <Target className='h-5 w-5 text-emerald-500' />
                          <h4 className='font-medium text-slate-800 dark:text-slate-200'>
                            {goal.title}
                          </h4>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              goal.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : goal.status === 'active'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {goal.status === 'completed'
                              ? 'Concluída'
                              : goal.status === 'active'
                                ? 'Ativa'
                                : 'Pausada'}
                          </span>
                          <button
                            className='rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                            onClick={() => setShowDeleteGoalConfirm(goal.id)}
                            title='Excluir meta'
                            type='button'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                      {goal.description && (
                        <p className='mb-3 text-slate-500 text-sm'>{goal.description}</p>
                      )}
                      <div className='mb-2'>
                        <div className='mb-1 flex justify-between text-sm'>
                          <span className='text-slate-600'>
                            {goal.currentValue} / {goal.targetValue} {goal.unit}
                          </span>
                          <span className='font-medium text-emerald-600'>
                            {Math.round(goal.progress)}%
                          </span>
                        </div>
                        <div className='h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500'
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                          />
                        </div>
                      </div>
                      {goal.deadline && (
                        <p className='text-slate-400 text-xs'>
                          Prazo: {formatDateShort(goal.deadline)}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className='flex h-40 flex-col items-center justify-center'>
                  <Target className='mb-3 h-12 w-12 text-slate-300' />
                  <p className='text-slate-500'>Nenhuma meta definida</p>
                  <button
                    className='mt-3 font-medium text-emerald-600 text-sm hover:underline'
                    onClick={() => setShowGoalForm(true)}
                    type='button'
                  >
                    Criar primeira meta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-bold text-lg text-slate-800 dark:text-slate-100'>
                Novo Registro
              </h2>
              <button
                aria-label='Fechar modal'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => setShowAddForm(false)}
                type='button'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form className='space-y-4' onSubmit={handleSubmit}>
              <div className='flex gap-2'>
                <button
                  className={`flex-1 rounded-lg py-2 font-medium text-sm ${formData.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: 'income', category: 'session' }))
                  }
                  type='button'
                >
                  <ArrowUpCircle className='mr-2 inline h-4 w-4' />
                  Receita
                </button>
                <button
                  className={`flex-1 rounded-lg py-2 font-medium text-sm ${formData.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: 'expense', category: 'subscription' }))
                  }
                  type='button'
                >
                  <ArrowDownCircle className='mr-2 inline h-4 w-4' />
                  Despesa
                </button>
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Categoria
                </label>
                <select
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  value={formData.category}
                >
                  {Object.entries(FINANCIAL_CATEGORIES)
                    .filter(([, info]) => info.type === 'both' || info.type === formData.type)
                    .map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Valor
                </label>
                <input
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  min='0'
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder='0,00'
                  step='0.01'
                  type='number'
                  value={formData.amount}
                />
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Data
                </label>
                <input
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  type='date'
                  value={formData.date}
                />
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Descrição (opcional)
                </label>
                <input
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder='Ex: Sessão com João'
                  type='text'
                  value={formData.description}
                />
              </div>

              {/* Opção de Recorrência */}
              <div className='rounded-lg border border-slate-200 p-3 dark:border-slate-700'>
                <label className='flex cursor-pointer items-center gap-3'>
                  <input
                    checked={formData.isRecurring}
                    className='h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500'
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isRecurring: e.target.checked,
                        frequency: e.target.checked ? 'monthly' : '',
                      }))
                    }
                    type='checkbox'
                  />
                  <div>
                    <span className='font-medium text-slate-700 text-sm dark:text-slate-300'>
                      🔄 Registro Recorrente
                    </span>
                    <p className='text-slate-500 text-xs'>
                      Marque se esta {formData.type === 'income' ? 'receita' : 'despesa'} se repete
                    </p>
                  </div>
                </label>

                {formData.isRecurring && (
                  <div className='mt-3'>
                    <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                      Frequência
                    </label>
                    <div className='grid grid-cols-3 gap-2'>
                      <button
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          formData.frequency === 'weekly'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, frequency: 'weekly' }))}
                        type='button'
                      >
                        Semanal
                      </button>
                      <button
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          formData.frequency === 'monthly'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, frequency: 'monthly' }))}
                        type='button'
                      >
                        Mensal
                      </button>
                      <button
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          formData.frequency === 'yearly'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        onClick={() => setFormData((prev) => ({ ...prev, frequency: 'yearly' }))}
                        type='button'
                      >
                        Anual
                      </button>
                    </div>
                    <p className='mt-2 text-slate-500 text-xs'>
                      💡{' '}
                      {formData.frequency === 'weekly' && 'Este registro será lembrado toda semana'}
                      {formData.frequency === 'monthly' && 'Este registro será lembrado todo mês'}
                      {formData.frequency === 'yearly' && 'Este registro será lembrado todo ano'}
                    </p>
                  </div>
                )}
              </div>

              <button
                className='w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white disabled:opacity-50'
                disabled={addRecordMutation.isPending || !formData.amount}
                type='submit'
              >
                {addRecordMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-bold text-lg text-slate-800 dark:text-slate-100'>Nova Meta</h2>
              <button
                aria-label='Fechar modal'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => setShowGoalForm(false)}
                type='button'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <form className='space-y-4' onSubmit={handleGoalSubmit}>
              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Título
                </label>
                <input
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) => setGoalFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder='Ex: Aumentar sessões semanais'
                  type='text'
                  value={goalFormData.title}
                />
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Categoria
                </label>
                <select
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) =>
                    setGoalFormData((prev) => ({
                      ...prev,
                      category: e.target.value as GoalFormData['category'],
                    }))
                  }
                  value={goalFormData.category}
                >
                  {Object.entries(GOAL_CATEGORIES).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                    Valor Alvo
                  </label>
                  <input
                    className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    min='1'
                    onChange={(e) =>
                      setGoalFormData((prev) => ({ ...prev, targetValue: e.target.value }))
                    }
                    placeholder='Ex: 20'
                    type='number'
                    value={goalFormData.targetValue}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                    Unidade
                  </label>
                  <input
                    className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    onChange={(e) => setGoalFormData((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder='Ex: sessões/mês'
                    type='text'
                    value={goalFormData.unit}
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Prazo (opcional)
                </label>
                <input
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) =>
                    setGoalFormData((prev) => ({ ...prev, deadline: e.target.value }))
                  }
                  type='date'
                  value={goalFormData.deadline}
                />
              </div>

              <div>
                <label className='mb-1 block text-slate-700 text-sm dark:text-slate-300'>
                  Descrição (opcional)
                </label>
                <textarea
                  className='w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  onChange={(e) =>
                    setGoalFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder='Descreva sua meta...'
                  rows={2}
                  value={goalFormData.description}
                />
              </div>

              <button
                className='w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white disabled:opacity-50'
                disabled={
                  createGoalMutation.isPending || !goalFormData.title || !goalFormData.targetValue
                }
                type='submit'
              >
                {createGoalMutation.isPending ? 'Salvando...' : 'Criar Meta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {activeTab !== 'evolution' && (
        <div className='fixed right-4 bottom-24 z-40 flex flex-col gap-2'>
          <button
            className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-700 hover:to-teal-700'
            onClick={() => (activeTab === 'goals' ? setShowGoalForm(true) : setShowAddForm(true))}
            title={activeTab === 'goals' ? 'Nova Meta' : 'Novo Registro'}
            type='button'
          >
            {activeTab === 'goals' ? <Target className='h-6 w-6' /> : <Plus className='h-6 w-6' />}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                <Trash2 className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <h2 className='font-bold text-lg text-slate-800 dark:text-slate-100'>
                  Excluir Registro
                </h2>
                <p className='text-slate-500 text-sm'>Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className='mb-6 text-slate-600 dark:text-slate-400'>
              Tem certeza que deseja excluir este registro financeiro?
            </p>

            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-lg border border-slate-200 py-2.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                onClick={() => setShowDeleteConfirm(null)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50'
                disabled={deleteRecordMutation.isPending}
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                type='button'
              >
                {deleteRecordMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation Modal */}
      {showDeleteGoalConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                <Trash2 className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <h2 className='font-bold text-lg text-slate-800 dark:text-slate-100'>
                  Excluir Meta
                </h2>
                <p className='text-slate-500 text-sm'>Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className='mb-6 text-slate-600 dark:text-slate-400'>
              Tem certeza que deseja excluir esta meta?
            </p>

            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-lg border border-slate-200 py-2.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                onClick={() => setShowDeleteGoalConfirm(null)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50'
                disabled={deleteGoalMutation.isPending}
                onClick={() => handleDeleteGoal(showDeleteGoalConfirm)}
                type='button'
              >
                {deleteGoalMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300 sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-4 flex items-center justify-between sm:mb-6'>
              <h3 className='flex items-center gap-2 font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                <Settings className='text-slate-400' size={18} /> Configurações
              </h3>
              <button
                aria-label='Fechar modal'
                className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => setShowSettings(false)}
                type='button'
              >
                <X size={16} />
              </button>
            </div>
            <div className='space-y-3 sm:space-y-4'>
              {/* Modo Escuro */}
              <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
                    {realStats.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div className='min-w-0'>
                    <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                      Modo Escuro
                    </h4>
                    <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                      Ajustar aparência do app
                    </p>
                  </div>
                </div>
                <div
                  aria-checked={realStats.theme === 'dark'}
                  aria-label={
                    realStats.theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'
                  }
                  className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    realStats.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                  onClick={toggleTheme}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
                  role='switch'
                  tabIndex={0}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      realStats.theme === 'dark' ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </div>

              {/* Perfil Profissional */}
              <button
                className='flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-3 transition-colors hover:bg-indigo-100 sm:p-4 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30'
                onClick={() => {
                  setShowSettings(false)
                  setShowProfileModal(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 sm:h-9 sm:w-9 dark:bg-indigo-900/30 dark:text-indigo-400'>
                    <UserCircle size={18} />
                  </div>
                  <div className='text-left'>
                    <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                      Perfil Profissional
                    </h4>
                    <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                      Editar dados profissionais
                    </p>
                  </div>
                </div>
              </button>

              {/* Alterar Senha */}
              <button
                className='flex w-full items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-3 transition-colors hover:bg-amber-100 sm:p-4 dark:border-amber-900/30 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                onClick={() => {
                  setShowSettings(false)
                  resetPasswordForm()
                  setShowChangePassword(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 sm:h-9 sm:w-9 dark:bg-amber-900/30 dark:text-amber-400'>
                    <Key size={18} />
                  </div>
                  <div className='text-left'>
                    <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                      Alterar Senha
                    </h4>
                    <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                      Atualizar sua senha de acesso
                    </p>
                  </div>
                </div>
              </button>

              {/* Termo de Responsabilidade */}
              <button
                className='flex w-full items-center justify-between rounded-xl border border-violet-100 bg-violet-50 p-3 transition-colors hover:bg-violet-100 sm:p-4 dark:border-violet-900/30 dark:bg-violet-900/20 dark:hover:bg-violet-900/30'
                onClick={() => {
                  setShowSettings(false)
                  setShowTermsModal(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
                    <FileText size={18} />
                  </div>
                  <div className='text-left'>
                    <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                      Termo de Responsabilidade
                    </h4>
                    <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                      Visualizar termos de uso
                    </p>
                  </div>
                </div>
              </button>
            </div>
            <div className='mt-6 border-slate-100 border-t pt-4 sm:mt-8 sm:pt-6 dark:border-slate-800'>
              <button
                className='touch-target flex w-full items-center justify-center gap-2 py-2.5 font-medium text-slate-400 text-xs transition-colors hover:text-red-500 sm:py-3 sm:text-sm dark:text-slate-500'
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: async () => {
                        await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
                        window.location.href = '/auth/signin'
                      },
                    },
                  })
                }}
                type='button'
              >
                <LogOut size={16} /> Sair da conta
              </button>
            </div>
          </div>
          <div className='-z-10 absolute inset-0' onClick={() => setShowSettings(false)} />
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300 sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-4 flex items-center justify-between sm:mb-6'>
              <h3 className='flex items-center gap-2 font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                <Key className='text-violet-500' size={18} /> Alterar Senha
              </h3>
              <button
                aria-label='Fechar modal'
                className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => {
                  setShowChangePassword(false)
                  resetPasswordForm()
                }}
                type='button'
              >
                <X size={16} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className='flex flex-col items-center py-6 text-center'>
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                  <CheckCircle2 className='h-8 w-8 text-green-600 dark:text-green-400' />
                </div>
                <h4 className='mb-2 font-bold text-lg text-slate-800 dark:text-white'>
                  Senha alterada!
                </h4>
                <p className='text-slate-500 text-sm dark:text-slate-400'>
                  Sua senha foi atualizada com sucesso.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleChangePassword()
                }}
              >
                <div className='space-y-4'>
                  <div>
                    <label
                      className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                      htmlFor='currentPassword'
                    >
                      Senha atual
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='current-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                        id='currentPassword'
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                      />
                      <button
                        aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        type='button'
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                      htmlFor='newPassword'
                    >
                      Nova senha
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='new-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                        id='newPassword'
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                      />
                      <button
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        type='button'
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className='mt-1 text-slate-400 text-[10px] sm:text-xs dark:text-slate-500'>
                      Mínimo de 8 caracteres
                    </p>
                  </div>

                  <div>
                    <label
                      className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                      htmlFor='confirmPassword'
                    >
                      Confirmar nova senha
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='new-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                        id='confirmPassword'
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                      />
                      <button
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type='button'
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <div className='rounded-lg bg-red-50 p-3 text-center text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400'>
                      {passwordError}
                    </div>
                  )}

                  <button
                    className='mt-2 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
                    disabled={isChangingPassword}
                    type='submit'
                  >
                    {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div
            className='-z-10 absolute inset-0'
            onClick={() => {
              setShowChangePassword(false)
              resetPasswordForm()
            }}
          />
        </div>
      )}

      {/* Terms Modal */}
      <TherapistTermsModal
        isOpen={showTermsModal}
        mode='view'
        onClose={() => setShowTermsModal(false)}
      />

      {/* Profile Modal */}
      <TherapistProfileModal
        isOpen={showProfileModal}
        mode='edit'
        onClose={() => setShowProfileModal(false)}
        onComplete={() => setShowProfileModal(false)}
      />
    </div>
  )
}
