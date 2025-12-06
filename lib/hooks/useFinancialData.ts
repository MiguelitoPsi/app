'use client'

import { useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'

export type PeriodType = 'month' | 'quarter' | 'semester' | 'year' | 'custom'

export type PeriodRange = {
  startDate: Date
  endDate: Date
  label: string
}

/**
 * Calcula o intervalo de datas para um período específico
 */
export function getPeriodRange(period: PeriodType, referenceDate: Date = new Date()): PeriodRange {
  const now = new Date(referenceDate)

  switch (period) {
    case 'month': {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return { startDate, endDate, label: label.charAt(0).toUpperCase() + label.slice(1) }
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      const startDate = new Date(now.getFullYear(), quarter * 3, 1)
      const endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      return {
        startDate,
        endDate,
        label: `${quarter + 1}º Trimestre ${now.getFullYear()}`,
      }
    }
    case 'semester': {
      const semester = Math.floor(now.getMonth() / 6)
      const startDate = new Date(now.getFullYear(), semester * 6, 1)
      const endDate = new Date(now.getFullYear(), semester * 6 + 6, 0)
      return {
        startDate,
        endDate,
        label: `${semester + 1}º Semestre ${now.getFullYear()}`,
      }
    }
    case 'year': {
      const startDate = new Date(now.getFullYear(), 0, 1)
      const endDate = new Date(now.getFullYear(), 11, 31)
      return {
        startDate,
        endDate,
        label: `Ano ${now.getFullYear()}`,
      }
    }
    default: {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { startDate, endDate, label: 'Personalizado' }
    }
  }
}

/**
 * Calcula o período anterior para comparação
 */
export function getPreviousPeriodRange(period: PeriodType, currentRange: PeriodRange): PeriodRange {
  const { startDate } = currentRange

  switch (period) {
    case 'month': {
      const prevStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
      const prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
      const label = prevStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return {
        startDate: prevStart,
        endDate: prevEnd,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      }
    }
    case 'quarter': {
      const prevStart = new Date(startDate.getFullYear(), startDate.getMonth() - 3, 1)
      const prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
      const quarter = Math.floor(prevStart.getMonth() / 3)
      return {
        startDate: prevStart,
        endDate: prevEnd,
        label: `${quarter + 1}º Trimestre ${prevStart.getFullYear()}`,
      }
    }
    case 'semester': {
      const prevStart = new Date(startDate.getFullYear(), startDate.getMonth() - 6, 1)
      const prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
      const semester = Math.floor(prevStart.getMonth() / 6)
      return {
        startDate: prevStart,
        endDate: prevEnd,
        label: `${semester + 1}º Semestre ${prevStart.getFullYear()}`,
      }
    }
    case 'year': {
      const prevStart = new Date(startDate.getFullYear() - 1, 0, 1)
      const prevEnd = new Date(startDate.getFullYear() - 1, 11, 31)
      return {
        startDate: prevStart,
        endDate: prevEnd,
        label: `Ano ${prevStart.getFullYear()}`,
      }
    }
    default:
      return currentRange
  }
}

/**
 * Calcula a variação percentual entre dois valores
 * Retorna null quando não há dados suficientes para comparação significativa
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    // Se não havia valor anterior, não faz sentido mostrar porcentagem
    return null
  }
  return ((current - previous) / previous) * 100
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Formata data curta
 */
export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/**
 * Formata data com mês por extenso
 */
export function formatDateMonthYear(date: Date | string): string {
  const d = new Date(date)
  const month = d.toLocaleDateString('pt-BR', { month: 'short' })
  return `${month.charAt(0).toUpperCase()}${month.slice(1, 3)}`
}

export type FinancialProjection = {
  projectedIncome: number
  projectedExpenses: number
  projectedBalance: number
  daysRemaining: number
  averageDailyIncome: number
  averageDailyExpense: number
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Calcula projeções financeiras para o final do período
 */
export function calculateProjection(
  currentIncome: number,
  currentExpenses: number,
  startDate: Date,
  endDate: Date
): FinancialProjection {
  const now = new Date()
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysPassed = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )
  const daysRemaining = Math.max(0, totalDays - daysPassed)

  const averageDailyIncome = currentIncome / daysPassed
  const averageDailyExpense = currentExpenses / daysPassed

  const projectedIncome = currentIncome + averageDailyIncome * daysRemaining
  const projectedExpenses = currentExpenses + averageDailyExpense * daysRemaining
  const projectedBalance = projectedIncome - projectedExpenses

  // Confiança baseada na quantidade de dados
  let confidence: 'low' | 'medium' | 'high' = 'low'
  if (daysPassed >= totalDays * 0.7) {
    confidence = 'high'
  } else if (daysPassed >= totalDays * 0.4) {
    confidence = 'medium'
  }

  return {
    projectedIncome: Math.round(projectedIncome * 100) / 100,
    projectedExpenses: Math.round(projectedExpenses * 100) / 100,
    projectedBalance: Math.round(projectedBalance * 100) / 100,
    daysRemaining,
    averageDailyIncome: Math.round(averageDailyIncome * 100) / 100,
    averageDailyExpense: Math.round(averageDailyExpense * 100) / 100,
    confidence,
  }
}

export type MonthlyDataPoint = {
  month: string
  monthLabel: string
  income: number
  expense: number
  balance: number
}

/**
 * Agrupa registros financeiros por mês
 */
export function groupByMonth(
  records: Array<{
    date: Date | string
    type: 'income' | 'expense'
    amount: number
  }>
): MonthlyDataPoint[] {
  const grouped: Record<string, { income: number; expense: number }> = {}

  for (const record of records) {
    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[monthKey]) {
      grouped[monthKey] = { income: 0, expense: 0 }
    }

    if (record.type === 'income') {
      grouped[monthKey].income += record.amount
    } else {
      grouped[monthKey].expense += record.amount
    }
  }

  return Object.entries(grouped)
    .map(([month, values]) => {
      const [year, monthNum] = month.split('-')
      const date = new Date(Number(year), Number(monthNum) - 1)
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' })

      return {
        month,
        monthLabel: `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1, 3)}`,
        income: values.income,
        expense: values.expense,
        balance: values.income - values.expense,
      }
    })
    .sort((a, b) => a.month.localeCompare(b.month))
}

