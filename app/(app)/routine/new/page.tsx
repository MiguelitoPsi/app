// app/app/(app)/routine/new/page.tsx
'use client'

import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiFlagLine,
  RiLoopLeftLine,
  RiNotification2Line,
  RiTimeLine,
} from '@remixicon/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSound } from '@/hooks/useSound'
import { useGame } from '../../../../context/GameContext'

const PRIMARY = '#a1c797'
const PRIMARY_DARK = '#8FA889'

const ENTER_TRANSITION = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 280,
  mass: 0.9,
}

const EXIT_TRANSITION_FAST = { duration: 0.28, ease: [0.4, 0, 1, 1] as const }

export default function NewTaskPage() {
  const router = useRouter()
  const { tasks, addTask } = useGame()
  const { playClick, playError } = useSound()

  const [isExiting, setIsExiting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [taskDate, setTaskDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly'>('once')
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([])
  const [weeklyDuration, setWeeklyDuration] = useState<string>('1w')
  const [dailyDuration, setDailyDuration] = useState<string>('1w')

  // Time fields — pre-enabled via switch
  const [timeEnabled, setTimeEnabled] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  // Reminder
  const [reminderEnabled, setReminderEnabled] = useState(true)

  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertTitle, setAlertTitle] = useState('Atenção')

  // Format date for display
  const displayDate = useMemo(() => {
    if (!taskDate) return ''
    const str = format(taskDate, "EEEE, d 'de' MMMM", { locale: ptBR })
    return str.charAt(0).toUpperCase() + str.slice(1)
  }, [taskDate])

  // Check if date is in the past
  const isDateInPast = useMemo(() => {
    if (frequency === 'daily') return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const _todayWeekDay = today.getDay()

    if (frequency === 'weekly') return false

    if (!taskDate) return false

    const dateToCheck = new Date(taskDate)
    dateToCheck.setHours(0, 0, 0, 0)
    return dateToCheck.getTime() < today.getTime()
  }, [taskDate, frequency])

  const isMissingDaySelection = useMemo(() => {
    if (frequency === 'weekly' && selectedWeekDays.length === 0) return true
    return false
  }, [frequency, selectedWeekDays])

  const isFormInvalid = !title.trim() || isDateInPast || isMissingDaySelection

  const handleBack = useCallback(() => {
    setIsExiting(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormInvalid) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // For frequencies with date picker, validate date is not in the past
    if (frequency === 'once') {
      const selectedTaskDate = new Date(taskDate)
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
    }

    const baseDate = frequency === 'daily' || frequency === 'weekly' ? today : new Date(taskDate)
    const datesToCreate: number[] = []

    if (frequency === 'once') {
      datesToCreate.push(taskDate.getTime())
    } else if (frequency === 'daily') {
      const endDate = new Date(today)
      const dailyDurationMap: Record<string, () => void> = {
        '1w': () => endDate.setDate(endDate.getDate() + 7),
        '2w': () => endDate.setDate(endDate.getDate() + 14),
        '3w': () => endDate.setDate(endDate.getDate() + 21),
        '4w': () => endDate.setDate(endDate.getDate() + 28),
        '1m': () => endDate.setMonth(endDate.getMonth() + 1),
        '2m': () => endDate.setMonth(endDate.getMonth() + 2),
        '3m': () => endDate.setMonth(endDate.getMonth() + 3),
      }
      ;(dailyDurationMap[dailyDuration] ?? dailyDurationMap['1w'])()
      for (let i = 0; ; i++) {
        const date = new Date(baseDate)
        date.setDate(baseDate.getDate() + i)
        if (date >= endDate) break
        datesToCreate.push(date.getTime())
      }
    } else if (frequency === 'weekly') {
      if (selectedWeekDays.length === 0) return
      const endDate = new Date(today)
      const durationMap: Record<string, () => void> = {
        '1w': () => endDate.setDate(endDate.getDate() + 7),
        '2w': () => endDate.setDate(endDate.getDate() + 14),
        '3w': () => endDate.setDate(endDate.getDate() + 21),
        '4w': () => endDate.setDate(endDate.getDate() + 28),
        '1m': () => endDate.setMonth(endDate.getMonth() + 1),
        '2m': () => endDate.setMonth(endDate.getMonth() + 2),
        '3m': () => endDate.setMonth(endDate.getMonth() + 3),
      }
      ;(durationMap[weeklyDuration] ?? durationMap['4w'])()
      for (let week = 0; ; week++) {
        let addedAny = false
        for (const dayOfWeek of selectedWeekDays) {
          const date = new Date(baseDate)
          const currentDay = date.getDay()
          const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
          date.setDate(date.getDate() + daysUntilTarget + week * 7)
          if (date < endDate) {
            datesToCreate.push(date.getTime())
            addedAny = true
          }
        }
        if (!addedAny) break
      }
    }

    // Validate limits for the first date
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

      if (priority === 'high') {
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

      if (priority === 'medium') {
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

    // Create tasks
    for (const timestamp of datesToCreate) {
      addTask({
        title,
        priority,
        dueDate: timestamp,
        frequency,
        weekDays: frequency === 'weekly' ? selectedWeekDays : undefined,
        startTime: timeEnabled ? startTime : undefined,
        endTime: timeEnabled ? endTime : undefined,
        metadata: reminderEnabled ? { reminder: true } : undefined,
      })
    }

    playClick()
    setIsExiting(true)
  }

  const frequencyLabels: Record<string, string> = {
    once: 'Uma vez',
    daily: 'Diário',
    weekly: 'Semanal',
  }

  const priorityConfig = {
    low: {
      label: 'Baixa',
      color: 'rgb(59, 130, 246)',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-500',
    },
    medium: {
      label: 'Média',
      color: 'rgb(249, 115, 22)',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      text: 'text-orange-500',
    },
    high: {
      label: 'Alta',
      color: 'rgb(239, 68, 68)',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-500',
    },
  }

  return (
    <div
      className='fixed inset-0 z-40 flex flex-col mx-auto overflow-hidden max-w-md'
      style={{ backgroundColor: PRIMARY }}
    >
      {/* Header */}
      <motion.div
        animate={isExiting ? { y: '-100%' } : { y: 0 }}
        className='flex items-center h-[10vh] px-5 pt-safe'
        initial={{ y: '-100%' }}
        transition={isExiting ? EXIT_TRANSITION_FAST : ENTER_TRANSITION}
      >
        <div className='flex w-full items-center'>
          <button
            className='flex h-9 w-9 items-center justify-center transition-all active:scale-95'
            onClick={handleBack}
            type='button'
          >
            <RiArrowLeftLine className='text-white' size={20} />
          </button>
          <h1 className='flex-1 text-center font-bold text-lg text-white pr-9'>
            Criar nova tarefa
          </h1>
        </div>
      </motion.div>

      {/* White Card — full width, curved top, scrollable */}
      <motion.div
        animate={isExiting ? { y: '100%' } : { y: 0 }}
        className='flex-1 overflow-y-auto h-[90vh] rounded-t-[2rem] bg-white dark:bg-slate-800'
        initial={{ y: '100%' }}
        onAnimationComplete={() => {
          if (isExiting) router.push('/routine')
        }}
        transition={isExiting ? { duration: 0.5, ease: [0.4, 0, 1, 1] } : ENTER_TRANSITION}
      >
        <form className='p-5 pt-7 pb-10' onSubmit={handleSubmit}>
          {/* Nome */}
          <div className='mb-5'>
            <label className='mb-1.5 block text-xs font-medium text-slate-400 dark:text-slate-500'>
              Nome
            </label>
            <input
              autoFocus
              className='w-full border-b-2 border-slate-200 focus-visible:outline-none outline-none bg-transparent pb-2.5 text-base font-medium text-slate-800  transition-colors placeholder:text-slate-300 focus:border-[#a1c797] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-[#a1c797]'
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nome da tarefa'
              type='text'
              value={title}
            />
          </div>
          <div className='mb-5'>
            <div className='mb-3 flex items-center gap-2'>
              <RiLoopLeftLine size={14} style={{ color: PRIMARY }} />
              <span className='text-xs font-medium text-slate-400 dark:text-slate-500'>
                Frequência
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['once', 'daily', 'weekly'] as const).map((freq) => (
                <button
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    frequency === freq
                      ? 'text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  style={frequency === freq ? { backgroundColor: PRIMARY } : undefined}
                  type='button'
                >
                  {frequencyLabels[freq]}
                </button>
              ))}
            </div>

            {/* Daily Duration Selector */}
            {frequency === 'daily' && (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className='mt-3'
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className='flex items-center gap-3'>
                  <span className='shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Por
                  </span>
                  <Select defaultValue='1w' onValueChange={setDailyDuration} value={dailyDuration}>
                    <SelectTrigger className='h-8 flex-1 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1w'>1 semana</SelectItem>
                      <SelectItem value='2w'>2 semanas</SelectItem>
                      <SelectItem value='3w'>3 semanas</SelectItem>
                      <SelectItem value='4w'>4 semanas</SelectItem>
                      <SelectItem value='1m'>1 mês</SelectItem>
                      <SelectItem value='2m'>2 meses</SelectItem>
                      <SelectItem value='3m'>3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Weekly Day Selector */}
            {frequency === 'weekly' && (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className='mt-3 space-y-2'
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  Selecione os dias da semana:
                </p>
                <div className='grid grid-cols-7 gap-1'>
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                    const isSelected = selectedWeekDays.includes(index)
                    return (
                      <button
                        className={`aspect-square rounded-lg font-bold text-xs transition-all ${
                          isSelected
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600'
                        }`}
                        key={index}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedWeekDays(selectedWeekDays.filter((d) => d !== index))
                          } else {
                            setSelectedWeekDays([...selectedWeekDays, index])
                          }
                        }}
                        style={isSelected ? { backgroundColor: PRIMARY } : undefined}
                        type='button'
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                <div className='flex items-center gap-3 pt-1'>
                  <span className='shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Por
                  </span>
                  <Select
                    defaultValue='1w'
                    onValueChange={setWeeklyDuration}
                    value={weeklyDuration}
                  >
                    <SelectTrigger className='h-8 flex-1 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1w'>1 semana</SelectItem>
                      <SelectItem value='2w'>2 semanas</SelectItem>
                      <SelectItem value='3w'>3 semanas</SelectItem>
                      <SelectItem value='1m'>1 mês</SelectItem>
                      <SelectItem value='2m'>2 meses</SelectItem>
                      <SelectItem value='3m'>3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </div>
          {/* Data — shadcn Calendar + Popover */}
          {frequency === 'once' && (
            <div className='mb-5'>
              <label className='mb-1.5 block text-xs font-medium text-slate-400 dark:text-slate-500'>
                Data
              </label>
              <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className='flex w-full items-center justify-between border-b-2 border-slate-200 pb-2.5 dark:border-slate-700 transition-colors focus:outline-none focus:border-[#a1c797]'
                    type='button'
                  >
                    <span className='text-base font-medium text-slate-800 dark:text-white'>
                      {displayDate}
                    </span>
                    <RiCalendarLine size={16} style={{ color: PRIMARY }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-auto p-0' sideOffset={8}>
                  <Calendar
                    disabled={{
                      before: new Date(new Date().setHours(0, 0, 0, 0)),
                    }}
                    initialFocus
                    mode='single'
                    onSelect={(date) => {
                      if (date) {
                        setTaskDate(date)
                        setCalendarOpen(false)
                      }
                    }}
                    selected={taskDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Hora início / Hora fim — com switch */}
          <div className='mb-5'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <RiTimeLine size={14} style={{ color: PRIMARY }} />
                <span className='text-xs font-medium text-slate-400 dark:text-slate-500'>
                  Horário
                </span>
              </div>
              <button
                aria-checked={timeEnabled}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                  timeEnabled ? '' : 'bg-slate-200 dark:bg-slate-700'
                }`}
                onClick={() => setTimeEnabled(!timeEnabled)}
                role='switch'
                style={timeEnabled ? { backgroundColor: PRIMARY } : undefined}
                type='button'
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    timeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {timeEnabled && (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className='grid grid-cols-2 gap-4'
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <label className='mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500'>
                    Hora início
                  </label>
                  {/* type="time" activa o picker nativo em iOS e Android */}
                  <input
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#a1c797] dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    inputMode='none'
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ WebkitAppearance: 'none' }}
                    type='time'
                    value={startTime}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500'>
                    Hora fim
                  </label>
                  <input
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-[#a1c797] dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    inputMode='none'
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ WebkitAppearance: 'none' }}
                    type='time'
                    value={endTime}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Repetir */}

          {/* Prioridade */}
          <div className='mb-5'>
            <div className='mb-3 flex items-center gap-2'>
              <RiFlagLine size={14} style={{ color: PRIMARY }} />
              <span className='text-xs font-medium text-slate-400 dark:text-slate-500'>
                Prioridade
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['low', 'medium', 'high'] as const).map((p) => {
                const config = priorityConfig[p]
                const isActive = priority === p
                return (
                  <button
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border-2 ${
                      isActive
                        ? `${config.bg} ${config.border} ${config.text}`
                        : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                    key={p}
                    onClick={() => setPriority(p)}
                    type='button'
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lembrar-me */}
          <div className='mb-5 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <RiNotification2Line size={14} style={{ color: PRIMARY }} />
              <span className='text-xs font-medium text-slate-400 dark:text-slate-500'>
                Lembrar-me
              </span>
            </div>
            <button
              aria-checked={reminderEnabled}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                reminderEnabled ? '' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              onClick={() => setReminderEnabled(!reminderEnabled)}
              role='switch'
              style={reminderEnabled ? { backgroundColor: PRIMARY } : undefined}
              type='button'
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {/* Submit Button */}
          <button
            className={`w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all active:scale-[0.98] ${
              isFormInvalid
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400'
                : 'text-white hover:opacity-90'
            }`}
            disabled={isFormInvalid}
            style={
              isFormInvalid
                ? undefined
                : {
                    backgroundColor: PRIMARY,
                    boxShadow: `0 8px 24px ${PRIMARY}40`,
                  }
            }
            type='submit'
          >
            Criar Tarefa
          </button>
        </form>

        {/* Alert Modal */}
        {showAlert && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className='w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'
              initial={{ scale: 0.9, opacity: 0 }}
            >
              <div
                className='p-6 text-white'
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
                }}
              >
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
                  <RiFlagLine className='text-white' size={24} />
                </div>
                <h3 className='font-bold text-xl'>{alertTitle}</h3>
              </div>

              <div className='p-6'>
                <p className='whitespace-pre-line text-slate-700 dark:text-slate-300'>
                  {alertMessage}
                </p>
              </div>

              <div className='border-t border-slate-100 p-4 dark:border-slate-700'>
                <button
                  className='w-full rounded-xl py-3 font-bold text-sm text-white transition-opacity hover:opacity-90'
                  onClick={() => setShowAlert(false)}
                  style={{ backgroundColor: PRIMARY }}
                  type='button'
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
