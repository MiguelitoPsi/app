'use client'

import {
  ArrowLeft,
  Brain,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HelpButton } from '@/components/HelpButton'
import { trpc } from '@/lib/trpc/client'
import { useGame } from '../context/GameContext'
import type { Mood } from '../types'

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

type JournalHistoryViewProps = {
  goBack: () => void
}

type JournalEntry = {
  id: string
  thought: string
  emotion: Mood
  timestamp: number
  aiAnalysis?: string
  therapistFeedback?: string
  feedbackViewed?: boolean
  feedbackAt?: number
}

type GroupedJournal = {
  dateKey: string
  dateLabel: string
  entries: JournalEntry[]
}

export const JournalHistoryView: React.FC<JournalHistoryViewProps> = ({ goBack }) => {
  const { journal, refreshJournal } = useGame()
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [filterMood, setFilterMood] = useState<Mood | 'all' | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const [filterDate, setFilterDate] = useState<DateFilter>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // tRPC utils for invalidating cache
  const utils = trpc.useUtils()

  // Query to get unviewed feedback count
  const { data: unviewedCount = 0 } = trpc.journal.getUnviewedFeedbackCount.useQuery()

  // Mutation to mark all feedback as viewed
  const markAllFeedbackAsViewedMutation = trpc.journal.markAllFeedbackAsViewed.useMutation({
    onSuccess: () => {
      // Invalidate the unviewed feedback count so the button on home disappears
      utils.journal.getUnviewedFeedbackCount.invalidate()
      // Refresh local journal state
      refreshJournal()
    },
  })

  // Mark all feedbacks as viewed when accessing the page (if there are any)
  useEffect(() => {
    if (
      unviewedCount > 0 &&
      !markAllFeedbackAsViewedMutation.isPending &&
      !markAllFeedbackAsViewedMutation.isSuccess
    ) {
      markAllFeedbackAsViewedMutation.mutate()
    }
  }, [unviewedCount, markAllFeedbackAsViewedMutation])

  // Handle expanding an entry
  const handleExpandEntry = useCallback(
    (entry: JournalEntry) => {
      const isExpanded = expandedEntryId === entry.id
      setExpandedEntryId(isExpanded ? null : entry.id)
    },
    [expandedEntryId]
  )

  const getMoodColor = (mood: Mood) => {
    switch (mood) {
      case 'happy':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
      case 'sad':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
      case 'anxious':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
      case 'angry':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
      case 'calm':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const getMoodEmoji = (mood: Mood) => {
    const map: Record<string, string> = {
      happy: '😄',
      sad: '😔',
      anxious: '😰',
      angry: '😡',
      calm: '😌',
      neutral: '😕',
    }
    return map[mood] || '😕'
  }

  // Date filter logic
  const dateRange = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filterDate) {
      case 'today':
        return { start: today.getTime(), end: now.getTime() }
      case 'week': {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo.getTime(), end: now.getTime() }
      }
      case 'month': {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { start: monthAgo.getTime(), end: now.getTime() }
      }
      case 'custom': {
        if (customStartDate === '' || customEndDate === '') return null
        const start = new Date(customStartDate).getTime()
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        return { start, end: end.getTime() }
      }
      default:
        return null
    }
  }, [filterDate, customStartDate, customEndDate])

  const filteredJournal = useMemo(() => {
    if (filterMood === null) return []

    let result =
      filterMood === 'all' ? journal : journal.filter((entry) => entry.emotion === filterMood)

    // Apply date filter
    if (dateRange) {
      result = result.filter(
        (entry) => entry.timestamp >= dateRange.start && entry.timestamp <= dateRange.end
      )
    }

    return result
  }, [journal, filterMood, dateRange])

  const sortedJournal = [...filteredJournal].sort((a, b) => b.timestamp - a.timestamp)

  // Total count (for display purposes)
  const totalJournalCount = journal.length

  // Group entries by date
  const groupedJournal = useMemo(() => {
    const groups: Record<string, GroupedJournal> = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0]

    const getDateLabel = (date: Date) => {
      const dateKey = formatDateKey(date)
      const todayKey = formatDateKey(today)
      const yesterdayKey = formatDateKey(yesterday)

      if (dateKey === todayKey) return 'Hoje'
      if (dateKey === yesterdayKey) return 'Ontem'

      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    }

    for (const entry of sortedJournal) {
      const entryDate = new Date(entry.timestamp)
      const dateKey = formatDateKey(entryDate)

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          dateLabel: getDateLabel(entryDate),
          entries: [],
        }
      }
      groups[dateKey].entries.push(entry as JournalEntry)
    }

    // Sort groups by date (most recent first)
    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [sortedJournal])

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='border-slate-200 border-b bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            <button
              aria-label='Voltar'
              className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:scale-95 sm:h-10 sm:w-10 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              onClick={goBack}
              type='button'
            >
              <ArrowLeft className='sm:hidden' size={18} />
              <ArrowLeft className='hidden sm:block' size={20} />
            </button>
            <div>
              <h1 className='font-black text-slate-800 text-xl tracking-tight sm:text-2xl dark:text-white'>
                Registros Anteriores
              </h1>
              <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                {totalJournalCount} {totalJournalCount === 1 ? 'registro' : 'registros'} no total
              </p>
            </div>
          </div>
          <HelpButton screenId='journal-history' />
        </div>

        {/* Filters Section */}
        <div className='mt-4'>
          {/* Filter Header - Always Visible */}
          <button
            className='flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            type='button'
          >
            <div className='flex items-center gap-2'>
              <Filter className='text-slate-500 dark:text-slate-400' size={14} />
              <span className='font-bold text-slate-700 text-xs dark:text-slate-300'>Filtros</span>
              {/* Show active filters badges when collapsed */}
              {!filtersExpanded && (filterMood !== null || filterDate !== 'all') && (
                <div className='flex items-center gap-1.5'>
                  {filterMood !== null && (
                    <span className='rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'>
                      {filterMood === 'all' ? 'Todas' : getMoodEmoji(filterMood)}
                    </span>
                  )}
                  {filterDate !== 'all' && (
                    <span className='rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'>
                      {filterDate === 'today'
                        ? 'Hoje'
                        : filterDate === 'week'
                          ? '7d'
                          : filterDate === 'month'
                            ? '30d'
                            : '📅'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              {!filtersExpanded && (filterMood !== null || filterDate !== 'all') && (
                <span className='text-[10px] font-medium text-slate-500 dark:text-slate-400'>
                  {sortedJournal.length} resultados
                </span>
              )}
              {filtersExpanded ? (
                <ChevronUp className='text-slate-400' size={16} />
              ) : (
                <ChevronDown className='text-slate-400' size={16} />
              )}
            </div>
          </button>

          {/* Collapsible Filter Content */}
          {filtersExpanded && (
            <div className='mt-3 space-y-3'>
              {/* Filter Cards Container */}
              <div className='grid gap-3 sm:grid-cols-2'>
                {/* Mood Filter Card */}
                <div className='rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30'>
                      <MessageSquare className='text-violet-600 dark:text-violet-400' size={12} />
                    </div>
                    <span className='font-bold text-slate-700 text-xs dark:text-slate-300'>
                      Emoção
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    <button
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        filterMood === 'all'
                          ? 'bg-violet-500 text-white shadow-sm dark:bg-violet-600'
                          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                      onClick={() => setFilterMood(filterMood === 'all' ? null : 'all')}
                      type='button'
                    >
                      Todas
                    </button>
                    {(['happy', 'calm', 'neutral', 'sad', 'anxious', 'angry'] as Mood[]).map(
                      (mood) => (
                        <button
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            filterMood === mood
                              ? 'bg-violet-500 text-white shadow-sm dark:bg-violet-600'
                              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                          }`}
                          key={mood}
                          onClick={() => setFilterMood(filterMood === mood ? null : mood)}
                          type='button'
                        >
                          {getMoodEmoji(mood)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Date Filter Card */}
                <div className='rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30'>
                      <CalendarDays className='text-indigo-600 dark:text-indigo-400' size={12} />
                    </div>
                    <span className='font-bold text-slate-700 text-xs dark:text-slate-300'>
                      Período
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {(
                      [
                        { value: 'all', label: 'Todos' },
                        { value: 'today', label: 'Hoje' },
                        { value: 'week', label: '7 dias' },
                        { value: 'month', label: '30 dias' },
                        { value: 'custom', label: '📅' },
                      ] as const
                    ).map((option) => (
                      <button
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          filterDate === option.value
                            ? 'bg-indigo-500 text-white shadow-sm dark:bg-indigo-600'
                            : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                        }`}
                        key={option.value}
                        onClick={() =>
                          setFilterDate(filterDate === option.value ? 'all' : option.value)
                        }
                        title={option.value === 'custom' ? 'Personalizado' : option.label}
                        type='button'
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {filterDate === 'custom' && (
                <div className='rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                  <div className='flex flex-wrap items-end gap-3'>
                    <div className='flex flex-1 min-w-[130px] flex-col gap-1'>
                      <label
                        className='font-semibold text-indigo-600 text-[10px] uppercase tracking-wider dark:text-indigo-400'
                        htmlFor='start-date'
                      >
                        De
                      </label>
                      <input
                        className='rounded-lg border border-indigo-200 bg-white px-3 py-2 text-slate-700 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/30'
                        id='start-date'
                        max={customEndDate || undefined}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        type='date'
                        value={customStartDate}
                      />
                    </div>
                    <div className='flex flex-1 min-w-[130px] flex-col gap-1'>
                      <label
                        className='font-semibold text-indigo-600 text-[10px] uppercase tracking-wider dark:text-indigo-400'
                        htmlFor='end-date'
                      >
                        Até
                      </label>
                      <input
                        className='rounded-lg border border-indigo-200 bg-white px-3 py-2 text-slate-700 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-900/30'
                        id='end-date'
                        min={customStartDate || undefined}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        type='date'
                        value={customEndDate}
                      />
                    </div>
                    {(customStartDate || customEndDate) && (
                      <button
                        aria-label='Limpar datas'
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-all hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                        onClick={() => {
                          setCustomStartDate('')
                          setCustomEndDate('')
                        }}
                        type='button'
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {(filterMood !== null || filterDate !== 'all') && (
                <div className='flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800'>
                  <div className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400'>
                    <span className='font-medium'>Filtros ativos:</span>
                    {filterMood !== null && (
                      <span className='rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'>
                        {filterMood === 'all' ? 'Todas emoções' : getMoodEmoji(filterMood)}
                      </span>
                    )}
                    {filterDate !== 'all' && (
                      <span className='rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'>
                        {filterDate === 'today'
                          ? 'Hoje'
                          : filterDate === 'week'
                            ? '7 dias'
                            : filterDate === 'month'
                              ? '30 dias'
                              : 'Período'}
                      </span>
                    )}
                  </div>
                  <span className='font-bold text-slate-700 text-xs dark:text-slate-300'>
                    {sortedJournal.length} {sortedJournal.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Journal List */}
      <main className='flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32'>
        {filterMood === null ? (
          <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-violet-200 border-dashed bg-white py-12 text-center sm:rounded-3xl sm:py-16 dark:border-violet-900/50 dark:bg-slate-900'>
            <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-400 sm:mb-4 sm:h-20 sm:w-20 dark:bg-violet-900/30 dark:text-violet-500'>
              <Calendar className='sm:hidden' size={32} />
              <Calendar className='hidden sm:block' size={40} />
            </div>
            <h4 className='mb-1 font-bold text-slate-700 text-sm sm:text-base dark:text-slate-300'>
              Selecione um filtro
            </h4>
            <p className='text-slate-400 text-xs sm:text-sm dark:text-slate-500'>
              Escolha uma emoção acima para ver seus registros
            </p>
          </div>
        ) : sortedJournal.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-white py-12 text-center sm:rounded-3xl sm:py-16 dark:border-slate-800 dark:bg-slate-900'>
            <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800 dark:text-slate-600'>
              <MessageSquare className='sm:hidden' size={32} />
              <MessageSquare className='hidden sm:block' size={40} />
            </div>
            <h4 className='mb-1 font-bold text-slate-700 text-sm sm:text-base dark:text-slate-300'>
              Nenhum registro encontrado
            </h4>
            <p className='text-slate-400 text-xs sm:text-sm dark:text-slate-500'>
              {filterMood === 'all'
                ? 'Você ainda não fez nenhum registro.'
                : 'Nenhum registro com esta emoção.'}
            </p>
          </div>
        ) : (
          groupedJournal.map((group) => (
            <section key={group.dateKey}>
              {/* Date Header */}
              <div className='mb-3 flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2.5 dark:bg-slate-800/80'>
                <div className='flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30'>
                  <Calendar className='text-violet-600 dark:text-violet-400' size={12} />
                </div>
                <h2 className='flex-1 font-bold text-slate-700 text-sm capitalize dark:text-slate-300'>
                  {group.dateLabel}
                </h2>
                <span className='rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
                  {group.entries.length} {group.entries.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Entries for this date */}
              <div className='space-y-3 sm:space-y-4'>
                {group.entries.map((entry) => {
                  const isExpanded = expandedEntryId === entry.id
                  // Show as new feedback only if not yet viewed and mutation hasn't completed
                  const hasNewFeedback =
                    entry.therapistFeedback &&
                    !entry.feedbackViewed &&
                    !markAllFeedbackAsViewedMutation.isSuccess

                  return (
                    <article
                      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-slate-900 ${
                        hasNewFeedback
                          ? 'border-emerald-200 shadow-emerald-100/50 shadow-lg ring-1 ring-emerald-100 dark:border-emerald-900/50 dark:shadow-none dark:ring-emerald-900/30'
                          : 'border-slate-100 shadow-sm hover:shadow-md dark:border-slate-800'
                      }`}
                      key={entry.id}
                    >
                      <button
                        className='w-full p-4 text-left transition-colors hover:bg-slate-50 sm:p-5 dark:hover:bg-slate-800/50'
                        onClick={() => handleExpandEntry(entry)}
                        type='button'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex items-start gap-3'>
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${getMoodColor(
                                entry.emotion
                              )}`}
                            >
                              {getMoodEmoji(entry.emotion)}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div className='mb-1 flex items-center gap-2'>
                                <span className='font-bold text-slate-700 text-xs uppercase dark:text-slate-300'>
                                  {entry.emotion}
                                </span>
                                {hasNewFeedback && (
                                  <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
                                    Novo Feedback
                                  </span>
                                )}
                              </div>
                              <p className='line-clamp-2 text-slate-600 text-sm dark:text-slate-400'>
                                {entry.thought}
                              </p>
                              <div className='mt-2 flex items-center gap-2 text-slate-400 text-xs'>
                                <Calendar size={12} />
                                {new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          <Eye
                            className={`shrink-0 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            size={18}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className='space-y-4 border-slate-100 border-t p-4 sm:p-5 dark:border-slate-800'>
                          {/* Thought */}
                          <div>
                            <h3 className='mb-2 flex items-center gap-1.5 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                              <MessageSquare size={12} />
                              Pensamento
                            </h3>
                            <p className='text-slate-700 text-sm italic leading-relaxed dark:text-slate-300'>
                              "{entry.thought}"
                            </p>
                          </div>

                          {/* AI Analysis */}
                          {entry.aiAnalysis && (
                            <div className='relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                              <div className='-mr-6 -mt-6 absolute top-0 right-0 h-12 w-12 rounded-full bg-indigo-200/20' />
                              <div className='relative z-10 mb-2 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400'>
                                <Brain size={14} />
                                <span className='font-black text-xs uppercase tracking-wider'>
                                  Análise IA
                                </span>
                              </div>
                              <p className='relative z-10 font-medium text-indigo-800 text-xs leading-relaxed dark:text-indigo-200'>
                                {entry.aiAnalysis}
                              </p>
                            </div>
                          )}

                          {/* Therapist Feedback */}
                          {entry.therapistFeedback && (
                            <div className='relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10'>
                              <div className='-mr-6 -mt-6 absolute top-0 right-0 h-12 w-12 rounded-full bg-emerald-200/20' />
                              <div className='relative z-10 mb-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                                <Sparkles size={14} />
                                <span className='font-black text-xs uppercase tracking-wider'>
                                  Feedback do Terapeuta
                                </span>
                              </div>
                              <p className='relative z-10 font-medium text-emerald-800 text-xs leading-relaxed dark:text-emerald-200'>
                                {entry.therapistFeedback}
                              </p>
                              {entry.feedbackAt && (
                                <p className='relative z-10 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400'>
                                  Enviado em{' '}
                                  {new Date(entry.feedbackAt).toLocaleDateString('pt-BR')} às{' '}
                                  {new Date(entry.feedbackAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
