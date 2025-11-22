'use client'

import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Gem,
  Plus,
  Repeat,
  Target,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'

export const RoutineView: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask } = useGame()
  const [isAdding, setIsAdding] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')

  // Navigation Date State (for viewing tasks)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('') // String YYYY-MM-DD
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newTaskFrequency, setNewTaskFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>(
    'once'
  )
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([])
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([])

  // Helper to format date for display
  const formatDisplayDate = (date: Date) => {
    if (viewMode === 'month') {
      const str = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return str.charAt(0).toUpperCase() + str.slice(1)
    }

    if (viewMode === 'week') {
      const start = new Date(date)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday start
      start.setDate(diff)

      const end = new Date(start)
      end.setDate(start.getDate() + 6)

      return `${start.getDate()} ${start.toLocaleDateString('pt-BR', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('pt-BR', { month: 'short' })}`
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    if (checkDate.getTime() === today.getTime()) {
      return 'Hoje'
    }
    if (checkDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã'
    }

    // Capitalize first letter
    const dateString = date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    })
    return dateString.charAt(0).toUpperCase() + dateString.slice(1)
  }

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    setSelectedDate(newDate)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) {
      return
    }

    let dueDateTimestamp = selectedDate.getTime()

    // If user picked a specific date in the form, parse it
    if (newTaskDate) {
      const [year, month, day] = newTaskDate.split('-').map(Number)
      dueDateTimestamp = new Date(year, month - 1, day).getTime()
    }

    const baseDate = new Date(dueDateTimestamp)
    const datesToCreate: number[] = []

    // Generate dates based on frequency
    if (newTaskFrequency === 'once') {
      datesToCreate.push(dueDateTimestamp)
    } else if (newTaskFrequency === 'daily') {
      // Create tasks for next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate)
        date.setDate(baseDate.getDate() + i)
        datesToCreate.push(date.getTime())
      }
    } else if (newTaskFrequency === 'weekly') {
      if (selectedWeekDays.length === 0) {
        console.warn('Selecione pelo menos um dia da semana!')
        return
      }
      // Create tasks for selected weekdays in the next 4 weeks
      for (let week = 0; week < 4; week++) {
        selectedWeekDays.forEach((dayOfWeek) => {
          const date = new Date(baseDate)
          const currentDay = date.getDay()
          const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
          date.setDate(date.getDate() + daysUntilTarget + week * 7)
          datesToCreate.push(date.getTime())
        })
      }
    } else if (newTaskFrequency === 'monthly') {
      if (selectedMonthDays.length === 0) {
        console.warn('Selecione pelo menos um dia do mês!')
        return
      }
      // Create tasks for selected days in current and next month
      for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
        selectedMonthDays.forEach((day) => {
          const date = new Date(baseDate)
          date.setMonth(date.getMonth() + monthOffset)
          date.setDate(day)
          // Only add if the date is valid (e.g., Feb 30 doesn't exist)
          if (date.getDate() === day) {
            datesToCreate.push(date.getTime())
          }
        })
      }
    }

    // Validation: Check limits for each date
    for (const timestamp of datesToCreate) {
      const tasksForDate = tasks.filter((t) => {
        const tDate = new Date(t.dueDate)
        const targetDate = new Date(timestamp)
        return tDate.setHours(0, 0, 0, 0) === targetDate.setHours(0, 0, 0, 0)
      })

      if (newTaskPriority === 'high') {
        const highCount = tasksForDate.filter((t) => t.priority === 'high').length
        if (highCount >= 2) {
          const dateStr = new Date(timestamp).toLocaleDateString('pt-BR')
          console.warn(
            `Limite de tarefas urgentes atingido para ${dateStr}. Algumas tarefas não foram criadas.`
          )
          continue
        }
      }

      if (newTaskPriority === 'medium') {
        const mediumCount = tasksForDate.filter((t) => t.priority === 'medium').length
        if (mediumCount >= 5) {
          const dateStr = new Date(timestamp).toLocaleDateString('pt-BR')
          console.warn(
            `Limite de tarefas médias atingido para ${dateStr}. Algumas tarefas não foram criadas.`
          )
          continue
        }
      }

      // Create the task
      addTask({
        title: newTaskTitle,
        priority: newTaskPriority,
        dueDate: timestamp,
        frequency: newTaskFrequency,
        weekDays: newTaskFrequency === 'weekly' ? selectedWeekDays : undefined,
        monthDays: newTaskFrequency === 'monthly' ? selectedMonthDays : undefined,
      })
    }

    // Reset form
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskDate('')
    setNewTaskFrequency('once')
    setSelectedWeekDays([])
    setSelectedMonthDays([])
    setIsAdding(false)
  }

  // Filter tasks based on view mode
  const displayTasks = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)

    let end = new Date(start)

    if (viewMode === 'day') {
      end.setDate(start.getDate() + 1)
    } else if (viewMode === 'week') {
      // Normalize to Monday
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      end = new Date(start)
      end.setDate(start.getDate() + 7)
    } else if (viewMode === 'month') {
      start.setDate(1) // Start of month
      end = new Date(start)
      end.setMonth(start.getMonth() + 1) // Start of next month
    }

    return tasks
      .filter((t) => {
        const tDate = new Date(t.dueDate)
        return tDate.getTime() >= start.getTime() && tDate.getTime() < end.getTime()
      })
      .sort(
        (a, b) => a.dueDate - b.dueDate || (a.completed === b.completed ? 0 : a.completed ? 1 : -1)
      )
  }, [tasks, selectedDate, viewMode])

  // Calculate Progress
  const dayProgress = useMemo(() => {
    if (displayTasks.length === 0) {
      return 0
    }
    const completedCount = displayTasks.filter((t) => t.completed).length
    return Math.round((completedCount / displayTasks.length) * 100)
  }, [displayTasks])

  // Logic to hide progress bar when 100% complete
  const showProgressBar = displayTasks.length > 0 && dayProgress < 100

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case 'high':
        return {
          border: 'border-l-red-500',
          text: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-500',
        }
      case 'medium':
        return {
          border: 'border-l-orange-500',
          text: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          icon: 'text-orange-500',
        }
      case 'low':
        return {
          border: 'border-l-blue-500',
          text: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-500',
        }
      default:
        return {
          border: 'border-l-slate-300',
          text: 'text-slate-500',
          bg: 'bg-slate-50',
          icon: 'text-slate-400',
        }
    }
  }

  const getRewardValues = (priority: string) => {
    if (priority === 'high') {
      return { xp: 30, pts: 40 }
    }
    if (priority === 'medium') {
      return { xp: 20, pts: 20 }
    }
    return { xp: 10, pts: 10 }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 px-6 py-8 pb-24 dark:bg-slate-950'>
      {/* Header */}
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h2 className='font-bold text-2xl text-slate-800 dark:text-white'>Rotina</h2>
          <p className='text-slate-500 text-sm dark:text-slate-400'>Gerencie suas missões</p>
        </div>
        <button
          className='group rounded-2xl bg-violet-600 p-3 text-white shadow-lg shadow-violet-200 transition-all hover:scale-105 hover:bg-violet-700 active:scale-95 dark:shadow-none'
          onClick={() => {
            setIsAdding(!isAdding)
            const yyyy = selectedDate.getFullYear()
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0')
            const dd = String(selectedDate.getDate()).padStart(2, '0')
            setNewTaskDate(`${yyyy}-${mm}-${dd}`)
          }}
        >
          {isAdding ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* View Mode Selector */}
      <div className='mb-4 flex rounded-xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <button
          className={`flex-1 rounded-lg py-2 font-bold text-xs transition-all ${viewMode === 'day' ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}
          onClick={() => setViewMode('day')}
        >
          Hoje
        </button>
        <button
          className={`flex-1 rounded-lg py-2 font-bold text-xs transition-all ${viewMode === 'week' ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}
          onClick={() => setViewMode('week')}
        >
          Semana
        </button>
        <button
          className={`flex-1 rounded-lg py-2 font-bold text-xs transition-all ${viewMode === 'month' ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}
          onClick={() => setViewMode('month')}
        >
          Mês
        </button>
      </div>

      {/* Date Navigation Card */}
      <div className='mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <button
          className='rounded-xl p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-400'
          onClick={() => changeDate(-1)}
        >
          <ChevronLeft size={20} />
        </button>
        <div className='flex flex-col items-center'>
          <span className='font-bold text-slate-400 text-xs uppercase tracking-wider'>
            {viewMode === 'day' ? 'Dia' : viewMode === 'week' ? 'Semana' : 'Mês'}
          </span>
          <div className='flex items-center gap-2 text-center font-bold text-lg text-slate-800 dark:text-white'>
            {formatDisplayDate(selectedDate)}
          </div>
        </div>
        <button
          className='rounded-xl p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-400'
          onClick={() => changeDate(1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress Card - Only visible if < 100% and has tasks */}
      {showProgressBar && (
        <div className='fade-in slide-in-from-top-4 relative mb-8 animate-in overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-600 p-5 text-white shadow-lg shadow-violet-200 dark:shadow-none'>
          <div className='-mr-10 -mt-10 absolute top-0 right-0 h-32 w-32 rounded-full bg-white opacity-10' />

          <div className='relative z-10 mb-2 flex items-end justify-between'>
            <div>
              <p className='mb-1 font-bold text-violet-100 text-xs uppercase tracking-wider'>
                {viewMode === 'day'
                  ? 'Progresso do Dia'
                  : viewMode === 'week'
                    ? 'Progresso da Semana'
                    : 'Progresso do Mês'}
              </p>
              <h3 className='font-bold text-2xl'>{dayProgress}% Concluído</h3>
            </div>
            <div className='rounded-xl bg-white/20 p-2 backdrop-blur-sm'>
              <Target className='text-white' size={24} />
            </div>
          </div>

          <div className='relative z-10 h-2 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm'>
            <div
              className='h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out'
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {isAdding && (
        <div className='mb-8'>
          <div className='slide-in-from-top-2 zoom-in-95 relative animate-in overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-colors dark:border-slate-700 dark:bg-slate-800'>
            <div className='absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500' />

            <h3 className='mb-4 flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white'>
              <Plus className='text-violet-500' size={18} />
              Nova Missão
            </h3>

            <form onSubmit={handleAddTask}>
              <input
                autoFocus
                className='mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-900/30'
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder='Qual é o objetivo?'
                type='text'
                value={newTaskTitle}
              />

              <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {/* Date Picker */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <CalendarIcon size={12} /> Data
                  </label>
                  <input
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    type='date'
                    value={newTaskDate}
                  />
                </div>

                {/* Priority Selector */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <Flag size={12} /> Prioridade
                  </label>
                  <div className='flex gap-2'>
                    {(['low', 'medium', 'high'] as const).map((p) => {
                      const styles = getPriorityStyles(p)
                      return (
                        <button
                          className={`flex-1 rounded-lg border-2 py-2 font-bold text-xs capitalize transition-all ${
                            newTaskPriority === p
                              ? `${styles.bg} border-${styles.text.split('-')[1]}-500 ${styles.text}`
                              : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                          }
                                            `}
                          key={p}
                          onClick={() => setNewTaskPriority(p)}
                          type='button'
                        >
                          {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Frequency Selector */}
              <div className='mb-6 space-y-3'>
                <label className='flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                  <Repeat size={12} /> Frequência
                </label>
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  {(['once', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <button
                      className={`rounded-lg border-2 px-3 py-2 font-bold text-xs capitalize transition-all ${
                        newTaskFrequency === freq
                          ? 'border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                      }`}
                      key={freq}
                      onClick={() => setNewTaskFrequency(freq)}
                      type='button'
                    >
                      {freq === 'once'
                        ? 'Uma vez'
                        : freq === 'daily'
                          ? 'Diário'
                          : freq === 'weekly'
                            ? 'Semanal'
                            : 'Mensal'}
                    </button>
                  ))}
                </div>

                {/* Weekly Day Selector */}
                {newTaskFrequency === 'weekly' && (
                  <div className='fade-in slide-in-from-top-2 animate-in space-y-2'>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>
                      Selecione os dias da semana:
                    </p>
                    <div className='grid grid-cols-7 gap-1'>
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                        const isSelected = selectedWeekDays.includes(index)
                        return (
                          <button
                            className={`aspect-square rounded-lg font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                            }`}
                            key={index}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedWeekDays(selectedWeekDays.filter((d) => d !== index))
                              } else {
                                setSelectedWeekDays([...selectedWeekDays, index])
                              }
                            }}
                            type='button'
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Monthly Day Selector */}
                {newTaskFrequency === 'monthly' && (
                  <div className='fade-in slide-in-from-top-2 animate-in space-y-2'>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>
                      Selecione os dias do mês:
                    </p>
                    <div className='grid max-h-32 grid-cols-7 gap-1 overflow-y-auto'>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const isSelected = selectedMonthDays.includes(day)
                        return (
                          <button
                            className={`aspect-square rounded-lg font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                            }`}
                            key={day}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMonthDays(selectedMonthDays.filter((d) => d !== day))
                              } else {
                                setSelectedMonthDays([...selectedMonthDays, day])
                              }
                            }}
                            type='button'
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex gap-3'>
                <button
                  className='flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  onClick={() => setIsAdding(false)}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className='flex-[2] rounded-xl bg-slate-900 py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900'
                  type='submit'
                >
                  Adicionar Missão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className='space-y-3'>
        {displayTasks.length === 0 && (
          <div className='mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'>
              <Trophy size={32} />
            </div>
            <h4 className='mb-1 font-bold text-slate-700 dark:text-slate-300'>
              Nenhuma missão encontrada
            </h4>
            <p className='max-w-[200px] text-slate-400 text-xs dark:text-slate-500'>
              {viewMode === 'day' ? 'Seu dia está livre!' : 'Nenhuma tarefa neste período.'}{' '}
              Aproveite para adicionar novos objetivos.
            </p>
          </div>
        )}

        {displayTasks.map((task, index) => {
          const styles = getPriorityStyles(task.priority)
          const { xp, pts } = getRewardValues(task.priority)

          // Format date for card if not in day view
          const taskDate = new Date(task.dueDate)
          const displayDate =
            viewMode !== 'day' ? `${taskDate.getDate()}/${taskDate.getMonth() + 1}` : null

          return (
            <div
              className={`group slide-in-from-bottom-2 relative flex animate-in items-center justify-between rounded-2xl border-t border-r border-b border-l-[6px] bg-white fill-mode-backwards p-4 transition-all duration-300 dark:bg-slate-800 ${
                task.completed
                  ? 'border-slate-200 border-l-slate-300 opacity-60 grayscale-[0.5] dark:border-slate-700 dark:border-l-slate-600'
                  : `${styles.border} border-slate-100 shadow-sm hover:translate-x-1 hover:shadow-md dark:border-slate-700`
              }
                `}
              key={task.id}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className='flex flex-1 items-center gap-4'>
                <button
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    task.completed
                      ? 'scale-90 border-violet-500 bg-violet-500'
                      : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50 dark:border-slate-600 dark:hover:bg-violet-900/20'
                  }
                    `}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed && <Check className='stroke-[3] text-white' size={16} />}
                </button>

                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`font-bold text-sm transition-all sm:text-base ${task.completed ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      {task.title}
                    </span>
                    {displayDate && (
                      <span className='rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400'>
                        {displayDate}
                      </span>
                    )}
                    {task.frequency && task.frequency !== 'once' && (
                      <span className='flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 font-bold text-[10px] text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
                        <Repeat size={10} />
                        {task.frequency === 'daily'
                          ? 'Diário'
                          : task.frequency === 'weekly'
                            ? 'Semanal'
                            : 'Mensal'}
                      </span>
                    )}
                  </div>

                  {!task.completed && (
                    <div className='mt-1 flex items-center gap-2'>
                      <span
                        className={`flex items-center gap-1 font-extrabold text-[10px] uppercase tracking-wider ${styles.text}`}
                      >
                        <Flag fill='currentColor' size={10} />
                        {task.priority === 'high'
                          ? 'Urgente'
                          : task.priority === 'medium'
                            ? 'Normal'
                            : 'Baixa'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-1 pl-2'>
                {!task.completed && (
                  <div className='flex flex-col items-end gap-1'>
                    <span className='rounded-lg bg-violet-50 px-2 py-0.5 font-black text-[10px] text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'>
                      +{xp} XP
                    </span>
                    <div className='flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 dark:bg-emerald-900/20'>
                      <Gem className='text-emerald-500' size={10} />
                      <span className='font-black text-[10px] text-emerald-600 dark:text-emerald-400'>
                        +{pts}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  className='rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-900/20'
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