export type UseFinancialDataOptions = {
  period: PeriodType
  enableComparison?: boolean
  historyMonths?: number
  referenceDate?: Date
}

/**
 * Hook centralizado para dados financeiros do terapeuta
 */
export function useFinancialData(options: UseFinancialDataOptions) {
  const {
    period,
    enableComparison = true,
    historyMonths = 12,
    referenceDate = new Date(),
  } = options

  const currentRange = useMemo(() => getPeriodRange(period, referenceDate), [period, referenceDate])
  const previousRange = useMemo(
    () => (enableComparison ? getPreviousPeriodRange(period, currentRange) : null),
    [period, currentRange, enableComparison]
  )

  // Resumo do período atual
  const {
    data: currentSummary,
    isLoading: isLoadingCurrent,
    refetch: refetchCurrent,
  } = trpc.therapistFinancial.getSummary.useQuery(
    {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Resumo do período anterior (para comparação)
  const { data: previousSummary, isLoading: isLoadingPrevious } =
    trpc.therapistFinancial.getSummary.useQuery(
      {
        startDate: previousRange?.startDate ?? new Date(),
        endDate: previousRange?.endDate ?? new Date(),
      },
      {
        enabled: enableComparison && previousRange !== null,
        staleTime: 5 * 60 * 1000, // 5 minutes - previous data changes less often
      }
    )

  // Histórico mensal para gráficos
  const { data: monthlyCashflow, isLoading: isLoadingCashflow } =
    trpc.therapistFinancial.getMonthlyCashflow.useQuery(
      { months: historyMonths },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    )

  // Registros recentes
  const { data: records, isLoading: isLoadingRecords } =
    trpc.therapistFinancial.getRecords.useQuery(
      {
        startDate: currentRange.startDate,
        endDate: currentRange.endDate,
        limit: 100,
      },
      {
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    )

  // Cálculos derivados
  const comparison = useMemo(() => {
    if (!currentSummary) return null
    if (!previousSummary) return null

    return {
      incomeChange: calculatePercentageChange(currentSummary.income, previousSummary.income),
      expenseChange: calculatePercentageChange(currentSummary.expenses, previousSummary.expenses),
      balanceChange: calculatePercentageChange(currentSummary.balance, previousSummary.balance),
      sessionsChange: calculatePercentageChange(
        currentSummary.sessionsCount,
        previousSummary.sessionsCount
      ),
      // Flags para saber se há dados anteriores válidos para comparação
      hasPreviousIncome: previousSummary.income > 0,
      hasPreviousExpenses: previousSummary.expenses > 0,
      hasPreviousBalance: previousSummary.balance !== 0,
    }
  }, [currentSummary, previousSummary])

  const projection = useMemo(() => {
    if (!currentSummary) return null
    return calculateProjection(
      currentSummary.income,
      currentSummary.expenses,
      currentRange.startDate,
      currentRange.endDate
    )
  }, [currentSummary, currentRange])

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (!currentSummary) return null

    const profitMargin =
      currentSummary.income > 0
        ? ((currentSummary.balance / currentSummary.income) * 100).toFixed(1)
        : '0'

    const expenseRatio =
      currentSummary.income > 0
        ? ((currentSummary.expenses / currentSummary.income) * 100).toFixed(1)
        : '0'

    // Top categorias
    const expenseCategories = Object.entries(currentSummary.byCategory)
      .filter(([, values]) => values.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)

    const incomeCategories = Object.entries(currentSummary.byCategory)
      .filter(([, values]) => values.income > 0)
      .sort((a, b) => b[1].income - a[1].income)

    return {
      profitMargin: Number(profitMargin),
      expenseRatio: Number(expenseRatio),
      topExpenseCategory: expenseCategories[0] ?? null,
      topIncomeCategory: incomeCategories[0] ?? null,
      expenseCategories,
      incomeCategories,
    }
  }, [currentSummary])

  // Dados para gráficos
  const chartData = useMemo(() => {
    if (!monthlyCashflow) return null

    return monthlyCashflow.map((item) => ({
      ...item,
      monthLabel: formatDateMonthYear(new Date(item.month)),
    }))
  }, [monthlyCashflow])

  const isLoading = isLoadingCurrent || isLoadingPrevious || isLoadingCashflow || isLoadingRecords

  return {
    // Período atual
    currentRange,
    previousRange,
    currentSummary,
    previousSummary,

    // Dados calculados
    comparison,
    projection,
    metrics,
    chartData,

    // Registros
    records,

    // Estados
    isLoading,
    isLoadingCurrent,
    isLoadingRecords,

    // Ações
    refetch: refetchCurrent,
  }
}

/**
 * Opções de período para o seletor
 */
export const PERIOD_OPTIONS: Array<{ value: PeriodType; label: string }> = [
  { value: 'month', label: 'Mensal' },
  { value: 'quarter', label: 'Trimestral' },
  { value: 'semester', label: 'Semestral' },
  { value: 'year', label: 'Anual' },
]
