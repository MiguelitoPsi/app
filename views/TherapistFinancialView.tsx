'use client'

import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  FileText,
  Plus,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { FINANCIAL_CATEGORIES, GOAL_CATEGORIES } from '@/lib/constants/therapist'
import { trpc } from '@/lib/trpc/client'

const CHART_COLORS = {
  income: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
  expense: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#F59E0B', '#FB923C'],
}

type RecordFormData = {
  type: 'income' | 'expense'
  category: string
  amount: string
  description: string
  date: string
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
}

const defaultGoalFormData: GoalFormData = {
  title: '',
  description: '',
  category: 'schedule',
  targetValue: '',
  unit: '',
  deadline: '',
}

export default function TherapistFinancialView(): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [formData, setFormData] = useState<RecordFormData>(defaultFormData)
  const [goalFormData, setGoalFormData] = useState<GoalFormData>(defaultGoalFormData)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'goals'>('overview')

  const utils = trpc.useUtils()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: summary, isLoading: isLoadingSummary } =
    trpc.therapistFinancial.getSummary.useQuery({
      startDate: startOfMonth,
      endDate: endOfMonth,
    })

  const { data: records, isLoading: isLoadingRecords } =
    trpc.therapistFinancial.getRecords.useQuery({ limit: 50 })
  const { data: goals, isLoading: isLoadingGoals } = trpc.therapistFinancial.getGoals.useQuery({})
  const { data: alerts } = trpc.therapistFinancial.getAlerts.useQuery()

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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) return

    addRecordMutation.mutate({
      type: formData.type,
      category: formData.category as
        | 'session'
        | 'subscription'
        | 'rent'
        | 'equipment'
        | 'marketing'
        | 'training'
        | 'taxes'
        | 'other',
      amount: Number.parseFloat(formData.amount),
      description: formData.description || undefined,
      date: new Date(formData.date),
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

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (date: Date | string): string =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const getCategoryInfo = (category: string): { label: string; icon: string } =>
    FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES] ?? {
      label: category,
      icon: '📦',
    }

  // Dados para o gráfico circular de receitas vs despesas
  const pieChartData = useMemo(() => {
    if (!summary) return []

    const data: { name: string; value: number; type: string }[] = []
    if (summary.income > 0) {
      data.push({ name: 'Receitas', value: summary.income, type: 'income' })
    }
    if (summary.expenses > 0) {
      data.push({ name: 'Despesas', value: summary.expenses, type: 'expense' })
    }
    return data
  }, [summary])

  // Dados para o gráfico de despesas por categoria
  const expensesByCategoryData = useMemo(() => {
    if (!summary?.byCategory) return []

    return Object.entries(summary.byCategory)
      .filter(([, values]) => values.expense > 0)
      .map(([category, values], index) => {
        const info = FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES]
        return {
          name: info?.label ?? category,
          value: values.expense,
          color: CHART_COLORS.expense[index % CHART_COLORS.expense.length],
        }
      })
  }, [summary])

  // Dados para o gráfico de receitas por categoria
  const incomeByCategoryData = useMemo(() => {
    if (!summary?.byCategory) return []

    return Object.entries(summary.byCategory)
      .filter(([, values]) => values.income > 0)
      .map(([category, values], index) => {
        const info = FINANCIAL_CATEGORIES[category as keyof typeof FINANCIAL_CATEGORIES]
        return {
          name: info?.label ?? category,
          value: values.income,
          color: CHART_COLORS.income[index % CHART_COLORS.income.length],
        }
      })
  }, [summary])

  // Gerar relatório financeiro
  const financialReport = useMemo(() => {
    if (!summary) return null

    const profitMargin =
      summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : '0'
    const expenseRatio =
      summary.income > 0 ? ((summary.expenses / summary.income) * 100).toFixed(1) : '0'

    // Análise de despesas
    const expenseCategories = Object.entries(summary.byCategory)
      .filter(([, values]) => values.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)

    const topExpenseCategory = expenseCategories[0]
    const topExpensePercentage =
      summary.expenses > 0 && topExpenseCategory
        ? ((topExpenseCategory[1].expense / summary.expenses) * 100).toFixed(1)
        : '0'

    // Análise de receitas
    const incomeCategories = Object.entries(summary.byCategory)
      .filter(([, values]) => values.income > 0)
      .sort((a, b) => b[1].income - a[1].income)

    const topIncomeCategory = incomeCategories[0]
    const topIncomePercentage =
      summary.income > 0 && topIncomeCategory
        ? ((topIncomeCategory[1].income / summary.income) * 100).toFixed(1)
        : '0'

    // Insights e recomendações (dados brutos, formatação na renderização)
    type InsightData = {
      type: 'success' | 'warning' | 'info'
      messageKey:
        | 'positiveBalance'
        | 'negativeBalance'
        | 'highExpenseRatio'
        | 'lowExpenseRatio'
        | 'sessionsInfo'
        | 'topExpenseInfo'
      values: Record<string, string | number>
    }
    const insightsData: InsightData[] = []

    if (summary.balance > 0) {
      insightsData.push({
        type: 'success',
        messageKey: 'positiveBalance',
        values: { balance: summary.balance },
      })
    } else if (summary.balance < 0) {
      insightsData.push({
        type: 'warning',
        messageKey: 'negativeBalance',
        values: { balance: Math.abs(summary.balance) },
      })
    }

    if (Number(expenseRatio) > 70) {
      insightsData.push({
        type: 'warning',
        messageKey: 'highExpenseRatio',
        values: { ratio: expenseRatio },
      })
    } else if (Number(expenseRatio) < 50) {
      insightsData.push({
        type: 'success',
        messageKey: 'lowExpenseRatio',
        values: { ratio: expenseRatio },
      })
    }

    if (summary.sessionsCount > 0) {
      insightsData.push({
        type: 'info',
        messageKey: 'sessionsInfo',
        values: { count: summary.sessionsCount, avgValue: summary.averageSessionValue },
      })
    }

    if (topExpenseCategory && Number(topExpensePercentage) > 50) {
      insightsData.push({
        type: 'info',
        messageKey: 'topExpenseInfo',
        values: { category: topExpenseCategory[0], percentage: topExpensePercentage },
      })
    }

    return {
      profitMargin,
      expenseRatio,
      topExpenseCategory,
      topExpensePercentage,
      topIncomeCategory,
      topIncomePercentage,
      expenseCategories,
      incomeCategories,
      insightsData,
    }
  }, [summary])

  // Função para formatar mensagens de insight
  const formatInsightMessage = (
    insight: NonNullable<typeof financialReport>['insightsData'][number]
  ): string => {
    switch (insight.messageKey) {
      case 'positiveBalance':
        return `Excelente! Você tem um saldo positivo de ${formatCurrency(insight.values.balance as number)} este mês.`
      case 'negativeBalance':
        return `Atenção: Suas despesas superam suas receitas em ${formatCurrency(insight.values.balance as number)}.`
      case 'highExpenseRatio':
        return `Suas despesas representam ${insight.values.ratio}% das receitas. Considere revisar os custos.`
      case 'lowExpenseRatio':
        return `Ótima gestão! Suas despesas representam apenas ${insight.values.ratio}% das receitas.`
      case 'sessionsInfo':
        return `Você realizou ${insight.values.count} sessões com valor médio de ${formatCurrency(insight.values.avgValue as number)}.`
      case 'topExpenseInfo':
        return `${getCategoryInfo(insight.values.category as string).label} representa ${insight.values.percentage}% das suas despesas.`
      default:
        return ''
    }
  }

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'records', label: 'Registros' },
    { id: 'goals', label: 'Metas' },
  ]

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='bg-gradient-to-br from-emerald-600 to-teal-700 pt-safe text-white'>
        <div className='px-4 pt-6 pb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='mb-2 font-bold text-2xl'>Gestão Financeira</h1>
              <p className='text-emerald-100'>Controle suas receitas e despesas</p>
            </div>
            <button
              className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/30'
              onClick={() => (activeTab === 'goals' ? setShowGoalForm(true) : setShowAddForm(true))}
              title={activeTab === 'goals' ? 'Nova Meta' : 'Novo Registro'}
              type='button'
            >
              <Plus className='h-6 w-6' />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {summary && (
          <div className='grid grid-cols-3 gap-3 px-4 pb-4'>
            <div className='rounded-xl bg-white/10 p-3 backdrop-blur-sm'>
              <p className='text-emerald-100 text-xs'>Receitas</p>
              <p className='font-bold text-lg'>{formatCurrency(summary.income)}</p>
            </div>
            <div className='rounded-xl bg-white/10 p-3 backdrop-blur-sm'>
              <p className='text-emerald-100 text-xs'>Despesas</p>
              <p className='font-bold text-lg'>{formatCurrency(summary.expenses)}</p>
            </div>
            <div className='rounded-xl bg-white/10 p-3 backdrop-blur-sm'>
              <p className='text-emerald-100 text-xs'>Saldo</p>
              <p
                className={`font-bold text-lg ${summary.balance >= 0 ? 'text-white' : 'text-red-300'}`}
              >
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className='border-slate-200 border-b bg-white px-4 dark:border-slate-800 dark:bg-slate-900'>
        <div className='flex gap-1'>
          {tabs.map((tab) => (
            <button
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-emerald-600 border-b-2 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type='button'
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto p-4 pb-24'>
        {/* Alerts */}
        {alerts && alerts.length > 0 && activeTab === 'overview' && (
          <div className='mb-4 space-y-2'>
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
            {isLoadingSummary ? (
              <div className='flex h-40 items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600' />
              </div>
            ) : summary ? (
              <>
                {/* Gráfico Circular - Receitas vs Despesas */}
                {pieChartData.length > 0 && (
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Balanço do Mês
                    </h3>
                    <div className='h-64'>
                      <ResponsiveContainer height='100%' width='100%'>
                        <PieChart>
                          <Pie
                            cx='50%'
                            cy='50%'
                            data={pieChartData}
                            dataKey='value'
                            innerRadius={60}
                            label={({ name, percent }) =>
                              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                fill={entry.type === 'income' ? '#10B981' : '#EF4444'}
                                key={`cell-${index}`}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className='mt-3 flex justify-center gap-6'>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-emerald-500' />
                        <span className='text-slate-600 text-sm dark:text-slate-400'>
                          Receitas: {formatCurrency(summary.income)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-red-500' />
                        <span className='text-slate-600 text-sm dark:text-slate-400'>
                          Despesas: {formatCurrency(summary.expenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráfico de Despesas por Categoria */}
                {expensesByCategoryData.length > 0 && (
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Despesas por Categoria
                    </h3>
                    <div className='h-56'>
                      <ResponsiveContainer height='100%' width='100%'>
                        <PieChart>
                          <Pie
                            cx='50%'
                            cy='50%'
                            data={expensesByCategoryData}
                            dataKey='value'
                            innerRadius={40}
                            label={({ name, percent }) =>
                              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {expensesByCategoryData.map((entry, index) => (
                              <Cell fill={entry.color} key={`expense-cell-${index}`} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className='mt-2 flex flex-wrap justify-center gap-3'>
                      {expensesByCategoryData.map((item) => (
                        <div className='flex items-center gap-1.5' key={item.name}>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: item.color }}
                          />
                          <span className='text-slate-600 text-xs dark:text-slate-400'>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gráfico de Receitas por Categoria */}
                {incomeByCategoryData.length > 0 && (
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                      Receitas por Categoria
                    </h3>
                    <div className='h-56'>
                      <ResponsiveContainer height='100%' width='100%'>
                        <PieChart>
                          <Pie
                            cx='50%'
                            cy='50%'
                            data={incomeByCategoryData}
                            dataKey='value'
                            innerRadius={40}
                            label={({ name, percent }) =>
                              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {incomeByCategoryData.map((entry, index) => (
                              <Cell fill={entry.color} key={`income-cell-${index}`} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className='mt-2 flex flex-wrap justify-center gap-3'>
                      {incomeByCategoryData.map((item) => (
                        <div className='flex items-center gap-1.5' key={item.name}>
                          <div
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ backgroundColor: item.color }}
                          />
                          <span className='text-slate-600 text-xs dark:text-slate-400'>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relatório Financeiro */}
                {financialReport && (
                  <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                    <div className='mb-4 flex items-center gap-2'>
                      <FileText className='h-5 w-5 text-emerald-600' />
                      <h3 className='font-semibold text-slate-800 dark:text-slate-200'>
                        Relatório Financeiro
                      </h3>
                    </div>

                    {/* Métricas Principais */}
                    <div className='mb-4 grid grid-cols-2 gap-3'>
                      <div className='rounded-lg bg-slate-50 p-3 dark:bg-slate-800'>
                        <p className='text-slate-500 text-xs'>Margem de Lucro</p>
                        <p
                          className={`font-bold text-xl ${
                            Number(financialReport.profitMargin) >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {financialReport.profitMargin}%
                        </p>
                      </div>
                      <div className='rounded-lg bg-slate-50 p-3 dark:bg-slate-800'>
                        <p className='text-slate-500 text-xs'>Ratio Despesas/Receitas</p>
                        <p
                          className={`font-bold text-xl ${
                            Number(financialReport.expenseRatio) <= 70
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {financialReport.expenseRatio}%
                        </p>
                      </div>
                    </div>

                    {/* Top Categorias */}
                    {(financialReport.topIncomeCategory || financialReport.topExpenseCategory) && (
                      <div className='mb-4 space-y-2'>
                        {financialReport.topIncomeCategory && (
                          <div className='flex items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20'>
                            <div className='flex items-center gap-2'>
                              <ArrowUpCircle className='h-4 w-4 text-emerald-600' />
                              <span className='text-emerald-800 text-sm dark:text-emerald-300'>
                                Principal fonte de receita
                              </span>
                            </div>
                            <span className='font-medium text-emerald-700 text-sm dark:text-emerald-400'>
                              {getCategoryInfo(financialReport.topIncomeCategory[0]).label} (
                              {financialReport.topIncomePercentage}%)
                            </span>
                          </div>
                        )}
                        {financialReport.topExpenseCategory && (
                          <div className='flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                            <div className='flex items-center gap-2'>
                              <ArrowDownCircle className='h-4 w-4 text-red-600' />
                              <span className='text-red-800 text-sm dark:text-red-300'>
                                Maior despesa
                              </span>
                            </div>
                            <span className='font-medium text-red-700 text-sm dark:text-red-400'>
                              {getCategoryInfo(financialReport.topExpenseCategory[0]).label} (
                              {financialReport.topExpensePercentage}%)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Insights e Recomendações */}
                    {financialReport.insightsData.length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='font-medium text-slate-700 text-sm dark:text-slate-300'>
                          💡 Insights
                        </h4>
                        {financialReport.insightsData.map((insight, index) => (
                          <div
                            className={`rounded-lg p-3 text-sm ${
                              insight.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                                : insight.type === 'warning'
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                  : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                            }`}
                            key={index}
                          >
                            {insight.type === 'success' && '✅ '}
                            {insight.type === 'warning' && '⚠️ '}
                            {insight.type === 'info' && 'ℹ️ '}
                            {formatInsightMessage(insight)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Detalhamento Completo */}
                    <details className='mt-4'>
                      <summary className='cursor-pointer font-medium text-emerald-600 text-sm hover:text-emerald-700'>
                        Ver detalhamento completo
                      </summary>
                      <div className='mt-3 space-y-3'>
                        {financialReport.incomeCategories.length > 0 && (
                          <div>
                            <h5 className='mb-2 font-medium text-slate-700 text-xs dark:text-slate-300'>
                              Receitas Detalhadas
                            </h5>
                            {financialReport.incomeCategories.map(([category, values]) => (
                              <div
                                className='flex items-center justify-between border-slate-100 border-b py-1.5 dark:border-slate-700'
                                key={category}
                              >
                                <span className='text-slate-600 text-sm dark:text-slate-400'>
                                  {getCategoryInfo(category).icon} {getCategoryInfo(category).label}
                                </span>
                                <span className='font-medium text-emerald-600 text-sm'>
                                  {formatCurrency(values.income)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {financialReport.expenseCategories.length > 0 && (
                          <div>
                            <h5 className='mb-2 font-medium text-slate-700 text-xs dark:text-slate-300'>
                              Despesas Detalhadas
                            </h5>
                            {financialReport.expenseCategories.map(([category, values]) => (
                              <div
                                className='flex items-center justify-between border-slate-100 border-b py-1.5 dark:border-slate-700'
                                key={category}
                              >
                                <span className='text-slate-600 text-sm dark:text-slate-400'>
                                  {getCategoryInfo(category).icon} {getCategoryInfo(category).label}
                                </span>
                                <span className='font-medium text-red-600 text-sm'>
                                  {formatCurrency(values.expense)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                  <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                    Sessões do Mês
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-slate-500 text-sm'>Realizadas</p>
                      <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                        {summary.sessionsCount}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-500 text-sm'>Valor Médio</p>
                      <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                        {formatCurrency(summary.averageSessionValue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'>
                  <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                    Por Categoria
                  </h3>
                  <div className='space-y-3'>
                    {Object.entries(summary.byCategory).map(([category, values]) => {
                      const info = getCategoryInfo(category)
                      return (
                        <div className='flex items-center justify-between' key={category}>
                          <div className='flex items-center gap-2'>
                            <span>{info.icon}</span>
                            <span className='text-slate-700 text-sm dark:text-slate-300'>
                              {info.label}
                            </span>
                          </div>
                          <div className='text-right'>
                            {values.income > 0 && (
                              <span className='font-medium text-green-600 text-sm'>
                                +{formatCurrency(values.income)}
                              </span>
                            )}
                            {values.expense > 0 && (
                              <span className='ml-2 font-medium text-red-600 text-sm'>
                                -{formatCurrency(values.expense)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className='flex h-40 items-center justify-center'>
                <p className='text-slate-500'>Sem dados para exibir</p>
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
                  <Plus className='h-5 w-5' />
                  <span className='font-medium'>Novo Registro</span>
                </button>
                {records.map((record) => {
                  const info = getCategoryInfo(record.category)
                  return (
                    <div
                      className='flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'
                      key={record.id}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${record.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                      >
                        {record.type === 'income' ? (
                          <ArrowUpCircle className='h-6 w-6 text-green-600' />
                        ) : (
                          <ArrowDownCircle className='h-6 w-6 text-red-600' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <span>{info.icon}</span>
                          <p className='font-medium text-slate-800 dark:text-slate-200'>
                            {info.label}
                          </p>
                        </div>
                        {record.description && (
                          <p className='text-slate-500 text-sm'>{record.description}</p>
                        )}
                        <p className='text-slate-400 text-xs'>{formatDate(record.date)}</p>
                      </div>
                      <p
                        className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {record.type === 'income' ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </p>
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
                <button
                  className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:border-emerald-600'
                  onClick={() => setShowGoalForm(true)}
                  type='button'
                >
                  <Plus className='h-5 w-5' />
                  <span className='font-medium'>Nova Meta</span>
                </button>
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
                      <p className='text-slate-400 text-xs'>Prazo: {formatDate(goal.deadline)}</p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className='flex h-40 flex-col items-center justify-center'>
                <TrendingUp className='mb-3 h-12 w-12 text-slate-300' />
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
                className='rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800'
                onClick={() => setShowAddForm(false)}
                type='button'
              >
                <X className='h-5 w-5 text-slate-500' />
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
                className='rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800'
                onClick={() => setShowGoalForm(false)}
                type='button'
              >
                <X className='h-5 w-5 text-slate-500' />
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
      <div className='fixed right-4 bottom-24 z-40 flex flex-col gap-2'>
        {activeTab === 'goals' ? (
          <button
            className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-700 hover:to-teal-700'
            onClick={() => setShowGoalForm(true)}
            title='Nova Meta'
            type='button'
          >
            <Target className='h-6 w-6' />
          </button>
        ) : (
          <button
            className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-700 hover:to-teal-700'
            onClick={() => setShowAddForm(true)}
            title='Novo Registro'
            type='button'
          >
            <DollarSign className='h-6 w-6' />
          </button>
        )}
      </div>
    </div>
  )
}
