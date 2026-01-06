'use client'

import confetti from 'canvas-confetti'
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
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
import { useEffect, useMemo, useState } from 'react'
import { HelpButton } from '@/components/HelpButton'
import { XPAnimationContainer } from '@/components/XPAnimation/XPAnimationContainer'
import { useSound } from '@/hooks/useSound'
import { useXPAnimation } from '@/hooks/useXPAnimation'
import { useGame } from '../context/GameContext'

export const RoutineView: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask, urgentOverdueTasks, dismissUrgentTask } =
    useGame()
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

  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertTitle, setAlertTitle] = useState('Atenção')

  // Overdue Alert Modal State
  const [showOverdueAlert, setShowOverdueAlert] = useState(false)

  // Show overdue alert when there are urgent tasks
  useEffect(() => {
    if (urgentOverdueTasks.length > 0) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => {
        setShowOverdueAlert(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [urgentOverdueTasks.length])

  // Listen for central button toggle event from BottomNav
  useEffect(() => {
    const handleToggle = () => {
      setIsAdding((prev) => {
        // When opening, set the date to today or selected date
        if (!prev) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const selected = new Date(selectedDate)
          selected.setHours(0, 0, 0, 0)
          const dateToUse = selected < today ? today : selectedDate
          const yyyy = dateToUse.getFullYear()
          const mm = String(dateToUse.getMonth() + 1).padStart(2, '0')
          const dd = String(dateToUse.getDate()).padStart(2, '0')
          setNewTaskDate(`${yyyy}-${mm}-${dd}`)
        }
        return !prev
      })
    }
    window.addEventListener('toggleRoutineAdd', handleToggle)
    return () => window.removeEventListener('toggleRoutineAdd', handleToggle)
  }, [selectedDate])

  // Lock scroll when modal is open
  useEffect(() => {
    if (isAdding) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAdding])

  // Ripple Animation State
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([])

  // XP Animation to bar
  const { particles, triggerAnimation } = useXPAnimation()

  // Sound effects
  const { playSuccess, playClick, playDelete, playError } = useSound()

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

    // Validate that the date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedTaskDate = new Date(dueDateTimestamp)
    selectedTaskDate.setHours(0, 0, 0, 0)

    if (selectedTaskDate < today) {
      playError()
      const dateStr = selectedTaskDate.toLocaleDateString('pt-BR')
      setAlertMessage(
        `Data inválida!\n\nNão é possível criar tarefas para datas que já passaram.\n\nData selecionada: ${dateStr}`
      )
      setAlertTitle('Data no Passado')
      setShowAlert(true)
      return
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

    console.log(`Creating ${datesToCreate.length} tasks for frequency: ${newTaskFrequency}`, {
      dates: datesToCreate.map((d) => new Date(d).toLocaleDateString('pt-BR')),
      title: newTaskTitle,
      priority: newTaskPriority,
    })

    // Validation: Check limits for the first date (to prevent creation)
    const firstTimestamp = datesToCreate[0]
    if (firstTimestamp) {
      const targetDate = new Date(firstTimestamp)

      const tasksForDate = tasks.filter((t) => {
        const tDate = new Date(t.dueDate)
        return (
          tDate.getDate() === targetDate.getDate() &&
          tDate.getMonth() === targetDate.getMonth() &&
          tDate.getFullYear() === targetDate.getFullYear()
        )
      })

      // Count ALL tasks regardless of completion status
      // We explicitly filter to ensure we are counting everything
      if (newTaskPriority === 'high') {
        const highCount = tasksForDate.filter((t) => t.priority === 'high').length
        if (highCount >= 2) {
          const dateStr = targetDate.toLocaleDateString('pt-BR')
          setAlertMessage(
            `Limite atingido!\n\nVocê só pode adicionar 2 tarefas de prioridade ALTA por dia.\n\nData: ${dateStr}\nTarefas de alta prioridade: ${highCount}/2`
          )
          setAlertTitle('Limite de Tarefas')
          setShowAlert(true)
          return
        }
      }

      if (newTaskPriority === 'medium') {
        const mediumCount = tasksForDate.filter((t) => t.priority === 'medium').length
        if (mediumCount >= 5) {
          const dateStr = targetDate.toLocaleDateString('pt-BR')
          setAlertMessage(
            `Limite atingido!\n\nVocê só pode adicionar 5 tarefas de prioridade MÉDIA por dia.\n\nData: ${dateStr}\nTarefas de média prioridade: ${mediumCount}/5`
          )
          setAlertTitle('Limite de Tarefas')
          setShowAlert(true)
          return
        }
      }
    }

    // Create tasks - fire and forget for instant UI response
    // Tasks are added optimistically in GameContext
    for (const timestamp of datesToCreate) {
      addTask({
        title: newTaskTitle,
        priority: newTaskPriority,
        dueDate: timestamp,
        frequency: newTaskFrequency,
        weekDays: newTaskFrequency === 'weekly' ? selectedWeekDays : undefined,
        monthDays: newTaskFrequency === 'monthly' ? selectedMonthDays : undefined,
      })
    }

    // Play success sound immediately
    playClick()

    // Reset form immediately
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

  // Check if selected date is in the past
  const isDateInPast = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDay = today.getDate()
    const todayWeekDay = today.getDay()

    // Check if the user is viewing a future month
    const viewingMonth = selectedDate.getMonth()
    const viewingYear = selectedDate.getFullYear()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const isViewingFutureMonth =
      viewingYear > currentYear || (viewingYear === currentYear && viewingMonth > currentMonth)

    // For weekly frequency, check if all selected weekdays have passed this week
    if (newTaskFrequency === 'weekly' && selectedWeekDays.length > 0) {
      // Check if at least one selected day is today or in the future this week
      const hasValidDay = selectedWeekDays.some((day) => day >= todayWeekDay)
      if (!hasValidDay) return true
      return false
    }

    // For monthly frequency, check if all selected days have passed this month
    if (newTaskFrequency === 'monthly' && selectedMonthDays.length > 0) {
      // If viewing a future month, all days are valid
      if (isViewingFutureMonth) return false
      // Check if at least one selected day is today or in the future this month
      const hasValidDay = selectedMonthDays.some((day) => day >= todayDay)
      if (!hasValidDay) return true
      return false
    }

    // For once/daily, check the date input
    let dateToCheck: Date
    if (newTaskDate && newTaskDate.length === 10) {
      // Parse YYYY-MM-DD format
      const parts = newTaskDate.split('-')
      const year = Number.parseInt(parts[0], 10)
      const month = Number.parseInt(parts[1], 10)
      const day = Number.parseInt(parts[2], 10)
      dateToCheck = new Date(year, month - 1, day)
    } else {
      dateToCheck = new Date(selectedDate)
    }
    dateToCheck.setHours(0, 0, 0, 0)

    return dateToCheck.getTime() < today.getTime()
  }, [newTaskDate, selectedDate, newTaskFrequency, selectedWeekDays, selectedMonthDays])

  // Check if weekly/monthly requires day selection
  const isMissingDaySelection = useMemo(() => {
    if (newTaskFrequency === 'weekly' && selectedWeekDays.length === 0) return true
    if (newTaskFrequency === 'monthly' && selectedMonthDays.length === 0) return true
    return false
  }, [newTaskFrequency, selectedWeekDays, selectedMonthDays])

  // Form is invalid if date is in past OR missing day selection for weekly/monthly
  const isFormInvalid = isDateInPast || isMissingDaySelection

  const handleToggleTask = (
    task: { id: string; dueDate: number; completed: boolean; priority: 'high' | 'medium' | 'low' },
    e?: React.MouseEvent
  ) => {
    if (!task.completed) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)

      if (taskDate.getTime() > today.getTime()) {
        playError()
        setAlertMessage(
          'Calma lá!\n\nVocê não pode concluir uma tarefa agendada para o futuro. Aguarde o dia correto para realizá-la.'
        )
        setAlertTitle('Tarefa Futura')
        setShowAlert(true)
        return
      }

      // Play success sound
      playSuccess()

      // Trigger Reward Animation
      if (e) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const { xp, pts } = getRewardValues(task)
        const id = Math.random().toString(36).substr(2, 9)

        // Add Ripple
        setRipples((prev) => [...prev, { id, x: centerX, y: centerY }])

        // Trigger Fireworks
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x, y },
          colors: ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b'], // Violet, Fuchsia, Emerald, Amber
          ticks: 200,
          gravity: 1.2,
          decay: 0.94,
          startVelocity: 30,
          shapes: ['circle'],
          zIndex: 9999,
          disableForReducedMotion: true,
        })

        // Trigger particles flying to XP bar (single animation)
        triggerAnimation(xp, 'xp', centerX, centerY)
        setTimeout(() => {
          triggerAnimation(pts, 'pts', centerX, centerY)
        }, 200)

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id))
        }, 1000)
      }
    }
    toggleTask(task.id)
  }

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

  const getRewardValues = (task: {
    priority: string
    isFromTherapist?: boolean
    category?: string
  }) => {
    // Sessões com terapeuta dão 40 XP e 40 pontos
    if (task.isFromTherapist && task.category === 'sessao') {
      return { xp: 40, pts: 40 }
    }
    // Tarefas normais baseadas na prioridade
    if (task.priority === 'high') {
      return { xp: 30, pts: 30 }
    }
    if (task.priority === 'medium') {
      return { xp: 10, pts: 10 }
    }
    return { xp: 5, pts: 5 }
  }

  return (
    <>
      <XPAnimationContainer particles={particles} />
      <div className='h-full overflow-y-auto bg-slate-50 px-4 pt-safe py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32 dark:bg-slate-950'>
        {/* Header */}
        <div className='mb-4 flex items-end justify-between sm:mb-6'>
          <div>
            <h2 className='font-bold text-xl text-slate-800 sm:text-2xl dark:text-white'>Rotina</h2>
            <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
              Gerencie suas missões
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <HelpButton screenId='routine' />
            <button
              className='touch-target group rounded-xl bg-sky-600 p-2.5 text-white shadow-lg shadow-sky-200 transition-all active:scale-95 hover:bg-sky-700 sm:rounded-2xl sm:p-3 sm:hover:scale-105 dark:shadow-none'
              onClick={() => {
                setIsAdding(!isAdding)
                // Use today if selectedDate is in the past
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const selected = new Date(selectedDate)
                selected.setHours(0, 0, 0, 0)
                const dateToUse = selected < today ? today : selectedDate
                const yyyy = dateToUse.getFullYear()
                const mm = String(dateToUse.getMonth() + 1).padStart(2, '0')
                const dd = String(dateToUse.getDate()).padStart(2, '0')
                setNewTaskDate(`${yyyy}-${mm}-${dd}`)
              }}
              type='button'
            >
              {isAdding ? (
                <X className='sm:hidden' size={20} />
              ) : (
                <Plus className='sm:hidden' size={20} />
              )}
              {isAdding ? (
                <X className='hidden sm:block' size={24} />
              ) : (
                <Plus className='hidden sm:block' size={24} />
              )}
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className='mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-3'>
          <button
            className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${viewMode === 'day' ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
            onClick={() => setViewMode('day')}
            type='button'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600' />
            <div className='relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2'>
              <CalendarIcon className='h-5 w-5 sm:h-7 sm:w-7' />
              <span className='font-semibold text-[9px] sm:text-xs'>Hoje</span>
            </div>
          </button>
          <button
            className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${viewMode === 'week' ? 'ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
            onClick={() => setViewMode('week')}
            type='button'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600' />
            <div className='relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2'>
              <Repeat className='h-5 w-5 sm:h-7 sm:w-7' />
              <span className='font-semibold text-[9px] sm:text-xs'>Semana</span>
            </div>
          </button>
          <button
            className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${viewMode === 'month' ? 'ring-2 ring-sky-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
            onClick={() => setViewMode('month')}
            type='button'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600' />
            <div className='relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2'>
              <Target className='h-5 w-5 sm:h-7 sm:w-7' />
              <span className='font-semibold text-[9px] sm:text-xs'>Mês</span>
            </div>
          </button>
        </div>

        {/* Date Navigation Card */}
        <div className='mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:mb-6 sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900'>
          <button
            className='touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-sky-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-sky-400'
            onClick={() => changeDate(-1)}
            type='button'
          >
            <ChevronLeft className='sm:hidden' size={18} />
            <ChevronLeft className='hidden sm:block' size={20} />
          </button>
          <div className='flex flex-col items-center'>
            <span className='font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'>
              {viewMode === 'day' ? 'Dia' : viewMode === 'week' ? 'Semana' : 'Mês'}
            </span>
            <div className='flex items-center gap-2 text-center font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
              {formatDisplayDate(selectedDate)}
            </div>
          </div>
          <button
            className='touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-sky-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-sky-400'
            onClick={() => changeDate(1)}
            type='button'
          >
            <ChevronRight className='sm:hidden' size={18} />
            <ChevronRight className='hidden sm:block' size={20} />
          </button>
        </div>

        {/* Progress Card - Only visible if < 100% and has tasks */}
        {showProgressBar && (
          <div className='fade-in slide-in-from-top-4 relative mb-6 animate-in overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-lg shadow-sky-200 sm:mb-8 sm:rounded-3xl sm:p-5 dark:shadow-none'>
            <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32' />

            <div className='relative z-10 mb-2 flex items-end justify-between'>
              <div>
                <p className='mb-1 font-bold text-sky-100 text-[10px] uppercase tracking-wider sm:text-xs'>
                  {viewMode === 'day'
                    ? 'Progresso do Dia'
                    : viewMode === 'week'
                      ? 'Progresso da Semana'
                      : 'Progresso do Mês'}
                </p>
                <h3 className='font-bold text-xl sm:text-2xl'>{dayProgress}% Concluído</h3>
              </div>
              <div className='rounded-lg bg-white/20 p-1.5 backdrop-blur-sm sm:rounded-xl sm:p-2'>
                <Target className='text-white' size={20} />
              </div>
            </div>

            <div className='relative z-10 h-1.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm sm:h-2'>
              <div
                className='h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out'
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>
        )}

      {/* Add Task Modal */}
      {isAdding && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          {/* Backdrop */}
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setIsAdding(false)}
          />
          {/* Modal Content */}
          <div className='zoom-in-95 fade-in relative max-h-[85vh] w-full max-w-md animate-in overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-200 sm:rounded-3xl sm:p-6 dark:border-slate-700 dark:bg-slate-800'>
            <div className='absolute top-0 left-0 h-1 w-full rounded-t-2xl bg-gradient-to-r from-sky-500 to-cyan-400 sm:rounded-t-3xl' />

              <h3 className='mb-3 flex items-center gap-2 font-bold text-base text-slate-800 sm:mb-4 sm:text-lg dark:text-white'>
                <Plus className='text-sky-500' size={16} />
                Nova Missão
              </h3>

              <form onSubmit={handleAddTask}>
                <input
                  autoFocus
                  className='mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:mb-4 sm:rounded-xl sm:p-4 sm:text-base dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30'
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
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                      min={(() => {
                        const today = new Date()
                        const yyyy = today.getFullYear()
                        const mm = String(today.getMonth() + 1).padStart(2, '0')
                        const dd = String(today.getDate()).padStart(2, '0')
                        return `${yyyy}-${mm}-${dd}`
                      })()}
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
                            ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
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
                                  ? 'bg-sky-500 text-white'
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
                                  ? 'bg-sky-500 text-white'
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
                    className={`flex-[2] rounded-xl py-3 font-bold text-sm shadow-lg transition-opacity ${
                      isFormInvalid
                        ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
                        : 'bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900'
                    }`}
                    disabled={isFormInvalid}
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
        <div className='space-y-2 sm:space-y-3'>
          {displayTasks.length === 0 && (
            <div className='mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-6 text-center sm:mt-12 sm:rounded-3xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/50'>
              <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-16 sm:w-16 dark:bg-slate-800 dark:text-slate-600'>
                <Trophy className='sm:hidden' size={28} />
                <Trophy className='hidden sm:block' size={32} />
              </div>
              <h4 className='mb-1 font-bold text-sm text-slate-700 sm:text-base dark:text-slate-300'>
                Nenhuma missão encontrada
              </h4>
              <p className='max-w-[200px] text-slate-400 text-[11px] sm:text-xs dark:text-slate-500'>
                {viewMode === 'day' ? 'Seu dia está livre!' : 'Nenhuma tarefa neste período.'}{' '}
                Aproveite para adicionar novos objetivos.
              </p>
            </div>
          )}

          {displayTasks.map((task, index) => {
            const styles = getPriorityStyles(task.priority)
            const { xp, pts } = getRewardValues(task)

            // Format date for card if not in day view
            const taskDate = new Date(task.dueDate)
            const displayDate =
              viewMode !== 'day' ? `${taskDate.getDate()}/${taskDate.getMonth() + 1}` : null

            return (
              <div
                className={`group slide-in-from-bottom-2 relative flex animate-in items-center justify-between rounded-xl border-t border-r border-b border-l-4 bg-white fill-mode-backwards p-3 transition-all duration-300 sm:rounded-2xl sm:border-l-[6px] sm:p-4 dark:bg-slate-800 ${
                  task.completed
                    ? 'border-slate-200 border-l-slate-300 opacity-60 grayscale-[0.5] dark:border-slate-700 dark:border-l-slate-600'
                    : `${styles.border} border-slate-100 shadow-sm sm:hover:translate-x-1 sm:hover:shadow-md dark:border-slate-700`
                }
                `}
                key={task.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className='flex min-w-0 flex-1 items-center gap-3 sm:gap-4'>
                  <button
                    className={`touch-target flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-8 sm:w-8 ${
                      task.completed
                        ? 'scale-110 border-sky-500 bg-sky-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:hover:bg-sky-900/20'
                    }
                    `}
                    onClick={(e) => handleToggleTask(task, e)}
                    type='button'
                  >
                    {task.completed && (
                      <Check
                        className='animate-in zoom-in duration-300 stroke-[3] text-white'
                        size={14}
                      />
                    )}
                  </button>

                  <div className='flex min-w-0 flex-1 flex-col'>
                    <div className='flex flex-wrap items-center gap-1 sm:gap-2'>
                      <span
                        className={`truncate font-bold text-sm transition-all sm:text-base ${task.completed ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}
                      >
                        {task.title}
                      </span>
                      {displayDate && (
                        <span className='shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400'>
                          {displayDate}
                        </span>
                      )}
                      {task.originalDueDate && !task.completed && (
                        <span
                          className='flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 font-bold text-[10px] text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          title={`Originalmente agendada para ${new Date(task.originalDueDate).toLocaleDateString('pt-BR')}`}
                        >
                          <Clock size={10} />
                          Transferida
                        </span>
                      )}
                      {task.frequency && task.frequency !== 'once' && (
                        <span className='flex shrink-0 items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 font-bold text-[10px] text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
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

                <div className='flex shrink-0 items-center gap-1 pl-2'>
                  {!task.completed && (
                    <div className='flex flex-col items-end gap-1'>
                      <span className='rounded-lg bg-sky-50 px-2 py-0.5 font-black text-[10px] text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'>
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
                    className={`rounded-lg p-2 transition-all sm:focus:opacity-100 sm:group-hover:opacity-100 ${
                      task.completed
                        ? 'cursor-not-allowed text-slate-300 hover:bg-slate-100 hover:text-slate-400 sm:opacity-0 dark:hover:bg-slate-800'
                        : 'text-slate-400 hover:bg-red-50 hover:text-red-500 sm:opacity-0 dark:text-slate-500 dark:hover:bg-red-900/20'
                    }`}
                    onClick={() => {
                      if (task.completed) {
                        playError()
                        setAlertTitle('Ação Bloqueada')
                        setAlertMessage(
                          'Você não pode excluir uma tarefa concluída.\nDesmarque-a primeiro se precisar excluí-la.'
                        )
                        setShowAlert(true)
                        return
                      }
                      playDelete()
                      deleteTask(task.id)
                    }}
                    type='button'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Alert Modal */}
        {showAlert && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
            <div className='zoom-in-95 fade-in animate-in w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
              <div className='bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white'>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                  <Flag className='text-white' size={24} />
                </div>
                <h3 className='font-bold text-xl'>{alertTitle}</h3>
              </div>

              <div className='p-6'>
                <p className='whitespace-pre-line text-slate-700 dark:text-slate-300'>
                  {alertMessage}
                </p>
              </div>

              <div className='border-slate-100 border-t p-4 dark:border-slate-700'>
                <button
                  className='w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900'
                  onClick={() => setShowAlert(false)}
                  type='button'
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Tasks Alert Modal */}
        {showOverdueAlert && urgentOverdueTasks.length > 0 && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
            <div className='zoom-in-95 fade-in animate-in w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl dark:border-amber-700 dark:bg-slate-800'>
              <div className='bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white'>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                  <AlertTriangle className='text-white' size={24} />
                </div>
                <h3 className='font-bold text-xl'>Tarefas Pendentes!</h3>
                <p className='mt-1 text-white/80 text-sm'>
                  Você tem {urgentOverdueTasks.length} tarefa
                  {urgentOverdueTasks.length > 1 ? 's' : ''} aguardando há mais de 2 dias
                </p>
              </div>

              <div className='max-h-64 overflow-y-auto p-4'>
                {urgentOverdueTasks.map((task) => (
                  <div
                    className='mb-3 rounded-xl border border-amber-100 bg-amber-50 p-3 last:mb-0 dark:border-amber-900/30 dark:bg-amber-900/20'
                    key={task.id}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 dark:text-slate-200'>
                          {task.title}
                        </p>
                        <div className='mt-1 flex items-center gap-2 text-xs'>
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : task.priority === 'medium'
                                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}
                          >
                            {task.priority === 'high'
                              ? 'Urgente'
                              : task.priority === 'medium'
                                ? 'Normal'
                                : 'Baixa'}
                          </span>
                          <span className='flex items-center gap-1 text-amber-600 dark:text-amber-400'>
                            <Clock size={12} />
                            {task.daysOverdue} dias de atraso
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='border-amber-100 border-t p-4 dark:border-amber-900/30'>
                <p className='mb-3 text-center text-slate-500 text-xs dark:text-slate-400'>
                  Complete essas tarefas hoje para manter sua rotina em dia! 💪
                </p>
                <button
                  className='w-full rounded-xl bg-amber-500 py-3 font-bold text-white transition-opacity hover:bg-amber-600 hover:opacity-90'
                  onClick={() => {
                    setShowOverdueAlert(false)
                    // Dismiss all urgent tasks after viewing
                    for (const t of urgentOverdueTasks) {
                      dismissUrgentTask(t.id)
                    }
                  }}
                  type='button'
                >
                  Vou completar agora!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Styles for Animations */}
        <style>{`
        @keyframes float-up-left {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(-15px, -25px) scale(1.2); opacity: 1; }
          100% { transform: translate(-30px, -80px) scale(1); opacity: 0; }
        }
        @keyframes float-up-right {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          20% { transform: translate(15px, -25px) scale(1.2); opacity: 1; }
          100% { transform: translate(30px, -80px) scale(1); opacity: 0; }
        }
      `}</style>

        {/* Ripples */}
        {ripples.map((r) => (
          <div
            className='pointer-events-none fixed z-40 h-12 w-12 animate-ping rounded-full border-2 border-sky-500 opacity-75'
            key={r.id}
            style={{
              left: r.x - 24,
              top: r.y - 24,
              animationDuration: '0.8s',
            }}
          />
        ))}

      </div>
    </>
  )
}

