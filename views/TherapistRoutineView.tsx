'use client'

import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  MessageSquare,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '../lib/trpc/client'
import Calendar from '../components/therapist/Calendar'
import AgendaSidebar from '../components/therapist/AgendaSidebar'

type TaskFormData = {
  title: string
  frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  type?: 'feedback' | 'session' | 'review_records' | 'create_plan' | 'approve_reward' | 'custom'
  taskCategory?: 'geral' | 'sessao'
  sessionPatientId?: string
  weekDays?: number[]
  monthDay?: number
  monthDays?: number[]
  sessionValue?: number
}

const defaultTaskForm: TaskFormData = {
  title: '',
  frequency: 'weekly',
  priority: 'medium',
  type: 'custom',
  taskCategory: undefined,
  sessionPatientId: undefined,
}

export default function TherapistRoutineView() {
  const searchParams = useSearchParams()
  const patientIdFromUrl = searchParams.get('patientId')

  const [mainView, setMainView] = useState<'my-routine' | 'patients'>(
    patientIdFromUrl ? 'patients' : 'my-routine'
  )
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    patientIdFromUrl || null
  )
  const [showPatientList, setShowPatientList] = useState(!!patientIdFromUrl)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm)
  const [feedbackText, setFeedbackText] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending')
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertTitle, setAlertTitle] = useState('Atenção')

  const { data: patients } = trpc.patient.getAll.useQuery()
  const { data: patientTasks, refetch: refetchTasks } =
    trpc.task.getPatientTasksFromTherapist.useQuery(
      { patientId: selectedPatientId || '' },
      { enabled: !!selectedPatientId && mainView === 'patients' }
    )
  const { data: aiSuggestions } = trpc.task.getAISuggestedTasks.useQuery(
    { patientId: selectedPatientId || '' },
    { enabled: !!selectedPatientId && mainView === 'patients' }
  )

  const { data: myTasks, refetch: refetchMyTasks } = trpc.therapistTasks.getAll.useQuery(
    undefined,
    { enabled: mainView === 'my-routine' }
  )

  const filteredPatients = useMemo(() => {
    if (!patients) return []
    if (!patientSearchQuery.trim()) return patients
    const query = patientSearchQuery.toLowerCase()
    return patients.filter(
      (p) => p.name?.toLowerCase().includes(query) || p.email?.toLowerCase().includes(query)
    )
  }, [patients, patientSearchQuery])

  // Auto-select patient from URL when patients are loaded
  useEffect(() => {
    if (patientIdFromUrl && patients) {
      const patientExists = patients.some((p) => p.id === patientIdFromUrl)
      if (patientExists) {
        setSelectedPatientId(patientIdFromUrl)
        setMainView('patients')
        setShowPatientList(true)
      }
    }
  }, [patientIdFromUrl, patients])

  const selectedSessionPatient = useMemo(() => {
    if (!taskForm.sessionPatientId) return null
    if (!patients) return null
    return patients.find((p) => p.id === taskForm.sessionPatientId)
  }, [patients, taskForm.sessionPatientId])

  const utils = trpc.useUtils()

  // Mutations
  const createTaskMutation = trpc.task.createForPatient.useMutation({
    onMutate: async (newOne) => {
      await utils.task.getPatientTasksFromTherapist.cancel({ patientId: selectedPatientId || '' })
      const previousTasks = utils.task.getPatientTasksFromTherapist.getData({
        patientId: selectedPatientId || '',
      })

      if (selectedPatientId) {
        utils.task.getPatientTasksFromTherapist.setData({ patientId: selectedPatientId }, (old) => {
          if (!old) return []
          const tempId = Math.random().toString()
          const optimisticTask: any = {
            id: tempId,
            patientId: selectedPatientId,
            therapistId: 'me',
            title: newOne.title,
            description: newOne.description,
            priority: newOne.priority,
            dueDate: newOne.dueDate ? new Date(newOne.dueDate) : null,
            status: 'pending',
            category: 'geral',
            frequency: newOne.frequency,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          return [...old, optimisticTask]
        })
      }
      return { previousTasks }
    },
    onSuccess: () => {
      setShowTaskForm(false)
      setTaskForm(defaultTaskForm)
      utils.therapistXp.getStats.invalidate()
    },
    onError: (error, newOne, context) => {
      if (context?.previousTasks) {
        utils.task.getPatientTasksFromTherapist.setData(
          { patientId: selectedPatientId || '' },
          context.previousTasks
        )
      }
      if (error.message.includes('Limite')) {
        setAlertTitle('Limite de Tarefas')
      } else {
        setAlertTitle('Atenção')
      }
      setAlertMessage(error.message)
      setShowAlert(true)
    },
    onSettled: () => {
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId: selectedPatientId || '' })
    },
  })

  const deleteTaskMutation = trpc.task.deletePatientTask.useMutation({
    onMutate: async (vars) => {
      await utils.task.getPatientTasksFromTherapist.cancel({ patientId: selectedPatientId || '' })
      const previousTasks = utils.task.getPatientTasksFromTherapist.getData({
        patientId: selectedPatientId || '',
      })

      if (selectedPatientId) {
        utils.task.getPatientTasksFromTherapist.setData({ patientId: selectedPatientId }, (old) =>
          old ? old.filter((t) => t.id !== vars.taskId) : []
        )
      }
      return { previousTasks }
    },
    onError: (err, vars, context) => {
      if (context?.previousTasks) {
        utils.task.getPatientTasksFromTherapist.setData(
          { patientId: selectedPatientId || '' },
          context.previousTasks
        )
      }
      setAlertTitle('Erro ao excluir')
      setAlertMessage(err.message)
      setShowAlert(true)
    },
    onSettled: () => {
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId: selectedPatientId || '' })
    },
  })

  const sendFeedbackMutation = trpc.task.sendTaskFeedback.useMutation({
    onSuccess: () => {
      setShowFeedbackForm(null)
      setFeedbackText('')
      refetchTasks()
      utils.therapistXp.getStats.invalidate()
    },
  })

  const createMyTaskMutation = trpc.therapistTasks.create.useMutation({
    onMutate: async (newOne) => {
      await utils.therapistTasks.getAll.cancel()
      const previousMyTasks = utils.therapistTasks.getAll.getData()

      utils.therapistTasks.getAll.setData(undefined, (old) => {
        if (!old) return []
        const tempId = Math.random().toString()
        const optimisticTask: any = {
          id: tempId,
          therapistId: 'me',
          title: newOne.title,
          description: newOne.description,
          type: newOne.type,
          priority: newOne.priority,
          status: 'pending',
          dueDate: newOne.dueDate ? new Date(newOne.dueDate) : null,
          isRecurring: newOne.isRecurring,
          frequency: newOne.frequency,
          xpReward: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        return [...old, optimisticTask]
      })

      return { previousMyTasks }
    },
    onSuccess: () => {
      setShowTaskForm(false)
      setTaskForm(defaultTaskForm)
      setPatientSearchQuery('')
      setShowPatientDropdown(false)
      if (taskForm.taskCategory === 'sessao') {
        utils.task.getPatientTasksFromTherapist.invalidate()
      }
      utils.therapistXp.getStats.invalidate()
    },
    onError: (error, newOne, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks)
      }
      if (error.message.includes('Limite')) {
        setAlertTitle('Limite de Tarefas')
      } else {
        setAlertTitle('Atenção')
      }
      setAlertMessage(error.message)
      setShowAlert(true)
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate()
    },
  })

  const completeMyTaskMutation = trpc.therapistTasks.complete.useMutation({
    onMutate: async (vars) => {
      await utils.therapistTasks.getAll.cancel()
      const previousMyTasks = utils.therapistTasks.getAll.getData()

      utils.therapistTasks.getAll.setData(undefined, (old) => {
        if (!old) return []
        return old.map((t) => {
          if (t.id === vars.id) {
            const newStatus = t.status === 'completed' ? 'pending' : 'completed'
            return { ...t, status: newStatus }
          }
          return t
        })
      })
      return { previousMyTasks }
    },
    onSuccess: () => {
      utils.therapistXp.getStats.invalidate()
    },
    onError: (err, vars, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks)
      }
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate()
    },
  })

  const deleteMyTaskMutation = trpc.therapistTasks.delete.useMutation({
    onMutate: async (vars) => {
      await utils.therapistTasks.getAll.cancel()
      const previousMyTasks = utils.therapistTasks.getAll.getData()

      utils.therapistTasks.getAll.setData(undefined, (old) =>
        old ? old.filter((t) => t.id !== vars.id) : []
      )
      return { previousMyTasks }
    },
    onSuccess: () => {},
    onError: (err, vars, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks)
      }
      setAlertTitle('Erro ao excluir')
      setAlertMessage(err.message)
      setShowAlert(true)
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate()
    },
  })

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId)

  const formatDisplayDate = (date: Date) => {
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

    const dateString = date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    })
    return dateString.charAt(0).toUpperCase() + dateString.slice(1)
  }

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  const displayTasks = useMemo(() => {
    if (!patientTasks) return []
    return patientTasks.filter((task) => {
      if (activeTab === 'pending' && task.status !== 'pending' && task.status !== 'accepted')
        return false
      if (activeTab === 'completed' && task.status !== 'completed') return false

      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const taskDay = new Date(taskDate)
        taskDay.setHours(0, 0, 0, 0)
        const selectedDay = new Date(selectedDate)
        selectedDay.setHours(0, 0, 0, 0)
        return taskDay.getTime() === selectedDay.getTime()
      }
      return false
    })
  }, [patientTasks, selectedDate, activeTab])

  const displayMyTasks = useMemo(() => {
    if (!myTasks) return []
    return myTasks.filter((task) => {
      if (activeTab === 'pending' && task.status !== 'pending' && task.status !== 'in_progress')
        return false
      if (activeTab === 'completed' && task.status !== 'completed') return false

      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const taskDay = new Date(taskDate)
        taskDay.setHours(0, 0, 0, 0)
        const selectedDay = new Date(selectedDate)
        selectedDay.setHours(0, 0, 0, 0)
        return taskDay.getTime() === selectedDay.getTime()
      }

      return task.isRecurring || !task.dueDate
    })
  }, [myTasks, selectedDate, activeTab])

  const dayProgress = useMemo(() => {
    const tasks = mainView === 'patients' ? patientTasks : myTasks
    if (!tasks || tasks.length === 0) return 0
    const completedCount = tasks.filter((t) => t.status === 'completed').length
    return Math.round((completedCount / tasks.length) * 100)
  }, [patientTasks, myTasks, mainView])

  const showProgressBar =
    mainView === 'patients'
      ? patientTasks && patientTasks.length > 0 && dayProgress < 100
      : displayMyTasks && displayMyTasks.length > 0 && dayProgress < 100

  const handleCreateTask = () => {
    if (taskForm.dueDate && taskForm.taskCategory !== 'sessao') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [year, month, day] = taskForm.dueDate.split('-').map(Number)
      const selectedTaskDate = new Date(year, month - 1, day)
      selectedTaskDate.setHours(0, 0, 0, 0)

      if (selectedTaskDate < today) {
        const dateStr = selectedTaskDate.toLocaleDateString('pt-BR')
        setAlertMessage(
          `Data inválida!\n\nNão é possível criar tarefas para datas que já passaram.\n\nData selecionada: ${dateStr}`
        )
        setAlertTitle('Data no Passado')
        setShowAlert(true)
        return
      }
    }

    if (
      taskForm.taskCategory === 'sessao' &&
      (taskForm.frequency === 'weekly' || taskForm.frequency === 'biweekly') &&
      !taskForm.weekDays?.length
    ) {
      setAlertMessage('Por favor, selecione o dia da semana para a sessão.')
      setAlertTitle('Dia da Semana')
      setShowAlert(true)
      return
    }

    if (taskForm.taskCategory === 'sessao' && taskForm.frequency === 'once' && !taskForm.dueDate) {
      setAlertMessage('Por favor, selecione a data para a sessão.')
      setAlertTitle('Data da Sessão')
      setShowAlert(true)
      return
    }

    if (mainView === 'patients') {
      if (!selectedPatientId) return
      if (!taskForm.title) return

      const patientFrequency =
        taskForm.frequency === 'biweekly' || taskForm.frequency === 'monthly'
          ? 'weekly'
          : (taskForm.frequency as 'once' | 'daily' | 'weekly')

      createTaskMutation.mutate({
        patientId: selectedPatientId,
        title: taskForm.title,
        frequency: patientFrequency,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
      })
    } else {
      if (!taskForm.taskCategory) return

      if (taskForm.taskCategory === 'sessao' && !taskForm.sessionPatientId) return

      if (taskForm.taskCategory === 'geral' && !taskForm.title) return

      const sessionTitle =
        taskForm.taskCategory === 'sessao' && selectedSessionPatient
          ? `Sessão - ${selectedSessionPatient.name}`
          : taskForm.title

      createMyTaskMutation.mutate({
        title: sessionTitle,
        type: taskForm.taskCategory === 'sessao' ? 'session' : taskForm.type || 'custom',
        priority: taskForm.taskCategory === 'sessao' ? 'high' : taskForm.priority,
        dueDate: taskForm.dueDate,
        isRecurring: taskForm.frequency !== 'once',
        frequency:
          taskForm.frequency === 'once'
            ? undefined
            : (taskForm.frequency as 'daily' | 'weekly' | 'biweekly'),
        taskCategory: taskForm.taskCategory,
        patientId: taskForm.sessionPatientId,
        weekDays: taskForm.weekDays,
        monthDay: taskForm.monthDay,
        sessionValue: taskForm.sessionValue,
      })
    }
  }

  const handleCompleteTask = (task: {
    id: string
    dueDate?: Date | string | null
    status: string
  }) => {
    if (task.status !== 'completed') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)

        if (taskDate.getTime() > today.getTime()) {
          setAlertMessage(
            'Calma lá!\n\nVocê não pode concluir uma tarefa agendada para o futuro. Aguarde o dia correto para realizá-la.'
          )
          setAlertTitle('Tarefa Futura')
          setShowAlert(true)
          return
        }
      }
    }
    completeMyTaskMutation.mutate({ id: task.id })
  }

  const handleSendFeedback = (taskId: string) => {
    if (!feedbackText.trim()) return

    sendFeedbackMutation.mutate({
      taskId,
      feedback: feedbackText,
    })
  }

  const handleUseSuggestion = (
    suggestion: typeof aiSuggestions extends (infer T)[] | undefined ? T : never
  ) => {
    if (!suggestion) return
    setTaskForm({
      title: suggestion.title,
      frequency: suggestion.frequency as 'daily' | 'weekly' | 'once',
      priority: suggestion.priority as 'low' | 'medium' | 'high',
    })
    setShowTaskForm(true)
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

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'Feedback'
      case 'session':
        return 'Sessão'
      case 'review_records':
        return 'Revisão'
      case 'create_plan':
        return 'Plano'
      case 'approve_reward':
        return 'Recompensa'
      default:
        return 'Tarefa'
    }
  }

  // Tasks for calendar indicators
  const calendarTasks = mainView === 'patients' ? patientTasks || [] : myTasks || []

  return (
    <div className='h-full overflow-y-auto px-4 pt-safe py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8'>
      {/* Desktop Header */}
      <div className='mb-6 flex items-end justify-between lg:mb-8'>
        <div>
          <h2 className='font-bold text-xl text-slate-800 sm:text-2xl lg:text-3xl dark:text-white'>
            {mainView === 'my-routine' ? 'Minha Rotina' : 'Rotina dos Pacientes'}
          </h2>
          <p className='text-slate-500 text-xs sm:text-sm lg:text-base dark:text-slate-400'>
            {mainView === 'my-routine'
              ? 'Gerencie suas tarefas'
              : 'Gerencie as tarefas dos seus pacientes'}
          </p>
        </div>
        <div className='flex items-center gap-2 lg:gap-3'>
          {(mainView === 'my-routine' || selectedPatientId) && (
            <button
              className='touch-target group rounded-xl bg-sky-600 p-2.5 text-white shadow-lg shadow-sky-200 transition-all active:scale-95 hover:bg-sky-700 sm:rounded-2xl sm:p-3 lg:flex lg:items-center lg:gap-2 lg:px-5 lg:py-3 sm:hover:scale-105 dark:shadow-none'
              onClick={() => {
                setShowTaskForm(!showTaskForm)
                const today = new Date()
                const yyyy = today.getFullYear()
                const mm = String(today.getMonth() + 1).padStart(2, '0')
                const dd = String(today.getDate()).padStart(2, '0')
                setTaskForm({
                  ...defaultTaskForm,
                  dueDate: `${yyyy}-${mm}-${dd}`,
                })
              }}
              type='button'
            >
              {showTaskForm ? (
                <X className='lg:hidden' size={20} />
              ) : (
                <Plus className='lg:hidden' size={20} />
              )}
              <span className='hidden lg:inline-flex lg:items-center lg:gap-2'>
                {showTaskForm ? <X size={20} /> : <Plus size={20} />}
                {showTaskForm ? 'Fechar' : 'Nova Tarefa'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Selector */}
      <div className='mb-4 grid grid-cols-2 gap-2 sm:mb-6 lg:mb-8 lg:flex lg:gap-4'>
        <button
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all lg:px-8 lg:py-4 lg:text-lg ${
            mainView === 'my-routine'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg lg:shadow-emerald-200/50 dark:lg:shadow-emerald-900/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          onClick={() => setMainView('my-routine')}
          type='button'
        >
          <Target className='h-5 w-5 lg:h-6 lg:w-6' />
          Minha Rotina
        </button>
        <button
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all lg:px-8 lg:py-4 lg:text-lg ${
            mainView === 'patients'
              ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg lg:shadow-sky-200/50 dark:lg:shadow-sky-900/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          onClick={() => setMainView('patients')}
          type='button'
        >
          <Users className='h-5 w-5 lg:h-6 lg:w-6' />
          Pacientes
        </button>
      </div>

      {mainView === 'patients' && (
        /* Patient Selector Card */
        <div className='mb-4 sm:mb-6 lg:mb-8'>
          <button
            className='flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 sm:rounded-2xl lg:max-w-md lg:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
            onClick={() => setShowPatientList(!showPatientList)}
            type='button'
          >
            <div className='flex items-center gap-3 lg:gap-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white lg:h-12 lg:w-12 lg:text-lg'>
                {selectedPatient?.name?.charAt(0) || <User size={20} />}
              </div>
              <div className='text-left'>
                <p className='font-bold text-slate-400 text-[10px] uppercase tracking-wider lg:text-xs'>
                  Paciente
                </p>
                <p className='font-semibold text-slate-800 lg:text-lg dark:text-white'>
                  {selectedPatient?.name || 'Selecione um paciente'}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform lg:h-6 lg:w-6 ${
                showPatientList ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Patient Dropdown */}
          {showPatientList && (
            <div className='mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl lg:max-w-md lg:max-h-80 dark:border-slate-800 dark:bg-slate-900'>
              {patients?.map((patient) => (
                <button
                  className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 lg:gap-4 lg:p-5 dark:hover:bg-slate-800 ${
                    selectedPatientId === patient.id ? 'bg-sky-50 dark:bg-sky-900/20' : ''
                  }`}
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id)
                    setShowPatientList(false)
                  }}
                  type='button'
                >
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white lg:h-12 lg:w-12'>
                    {patient.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className='font-medium text-slate-800 lg:text-lg dark:text-slate-200'>
                      {patient.name}
                    </p>
                    <p className='text-slate-500 text-sm dark:text-slate-400'>{patient.email}</p>
                  </div>
                  {selectedPatientId === patient.id && (
                    <CheckCircle2 className='ml-auto h-5 w-5 text-sky-500 lg:h-6 lg:w-6' />
                  )}
                </button>
              ))}

              {(!patients || patients.length === 0) && (
                <div className='p-8 text-center lg:p-12'>
                  <User className='mx-auto mb-3 h-12 w-12 text-slate-300 lg:h-16 lg:w-16 dark:text-slate-600' />
                  <p className='text-slate-500 lg:text-lg dark:text-slate-400'>
                    Nenhum paciente encontrado
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MY ROUTINE VIEW */}
      {mainView === 'my-routine' && (
        <>
          {/* Desktop Layout: 2 columns - Calendar on left, Agenda on right */}
          <div className='lg:grid lg:grid-cols-12 lg:gap-6'>
            {/* Left Column - Calendar */}
            <div className='lg:col-span-4 xl:col-span-4'>
              {/* Progress Card */}
              {showProgressBar && (
                <div className='mb-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:mb-6 dark:shadow-none'>
                  <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32' />
                  <div className='relative z-10 mb-2 flex items-end justify-between'>
                    <div>
                      <p className='mb-1 font-bold text-emerald-100 text-[10px] uppercase tracking-wider sm:text-xs'>
                        Progresso do Dia
                      </p>
                      <h3 className='font-bold text-xl sm:text-2xl lg:text-xl'>
                        {dayProgress}% Concluído
                      </h3>
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

              {/* Calendar Component */}
              <Calendar
                selectedDate={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                tasks={calendarTasks}
              />

              {/* Stats Cards */}
              <div className='mt-4 grid grid-cols-2 gap-3 lg:mt-6'>
                <div className='rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-slate-500 text-xs dark:text-slate-400'>Pendentes</span>
                    <Clock className='h-4 w-4 text-amber-500' />
                  </div>
                  <p className='text-xl font-bold text-slate-800 dark:text-white'>
                    {displayMyTasks.filter((t) => t.status !== 'completed').length}
                  </p>
                </div>
                <div className='rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-slate-500 text-xs dark:text-slate-400'>Concluídas</span>
                    <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                  </div>
                  <p className='text-xl font-bold text-slate-800 dark:text-white'>
                    {displayMyTasks.filter((t) => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Agenda */}
            <div className='mt-4 lg:col-span-8 lg:mt-0'>
              <AgendaSidebar
                selectedDate={selectedDate}
                tasks={displayMyTasks}
                onCompleteTask={handleCompleteTask}
                onDateChange={changeDate}
                onDeleteTask={(taskId) => deleteMyTaskMutation.mutate({ id: taskId })}
              />
            </div>
          </div>
        </>
      )}

      {/* PATIENTS VIEW */}
      {mainView === 'patients' && selectedPatientId ? (
        <>
          {/* Desktop Layout: 2 columns - Calendar on left, Agenda on right */}
          <div className='lg:grid lg:grid-cols-12 lg:gap-6'>
            {/* Left Column - Calendar */}
            <div className='lg:col-span-4 xl:col-span-4'>
              {/* Progress Card */}
              {showProgressBar && (
                <div className='mb-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white shadow-lg sm:rounded-3xl sm:p-5 lg:mb-6 dark:shadow-none'>
                  <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32' />
                  <div className='relative z-10 mb-2 flex items-end justify-between'>
                    <div>
                      <p className='mb-1 font-bold text-sky-100 text-[10px] uppercase tracking-wider sm:text-xs'>
                        Progresso de {selectedPatient?.name?.split(' ')[0]}
                      </p>
                      <h3 className='font-bold text-xl sm:text-2xl lg:text-xl'>
                        {dayProgress}% Concluído
                      </h3>
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

              {/* Calendar Component */}
              <Calendar
                selectedDate={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                tasks={calendarTasks}
              />

              {/* Stats Cards */}
              <div className='mt-4 grid grid-cols-2 gap-3 lg:mt-6'>
                <div className='rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-slate-500 text-xs dark:text-slate-400'>Pendentes</span>
                    <Clock className='h-4 w-4 text-amber-500' />
                  </div>
                  <p className='text-xl font-bold text-slate-800 dark:text-white'>
                    {displayTasks.filter((t) => t.status !== 'completed').length}
                  </p>
                </div>
                <div className='rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-slate-500 text-xs dark:text-slate-400'>Concluídas</span>
                    <CheckCircle2 className='h-4 w-4 text-sky-500' />
                  </div>
                  <p className='text-xl font-bold text-slate-800 dark:text-white'>
                    {displayTasks.filter((t) => t.status === 'completed').length}
                  </p>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className='mt-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 dark:from-purple-900/20 dark:to-indigo-900/20'>
                  <button
                    className='flex w-full items-center justify-between'
                    onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                    type='button'
                  >
                    <div className='flex items-center gap-2'>
                      <Sparkles className='h-5 w-5 text-cyan-500' />
                      <h3 className='font-semibold text-slate-800 text-sm dark:text-slate-200'>
                        Sugestões da IA
                      </h3>
                    </div>
                    {showAiSuggestions ? (
                      <ChevronDown className='h-4 w-4 text-slate-500 transition-transform dark:text-slate-400' />
                    ) : (
                      <ChevronDown className='h-4 w-4 text-slate-500 transition-transform dark:text-slate-400' />
                    )}
                  </button>
                  {showAiSuggestions && (
                    <div className='mt-3 space-y-2'>
                      {aiSuggestions.slice(0, 3).map((suggestion, idx) => (
                        <div
                          className='flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800'
                          key={idx}
                        >
                          <div className='flex-1'>
                            <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                              {suggestion.title}
                            </p>
                            <p className='text-slate-500 text-xs dark:text-slate-400'>
                              {suggestion.description}
                            </p>
                          </div>
                          <button
                            className='ml-3 rounded-lg bg-purple-100 p-2 text-purple-600 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                            onClick={() => handleUseSuggestion(suggestion)}
                            type='button'
                          >
                            <Plus className='h-4 w-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Agenda */}
            <div className='mt-4 lg:col-span-8 lg:mt-0'>
              <AgendaSidebar
                selectedDate={selectedDate}
                tasks={displayTasks}
                onCompleteTask={() => {}}
                onDateChange={changeDate}
                onDeleteTask={(taskId) => deleteTaskMutation.mutate({ taskId })}
              />
            </div>
          </div>
        </>
      ) : mainView === 'patients' ? (
        <div className='mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-8 text-center sm:mt-12 sm:rounded-3xl sm:p-12 lg:p-16 dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-500 lg:h-20 lg:w-20 dark:bg-sky-900/30'>
            <Target size={32} />
          </div>
          <h3 className='mb-2 font-bold text-lg text-slate-700 lg:text-xl dark:text-slate-300'>
            Selecione um Paciente
          </h3>
          <p className='max-w-[250px] text-slate-400 text-sm lg:max-w-none lg:text-base dark:text-slate-500'>
            Escolha um paciente acima para visualizar e gerenciar suas tarefas
          </p>
        </div>
      ) : null}

      {/* Task Form Modal for Patient Tasks */}
      {showTaskForm && mainView === 'patients' && selectedPatientId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
            <div className='relative bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-white'>
              <div className='absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10' />
              <h3 className='font-bold text-xl'>Nova Tarefa</h3>
              <p className='text-sky-100 text-sm'>Para {selectedPatient?.name}</p>
            </div>

            <form
              className='p-6'
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateTask()
              }}
            >
              <div className='space-y-4'>
                {/* Title */}
                <div>
                  <label
                    className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                    htmlFor='task-title'
                  >
                    Título *
                  </label>
                  <input
                    autoFocus
                    className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30'
                    id='task-title'
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder='Ex: Praticar respiração consciente'
                    required
                    type='text'
                    value={taskForm.title}
                  />
                </div>

                {/* Date and Priority */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label
                      className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                      htmlFor='task-due-date'
                    >
                      <CalendarIcon className='mb-0.5 inline h-3 w-3' /> Data
                    </label>
                    <input
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                      id='task-due-date'
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      type='date'
                      value={taskForm.dueDate || ''}
                    />
                  </div>

                  <div>
                    <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                      <Flag className='mb-0.5 inline h-3 w-3' /> Prioridade
                    </label>
                    <div className='flex gap-1'>
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          className={`flex-1 rounded-lg border-2 py-2 font-bold text-[10px] uppercase transition-all ${
                            taskForm.priority === p
                              ? p === 'high'
                                ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20'
                                : p === 'medium'
                                  ? 'border-orange-500 bg-orange-50 text-orange-500 dark:bg-orange-900/20'
                                  : 'border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-900/20'
                              : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                          }`}
                          key={p}
                          onClick={() => setTaskForm({ ...taskForm, priority: p })}
                          type='button'
                        >
                          {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <Repeat className='mb-0.5 inline h-3 w-3' /> Frequência
                  </label>
                  <div className='grid grid-cols-3 gap-2'>
                    {(['once', 'daily', 'weekly'] as const).map((freq) => (
                      <button
                        className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                          taskForm.frequency === freq
                            ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                            : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                        }`}
                        key={freq}
                        onClick={() => setTaskForm({ ...taskForm, frequency: freq })}
                        type='button'
                      >
                        {freq === 'once' ? 'Uma vez' : freq === 'daily' ? 'Diário' : 'Semanal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className='flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20'>
                  <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500' />
                  <p className='text-amber-700 text-xs dark:text-amber-400'>
                    A tarefa será atribuída a <strong>{selectedPatient?.name}</strong> e aparecerá
                    na rotina dele(a).
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className='mt-6 flex gap-3'>
                <button
                  className='flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  onClick={() => {
                    setShowTaskForm(false)
                    setTaskForm(defaultTaskForm)
                  }}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className='flex flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900'
                  disabled={createTaskMutation.isPending || !taskForm.title}
                  type='submit'
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      Criar Tarefa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Form Modal for My Routine */}
      {showTaskForm && mainView === 'my-routine' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md max-h-[90vh] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'>
            <div
              className={`relative p-6 text-white ${
                taskForm.taskCategory === 'sessao'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              }`}
            >
              <div className='absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10' />
              <h3 className='font-bold text-xl'>Nova Tarefa</h3>
              <p
                className={`text-sm ${
                  taskForm.taskCategory === 'sessao' ? 'text-sky-100' : 'text-emerald-100'
                }`}
              >
                {taskForm.taskCategory === 'sessao'
                  ? `Sessão${selectedSessionPatient ? ` com ${selectedSessionPatient.name}` : ''}`
                  : 'Para sua rotina pessoal'}
              </p>
            </div>

            <form
              className='p-6'
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateTask()
              }}
            >
              <div className='space-y-4'>
                {/* Task Type */}
                <div>
                  <label className='mb-2 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    <Target className='mb-0.5 inline h-3 w-3' /> Tipo de Tarefa *
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold transition-all ${
                        taskForm.taskCategory === 'geral'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                      }`}
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          taskCategory: 'geral',
                          sessionPatientId: undefined,
                          priority: 'medium',
                        })
                      }
                      type='button'
                    >
                      <Target className='mb-2 h-6 w-6' />
                      <span className='text-sm'>Geral</span>
                      <span className='mt-1 font-normal text-[10px] opacity-70'>
                        Tarefas pessoais
                      </span>
                    </button>
                    <button
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold transition-all ${
                        taskForm.taskCategory === 'sessao'
                          ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                      }`}
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          taskCategory: 'sessao',
                          priority: 'high',
                          type: 'session',
                        })
                      }
                      type='button'
                    >
                      <Users className='mb-2 h-6 w-6' />
                      <span className='text-sm'>Sessão</span>
                      <span className='mt-1 font-normal text-[10px] opacity-70'>Com paciente</span>
                    </button>
                  </div>
                </div>

                {taskForm.taskCategory && (
                  <>
                    {/* Patient Search - for sessions */}
                    {taskForm.taskCategory === 'sessao' && (
                      <div>
                        <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                          <User className='mb-0.5 inline h-3 w-3' /> Paciente *
                        </label>
                        <div className='relative'>
                          <div className='relative'>
                            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
                            <input
                              className='w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-3 pl-10 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30'
                              onChange={(e) => {
                                setPatientSearchQuery(e.target.value)
                                setShowPatientDropdown(true)
                              }}
                              onFocus={() => setShowPatientDropdown(true)}
                              placeholder='Buscar paciente pelo nome...'
                              type='text'
                              value={
                                selectedSessionPatient
                                  ? selectedSessionPatient.name || ''
                                  : patientSearchQuery
                              }
                            />
                            {selectedSessionPatient && (
                              <button
                                className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700'
                                onClick={() => {
                                  setTaskForm({
                                    ...taskForm,
                                    sessionPatientId: undefined,
                                  })
                                  setPatientSearchQuery('')
                                }}
                                type='button'
                              >
                                <X className='h-4 w-4' />
                              </button>
                            )}
                          </div>

                          {showPatientDropdown && !selectedSessionPatient && (
                            <div className='absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800'>
                              {filteredPatients.length === 0 ? (
                                <div className='p-4 text-center text-slate-500 text-sm'>
                                  Nenhum paciente encontrado
                                </div>
                              ) : (
                                filteredPatients.map((patient) => (
                                  <button
                                    className='flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700'
                                    key={patient.id}
                                    onClick={() => {
                                      setTaskForm({
                                        ...taskForm,
                                        sessionPatientId: patient.id,
                                      })
                                      setPatientSearchQuery('')
                                      setShowPatientDropdown(false)
                                    }}
                                    type='button'
                                  >
                                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white text-sm'>
                                      {patient.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                      <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                                        {patient.name}
                                      </p>
                                      <p className='text-slate-500 text-xs dark:text-slate-400'>
                                        {patient.email}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Session Value */}
                    {taskForm.taskCategory === 'sessao' && (
                      <div>
                        <label
                          className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                          htmlFor='session-value'
                        >
                          <Banknote className='mb-0.5 inline h-3 w-3' /> Valor da Sessão (R$)
                        </label>
                        <input
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30'
                          id='session-value'
                          min='0'
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              sessionValue: Number(e.target.value),
                            })
                          }
                          placeholder='0.00'
                          type='number'
                          value={taskForm.sessionValue || ''}
                        />
                      </div>
                    )}

                    {/* Title - for general tasks */}
                    {taskForm.taskCategory === 'geral' && (
                      <div>
                        <label
                          className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                          htmlFor='my-task-title'
                        >
                          Título *
                        </label>
                        <input
                          autoFocus
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-900/30'
                          id='my-task-title'
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          placeholder='Ex: Revisar relatórios semanais'
                          required
                          type='text'
                          value={taskForm.title}
                        />
                      </div>
                    )}

                    {/* Frequency for sessions */}
                    {taskForm.taskCategory === 'sessao' && (
                      <div>
                        <label className='mb-1 block font-bold text-slate-400 text-[10px] uppercase tracking-wider'>
                          <Repeat className='mb-0.5 inline h-3 w-3' /> Frequência
                        </label>
                        <div className='grid grid-cols-3 gap-1.5'>
                          {(
                            [
                              { key: 'once', label: 'Única' },
                              { key: 'weekly', label: 'Semanal' },
                              { key: 'biweekly', label: 'Quinzenal' },
                            ] as const
                          ).map((freq) => (
                            <button
                              className={`rounded-md border-2 px-2 py-1.5 font-bold text-[10px] transition-all ${
                                taskForm.frequency === freq.key
                                  ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                                  : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                              }`}
                              key={freq.key}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  frequency: freq.key,
                                  weekDays: [],
                                  monthDay: undefined,
                                })
                              }
                              type='button'
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>

                        {/* Week days selection */}
                        {(taskForm.frequency === 'weekly' || taskForm.frequency === 'biweekly') && (
                          <div className='mt-2'>
                            <p className='mb-1.5 text-slate-500 text-[10px] dark:text-slate-400'>
                              Selecione o dia da semana:
                            </p>
                            <div className='grid grid-cols-7 gap-1'>
                              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                                const isSelected = taskForm.weekDays?.includes(index)
                                return (
                                  <button
                                    className={`aspect-square rounded-md border-2 font-bold text-[10px] transition-all ${
                                      isSelected
                                        ? 'border-sky-500 bg-sky-500 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-600'
                                    }`}
                                    key={index}
                                    onClick={() => {
                                      setTaskForm({
                                        ...taskForm,
                                        weekDays: [index],
                                      })
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

                        {/* Date for single sessions */}
                        {taskForm.frequency === 'once' && (
                          <div className='mt-2'>
                            <label
                              className='mb-1 block font-medium text-slate-500 text-[10px] dark:text-slate-400'
                              htmlFor='session-date-once'
                            >
                              Data da Sessão:
                            </label>
                            <input
                              className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none transition-colors focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                              id='session-date-once'
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  dueDate: e.target.value,
                                  monthDay: undefined,
                                })
                              }
                              type='date'
                              value={taskForm.dueDate || ''}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Session warning */}
                    {taskForm.taskCategory === 'sessao' && selectedSessionPatient && (
                      <div className='flex items-start gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20'>
                        <AlertCircle className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500' />
                        <p className='text-amber-700 text-[10px] leading-tight dark:text-amber-400'>
                          {taskForm.frequency === 'weekly'
                            ? 'Sessão semanal no mesmo dia'
                            : taskForm.frequency === 'biweekly'
                              ? 'Sessão quinzenal no mesmo dia'
                              : taskForm.frequency === 'once'
                                ? `Sessão em ${new Date(taskForm.dueDate || '').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                                : 'Tarefa adicionada'}
                          {' para '}
                          <strong>{selectedSessionPatient.name}</strong>.
                        </p>
                      </div>
                    )}

                    {/* Session priority */}
                    {taskForm.taskCategory === 'sessao' && (
                      <div className='flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 dark:bg-red-900/20'>
                        <Flag className='h-3.5 w-3.5 text-red-500' fill='currentColor' />
                        <span className='font-medium text-red-600 text-[10px] dark:text-red-400'>
                          Prioridade Alta
                        </span>
                      </div>
                    )}

                    {/* Date and Priority for general tasks */}
                    {taskForm.taskCategory === 'geral' && (
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label
                            className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'
                            htmlFor='my-task-due-date-geral'
                          >
                            <CalendarIcon className='mb-0.5 inline h-3 w-3' /> Data
                          </label>
                          <input
                            className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                            id='my-task-due-date-geral'
                            onChange={(e) =>
                              setTaskForm({
                                ...taskForm,
                                dueDate: e.target.value,
                              })
                            }
                            type='date'
                            value={taskForm.dueDate || ''}
                          />
                        </div>

                        <div>
                          <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                            <Flag className='mb-0.5 inline h-3 w-3' /> Prioridade
                          </label>
                          <div className='flex gap-1'>
                            {(['low', 'medium', 'high'] as const).map((p) => (
                              <button
                                className={`flex-1 rounded-lg border-2 py-2 font-bold text-[10px] uppercase transition-all ${
                                  taskForm.priority === p
                                    ? p === 'high'
                                      ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20'
                                      : p === 'medium'
                                        ? 'border-orange-500 bg-orange-50 text-orange-500 dark:bg-orange-900/20'
                                        : 'border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-900/20'
                                    : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                                }`}
                                key={p}
                                onClick={() => setTaskForm({ ...taskForm, priority: p })}
                                type='button'
                              >
                                {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Frequency for general tasks */}
                    {taskForm.taskCategory === 'geral' && (
                      <div>
                        <label className='mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
                          <Repeat className='mb-0.5 inline h-3 w-3' /> Frequência
                        </label>
                        <div className='grid grid-cols-2 gap-2'>
                          {(
                            [
                              { key: 'once', label: 'Uma Vez' },
                              { key: 'daily', label: 'Diário' },
                              { key: 'weekly', label: 'Semanal' },
                              { key: 'monthly', label: 'Mensal' },
                            ] as const
                          ).map((freq) => (
                            <button
                              className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                                taskForm.frequency === freq.key
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700'
                              }`}
                              key={freq.key}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  frequency: freq.key,
                                  weekDays: [],
                                  monthDay: undefined,
                                })
                              }
                              type='button'
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>

                        {/* Week days selection */}
                        {taskForm.frequency === 'weekly' && (
                          <div className='mt-3'>
                            <p className='mb-2 text-slate-500 text-xs dark:text-slate-400'>
                              Selecione os dias da semana:
                            </p>
                            <div className='grid grid-cols-7 gap-1'>
                              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                                const isSelected = taskForm.weekDays?.includes(index)
                                return (
                                  <button
                                    className={`aspect-square rounded-lg border-2 font-bold text-xs transition-all ${
                                      isSelected
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600'
                                    }`}
                                    key={index}
                                    onClick={() => {
                                      const currentDays = taskForm.weekDays || []
                                      const newDays = isSelected
                                        ? currentDays.filter((d) => d !== index)
                                        : [...currentDays, index].sort((a, b) => a - b)
                                      setTaskForm({
                                        ...taskForm,
                                        weekDays: newDays,
                                      })
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

                        {/* Month days selection */}
                        {taskForm.frequency === 'monthly' && (
                          <div className='mt-3'>
                            <p className='mb-2 text-slate-500 text-xs dark:text-slate-400'>
                              Selecione os dias do mês:
                            </p>
                            <div className='grid grid-cols-7 gap-1'>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                                const isSelected = taskForm.monthDays?.includes(day)
                                return (
                                  <button
                                    className={`aspect-square rounded-lg border-2 font-bold text-xs transition-all ${
                                      isSelected
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600'
                                    }`}
                                    key={day}
                                    onClick={() => {
                                      const currentDays = taskForm.monthDays || []
                                      const newDays = isSelected
                                        ? currentDays.filter((d) => d !== day)
                                        : [...currentDays, day].sort((a, b) => a - b)
                                      setTaskForm({
                                        ...taskForm,
                                        monthDays: newDays,
                                      })
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
                    )}
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className='mt-6 flex gap-3'>
                <button
                  className='flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  onClick={() => {
                    setShowTaskForm(false)
                    setTaskForm(defaultTaskForm)
                    setPatientSearchQuery('')
                    setShowPatientDropdown(false)
                  }}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                    taskForm.taskCategory === 'sessao' ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}
                  disabled={
                    createMyTaskMutation.isPending ||
                    !taskForm.taskCategory ||
                    (taskForm.taskCategory === 'geral' && !taskForm.title) ||
                    (taskForm.taskCategory === 'sessao' &&
                      (!taskForm.sessionPatientId ||
                        ((taskForm.frequency === 'weekly' || taskForm.frequency === 'biweekly') &&
                          !taskForm.weekDays?.length) ||
                        (taskForm.frequency === 'once' && !taskForm.dueDate)))
                  }
                  type='submit'
                >
                  {createMyTaskMutation.isPending ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      Criar Tarefa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800'>
            <div className='mb-4 flex items-center gap-3 text-amber-500'>
              <AlertTriangle size={28} />
              <h3 className='font-bold text-lg text-slate-800 dark:text-white'>{alertTitle}</h3>
            </div>
            <p className='mb-6 whitespace-pre-line text-slate-600 dark:text-slate-300'>
              {alertMessage}
            </p>
            <button
              className='w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900'
              onClick={() => setShowAlert(false)}
              type='button'
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
