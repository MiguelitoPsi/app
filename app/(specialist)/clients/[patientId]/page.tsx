'use client'

import {
  RiPulseLine as Activity,
  RiErrorWarningLine as AlertCircle,
  RiAlertLine as AlertTriangle,
  RiArrowLeftLine as ArrowLeft,
  RiBankCardLine as Banknote,
  RiBookOpenLine as BookOpen,
  RiBrainLine as Brain,
  RiBriefcaseLine as Briefcase,
  RiCalendarLine as CalendarIcon,
  RiCheckboxCircleLine as CheckCircle,
  RiTimeLine as Clock,
  RiDownloadLine as Download,
  RiEyeLine as Eye,
  RiFileAiLine as FileAudio,
  RiFileTextLine as FileText,
  RiFlagLine as Flag,
  RiHeartLine as Heart,
  RiLoaderLine as Loader2,
  RiMailLine as Mail,
  RiMapPinLine as MapPin,
  RiChat1Line as MessageSquare,
  RiMicLine as Mic,
  RiPhoneLine as Phone,
  RiAddLine as Plus,
  RiRepeatLine as Repeat,
  RiScalesLine as Scale,
  RiShiningLine as Sparkles,
  RiTargetLine as Target,
  RiTrophyLine as Trophy,
  RiUploadLine as Upload,
  RiUserLine as User,
  RiTeamLine as Users,
  RiCloseLine as X,
} from '@remixicon/react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CognitiveConceptualizationWizard } from '@/components/CognitiveConceptualizationWizard'
import AgendaSidebar from '@/components/therapist/AgendaSidebar'
import Calendar from '@/components/therapist/Calendar'
import { trpc } from '@/lib/trpc/client'
import { translateEmotionWithEmoji, translateMood } from '@/lib/utils/mood'

interface PatientTask {
  id: string
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date | null
  status: 'pending' | 'completed'
  completedAt?: Date | null
  feedback?: string | null
  patientId: string
  createdAt: Date
}

interface PatientReward {
  id: string
  title: string
  description?: string | null
  cost: number
  claimed: boolean
  claimedAt?: Date | null
}

interface PatientConceptualization {
  name?: string
  childhoodData?: string
  coreBelief?: string
  conditionalAssumptions?: string
  compensatoryStrategies?: string
  situations?: string
  [key: string]: any
}

interface JournalEntry {
  id: string
  mood?: string
  isRead?: boolean
  content?: string
  aiAnalysis?: string
  createdAt: string | Date
  therapistFeedback?: string | null | undefined
  [key: string]: any
}

interface SessionDocument {
  id?: string
  fileType?: string | null | undefined
  fileName?: string
  createdAt?: string | Date | null | undefined
  sessionDate?: string | Date | null | undefined
  [key: string]: any
}

interface SessionTranscription {
  id: string
  originalFilename: string
  status: string
  createdAt: string | Date
  language?: string
  segments?: any[]
  [key: string]: any
}

type PatientTab = 'overview' | 'agenda' | 'tcc' | 'journal' | 'documents' | 'rewards' | 'session'

export default function PatientProfilePage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const patientId = params.patientId as string
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<PatientTab>('overview')

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Cognitive Conceptualization Wizard state
  const [showCognitiveWizard, setShowCognitiveWizard] = useState(false)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tabParam || tabParam === 'overview') {
      setActiveTab('overview')
      return
    }

    if (tabParam === 'journal' || tabParam === 'sessions') {
      setActiveTab('journal')
    } else if (tabParam === 'tcc') {
      setActiveTab('tcc')
    } else if (tabParam === 'documents') {
      setActiveTab('documents')
    } else if (tabParam === 'rewards') {
      setActiveTab('rewards')
    } else if (tabParam === 'session') {
      setActiveTab('session')
    } else if (tabParam === 'agenda') {
      setActiveTab('agenda')
    } else {
      setActiveTab('overview')
    }
  }, [tabParam])

  const handleTabChange = useCallback(
    (tab: PatientTab) => {
      setActiveTab(tab)

      const nextSearchParams = new URLSearchParams(searchParams.toString())
      nextSearchParams.set('tab', tab)
      router.replace(`${pathname}?${nextSearchParams.toString()}`)
    },
    [pathname, router, searchParams]
  )

  // Buscar dados do usuário atual (terapeuta)
  const { data: currentUser } = trpc.user.getProfile.useQuery()

  // Buscar dados do paciente
  const { data: patient, isLoading: isPatientLoading } = trpc.patient.getById.useQuery(
    { id: patientId },
    { enabled: !!patientId }
  )

  // Buscar documentos de sessões
  const { data: sessionDocuments } = trpc.therapistReports.getPatientDocuments.useQuery(
    { patientId },
    { enabled: !!patientId }
  ) as { data?: SessionDocument[] }

  // Buscar conceituação cognitiva (TCC)
  const { data: conceptualization } = trpc.therapistReports.getCognitiveConceptualization.useQuery(
    { patientId },
    { enabled: !!patientId }
  ) as { data?: PatientConceptualization }

  // Buscar journal entries (registros/sessões)
  const { data: journalEntries, refetch: refetchJournal } = trpc.journal.getAll.useQuery(
    { userId: patientId },
    { enabled: !!patientId }
  ) as { data?: JournalEntry[]; refetch: () => Promise<any> }

  // Buscar recompensas do paciente
  const { data: rewards, refetch: refetchRewards } = trpc.reward.getAll.useQuery(
    { userId: patientId },
    { enabled: !!patientId }
  ) as { data?: PatientReward[]; refetch: () => Promise<any> }

  // Buscar transcrições de sessões
  const {
    data: sessionTranscriptions,
    refetch: refetchTranscriptions,
    isLoading: isTranscriptionsLoading,
  } = trpc.transcription.getByPatient.useQuery({ patientId }, { enabled: !!patientId }) as {
    data?: SessionTranscription[]
    refetch: () => Promise<any>
    isLoading: boolean
  }

  const utils = trpc.useUtils()

  // === AGENDA TAB STATE ===
  const [agendaSelectedDate, setAgendaSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [showTaskForm, setShowTaskForm] = useState(false)
  const defaultTaskForm = {
    title: '',
    frequency: 'weekly' as 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: undefined as string | undefined,
    type: 'custom' as
      | 'feedback'
      | 'session'
      | 'review_records'
      | 'create_plan'
      | 'approve_reward'
      | 'custom',
    taskCategory: undefined as 'geral' | 'sessao' | undefined,
    weekDays: undefined as number[] | undefined,
    monthDay: undefined as number | undefined,
    monthDays: undefined as number[] | undefined,
    sessionValue: undefined as number | undefined,
  }
  const [taskForm, setTaskForm] = useState(defaultTaskForm)
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)
  const [showAgendaAlert, setShowAgendaAlert] = useState(false)
  const [agendaAlertMessage, setAgendaAlertMessage] = useState('')
  const [agendaAlertTitle, setAgendaAlertTitle] = useState('Atenção')

  // === AGENDA TAB QUERIES ===
  const { data: patientTasks } = trpc.task.getPatientTasksFromTherapist.useQuery(
    { patientId },
    { enabled: !!patientId && activeTab === 'agenda' }
  ) as { data?: PatientTask[] }
  const { data: aiSuggestions } = trpc.task.getAISuggestedTasks.useQuery(
    { patientId },
    { enabled: !!patientId && activeTab === 'agenda' }
  )

  // === AGENDA TAB MUTATIONS ===
  const createPatientTaskMutation = trpc.task.createForPatient.useMutation({
    onMutate: async (newTask) => {
      await utils.task.getPatientTasksFromTherapist.cancel({ patientId })
      const previous = utils.task.getPatientTasksFromTherapist.getData({
        patientId,
      })
      utils.task.getPatientTasksFromTherapist.setData({ patientId }, (old: any) => {
        if (!old) return []
        const tempId = Math.random().toString()
        return [
          ...old,
          {
            id: tempId,
            title: newTask.title,
            frequency: newTask.frequency || 'daily',
            priority: newTask.priority || 'medium',
            dueDate: newTask.dueDate ? new Date(newTask.dueDate) : new Date(),
            status: 'pending',
            patientId,
            createdAt: new Date(),
            completedAt: null,
            description: newTask.description || null,
          },
        ]
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.task.getPatientTasksFromTherapist.setData({ patientId }, context.previous)
      }
      toast.error('Erro ao criar tarefa')
    },
    onSettled: () => {
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId })
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!')
    },
  })

  const deletePatientTaskMutation = trpc.task.deletePatientTask.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.task.getPatientTasksFromTherapist.cancel({ patientId })
      const previous = utils.task.getPatientTasksFromTherapist.getData({
        patientId,
      })
      utils.task.getPatientTasksFromTherapist.setData({ patientId }, (old: any) =>
        (old || []).filter((t: any) => t.id !== taskId)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.task.getPatientTasksFromTherapist.setData({ patientId }, context.previous)
      }
      toast.error('Erro ao deletar tarefa')
    },
    onSettled: () => {
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId })
    },
    onSuccess: () => {
      toast.success('Tarefa removida!')
    },
  })

  const completePatientTaskMutation = trpc.task.togglePatientTaskByTherapist.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.task.getPatientTasksFromTherapist.cancel({ patientId })
      const previous = utils.task.getPatientTasksFromTherapist.getData({
        patientId,
      })
      utils.task.getPatientTasksFromTherapist.setData({ patientId }, ((old: any) =>
        (old || []).map((t: any) =>
          t.id === taskId
            ? {
                ...t,
                status: t.status === 'completed' ? 'pending' : 'completed',
              }
            : t
        )) as any)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.task.getPatientTasksFromTherapist.setData({ patientId }, context.previous)
      }
      toast.error('Erro ao atualizar tarefa')
    },
    onSettled: () => {
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId })
    },
  })

  const createSessionTaskMutation = trpc.therapistTasks.create.useMutation({
    onSuccess: () => {
      toast.success('Sessão agendada com sucesso!')
      utils.task.getPatientTasksFromTherapist.invalidate({ patientId })
    },
    onError: (error) => {
      toast.error(`Erro ao agendar sessão: ${error.message}`)
    },
  })

  // === AGENDA TAB COMPUTED VALUES ===
  const agendaDisplayTasks = useMemo(() => {
    if (!patientTasks) return []
    return patientTasks.filter((task) => {
      if (!task.dueDate) return true
      const td = new Date(task.dueDate)
      td.setHours(0, 0, 0, 0)
      return td.getTime() === agendaSelectedDate.getTime()
    })
  }, [patientTasks, agendaSelectedDate])

  const agendaDayProgress = useMemo(() => {
    if (!agendaDisplayTasks.length) return 0
    const completed = agendaDisplayTasks.filter((t) => t.status === 'completed').length
    return Math.round((completed / agendaDisplayTasks.length) * 100)
  }, [agendaDisplayTasks])

  const agendaShowProgressBar = agendaDisplayTasks.length > 0

  const agendaCalendarTasks = useMemo(() => {
    if (!patientTasks) return []
    return patientTasks.map((t) => ({
      dueDate: t.dueDate || new Date(),
      id: t.id,
      priority: t.priority,
    }))
  }, [patientTasks])

  const handleCreateAgendaTask = () => {
    if (!taskForm.title.trim()) {
      setAgendaAlertTitle('Atenção')
      setAgendaAlertMessage('Por favor, insira um título para a tarefa.')
      setShowAgendaAlert(true)
      return
    }

    if (taskForm.taskCategory === 'sessao') {
      const freq = taskForm.frequency === 'monthly' ? 'weekly' : taskForm.frequency
      createSessionTaskMutation.mutate({
        title: taskForm.title,
        type: 'session',
        priority: 'high',
        frequency: freq,
        isRecurring: freq !== 'once',
        dueDate: taskForm.dueDate,
        patientId,
        taskCategory: 'sessao',
        weekDays: taskForm.weekDays,
        monthDay: taskForm.monthDay,
        monthDays: taskForm.monthDays,
        sessionValue: taskForm.sessionValue,
      })
    } else {
      createPatientTaskMutation.mutate({
        patientId,
        title: taskForm.title,
        frequency:
          taskForm.frequency === 'biweekly' || taskForm.frequency === 'monthly'
            ? 'weekly'
            : taskForm.frequency,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
      })
    }
    setShowTaskForm(false)
    setTaskForm(defaultTaskForm)
  }

  const handleCompleteAgendaTask = (task: { id: string; status: string }) => {
    completePatientTaskMutation.mutate({ taskId: task.id })
  }

  const handleUseSuggestion = (suggestion: {
    title: string
    frequency: string
    priority: string
  }) => {
    createPatientTaskMutation.mutate({
      patientId,
      title: suggestion.title,
      frequency:
        suggestion.frequency === 'daily' ||
        suggestion.frequency === 'weekly' ||
        suggestion.frequency === 'once'
          ? suggestion.frequency
          : 'daily',
      priority:
        suggestion.priority === 'low' ||
        suggestion.priority === 'medium' ||
        suggestion.priority === 'high'
          ? suggestion.priority
          : 'medium',
    })
  }

  const changeAgendaDate = (direction: number) => {
    setAgendaSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + direction)
      return d
    })
  }

  // Mutation para criar transcrição local
  const createTranscriptionMutation = trpc.transcription.create.useMutation({
    onSuccess: () => {
      refetchTranscriptions()
    },
  })

  const markAsReadMutation = trpc.journal.markAsRead.useMutation({
    onSuccess: () => {
      toast.success('Registro marcado como lido!')
      utils.analytics.getPendingItems.invalidate()
      refetchJournal()
    },
    onError: (error) => {
      toast.error(`Erro ao marcar como lido: ${error.message}`)
    },
  })

  const addFeedbackMutation = trpc.journal.addFeedback.useMutation({
    onSuccess: () => {
      toast.success('Feedback enviado com sucesso!')
      refetchJournal()
    },
    onError: (error) => {
      toast.error(`Erro ao enviar feedback: ${error.message}`)
    },
  })

  const updateRewardCostMutation = trpc.reward.updateCost.useMutation({
    onSuccess: () => {
      toast.success('Custo da recompensa atualizado!')
      refetchRewards()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar custo: ${error.message}`)
    },
  })

  // Upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file)
    } else {
      toast.error('Por favor, selecione um arquivo de áudio ou vídeo')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!currentUser) return

    const fileToUpload = selectedFile
    setIsUploading(true)
    setUploadProgress(0)

    console.log('[Upload] Iniciando upload...')
    console.log('[Upload] Arquivo:', fileToUpload.name)
    console.log('[Upload] Tamanho:', fileToUpload.size, 'bytes')
    console.log('[Upload] Tipo:', fileToUpload.type)
    console.log('[Upload] PatientId:', patientId)

    try {
      // 1. Obter presigned URL
      console.log('[Upload] Solicitando presigned URL...')
      const presignResponse = await fetch('/api/r2/presign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          filename: fileToUpload.name,
          contentType: fileToUpload.type,
          fileSize: fileToUpload.size,
          purpose: 'transcription',
        }),
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json()
        console.error('[Upload] Erro ao obter presigned URL:', errorData)
        throw new Error(errorData.error || 'Erro ao obter URL de upload')
      }

      const presignData = await presignResponse.json()
      console.log('[Upload] Presigned URL obtida:', {
        jobId: presignData.jobId,
        r2Key: presignData.r2Key,
        bucket: presignData.bucket,
      })

      setUploadProgress(10)

      // 2. Upload direto para R2
      console.log('[Upload] Iniciando upload para R2...')
      const uploadResponse = await fetch(presignData.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileToUpload.type },
        body: fileToUpload,
      })

      if (!uploadResponse.ok) {
        console.error(
          '[Upload] Erro no upload R2:',
          uploadResponse.status,
          uploadResponse.statusText
        )
        throw new Error(`Erro no upload: HTTP ${uploadResponse.status}`)
      }

      console.log('[Upload] Upload R2 concluído com sucesso!')
      setUploadProgress(70)

      // 3. Confirmar upload
      console.log('[Upload] Confirmando upload...')
      const confirmResponse = await fetch('/api/r2/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: presignData.jobId }),
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json()
        console.error('[Upload] Erro ao confirmar upload:', errorData)
        throw new Error(errorData.error || 'Erro ao confirmar upload')
      }

      const confirmData = await confirmResponse.json()
      console.log('[Upload] Upload confirmado:', confirmData)
      setUploadProgress(85)

      // 4. Criar registro de transcrição
      console.log('[Upload] Criando registro de transcrição...')
      await createTranscriptionMutation.mutateAsync({
        jobId: presignData.jobId,
        patientId,
        originalFilename: fileToUpload.name,
        status: 'queued',
      })

      console.log('[Upload] Registro de transcrição criado!')
      setUploadProgress(100)

      toast.success('Upload concluído! Transcrição em processamento.')
      setShowUploadModal(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('[Upload] Erro geral:', error)
      toast.error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return (
          <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30'>
            <Clock className='h-3 w-3' /> Na fila
          </span>
        )
      case 'processing':
        return (
          <span className='inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-400 border border-sky-500/30'>
            <Loader2 className='h-3 w-3 animate-spin' /> Processando
          </span>
        )
      case 'completed':
        return (
          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30'>
            <CheckCircle className='h-3 w-3' /> Concluído
          </span>
        )
      case 'failed':
        return (
          <span className='inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/30'>
            <AlertCircle className='h-3 w-3' /> Falhou
          </span>
        )
      default:
        return null
    }
  }

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'inativo':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      case 'em pausa':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    }
  }

  const getFileIcon = (_fileType: string) => <FileText className='h-5 w-5 text-purple-400' />

  const FeedbackSection = ({
    entryId,
    existingFeedback,
  }: {
    entryId: string
    existingFeedback: string | null
  }) => {
    const [feedback, setFeedback] = useState(existingFeedback || '')
    const [isEditing, setIsEditing] = useState(!existingFeedback)

    const handleSubmit = () => {
      if (!feedback.trim()) return
      addFeedbackMutation.mutate(
        { entryId, feedback },
        {
          onSuccess: () => setIsEditing(false),
        }
      )
    }

    if (!isEditing && existingFeedback) {
      return (
        <div className='mt-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs font-semibold uppercase text-emerald-400 flex items-center gap-1'>
              <MessageSquare className='h-3 w-3' /> Seu Feedback
            </p>
            <button
              className='text-xs text-slate-400 hover:text-white'
              onClick={() => setIsEditing(true)}
              type='button'
            >
              Editar
            </button>
          </div>
          <p className='text-sm text-slate-200 whitespace-pre-wrap'>{existingFeedback}</p>
        </div>
      )
    }

    return (
      <div className='mt-3 space-y-2'>
        <textarea
          className='w-full rounded-lg bg-[#0d1117] p-3 text-sm text-slate-300 border border-slate-700 focus:border-sky-500 focus:outline-none min-h-[80px]'
          onChange={(e) => setFeedback(e.target.value)}
          placeholder='Escreva seu feedback para o paciente...'
          value={feedback}
        />
        <div className='flex justify-end gap-2'>
          {existingFeedback && (
            <button
              className='px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white'
              onClick={() => {
                setFeedback(existingFeedback)
                setIsEditing(false)
              }}
              type='button'
            >
              Cancelar
            </button>
          )}
          <button
            className='flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50'
            disabled={addFeedbackMutation.isPending || !feedback.trim()}
            onClick={handleSubmit}
            type='button'
          >
            {addFeedbackMutation.isPending ? 'Enviando...' : 'Salvar Feedback'}
          </button>
        </div>
      </div>
    )
  }

  if (isPatientLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent' />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-slate-400'>
        <User className='mb-4 h-12 w-12' />
        <p>Paciente não encontrado</p>
        <Link className='mt-4 text-sky-400 hover:underline' href='/clients'>
          Voltar para Meus Pacientes
        </Link>
      </div>
    )
  }

  return (
    <div className='min-h-full bg-slate-50 dark:bg-slate-900'>
      {/* Botão Voltar */}
      <div className='border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6 lg:px-8'>
        <Link
          className='inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400'
          href='/clients'
        >
          <ArrowLeft className='h-4 w-4' />
          Voltar para Meus Pacientes
        </Link>
      </div>

      {/* Header do Paciente */}
      <header className='border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-4'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-xl font-bold text-white shadow-lg'>
              {patient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className='text-2xl font-bold text-slate-800 dark:text-white'>
                {patient.name || 'Nome não disponível'}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400'>
                {calculateAge(patient.birthdate) && (
                  <span className='flex items-center gap-1'>
                    <User className='h-4 w-4 text-slate-400' />
                    {calculateAge(patient.birthdate)} anos
                  </span>
                )}
                {patient.profession && (
                  <span className='flex items-center gap-1'>
                    <Briefcase className='h-4 w-4 text-slate-400' />
                    {patient.profession}
                  </span>
                )}
                {patient.city && (
                  <span className='flex items-center gap-1'>
                    <MapPin className='h-4 w-4' />
                    {patient.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
              patient.status || 'Ativo'
            )}`}
          >
            {patient.status === 'Ativo' ? (
              <CheckCircle className='h-3 w-3' />
            ) : (
              <AlertCircle className='h-3 w-3' />
            )}
            {patient.status || 'Ativo'}
          </span>
        </div>
      </header>

      {/* Tabs de Navegação */}
      <nav className='border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8'>
        <div className='flex gap-1 overflow-x-auto no-scrollbar'>
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
            { id: 'journal', label: 'Diário e Registros', icon: BookOpen },
            { id: 'session', label: 'Sessões', icon: Mic },
            { id: 'documents', label: 'Documentos', icon: FileText },
            { id: 'rewards', label: 'Prêmios', icon: Trophy },
            { id: 'tcc', label: 'Conceituação TCC', icon: Brain },
          ].map((tab) => (
            <button
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              key={tab.id}
              onClick={() => handleTabChange(tab.id as PatientTab)}
              type='button'
            >
              <tab.icon className='h-4 w-4' />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo */}
      <main className='p-4 sm:p-6 lg:p-8'>
        {/* Visão Geral */}
        {activeTab === 'overview' && (
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Informações de Contato */}
            <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white'>
                <User className='h-5 w-5 text-sky-500' />
                Informações de Contato
              </h2>
              <div className='space-y-3'>
                <div className='flex items-center gap-3 text-slate-300'>
                  <Mail className='h-5 w-5 text-slate-500' />
                  <span>{patient.email || '-'}</span>
                </div>
                <div className='flex items-center gap-3 text-slate-300'>
                  <Phone className='h-5 w-5 text-slate-500' />
                  <span>{patient.phone || 'Não informado'}</span>
                </div>
                <div className='flex items-center gap-3 text-slate-300'>
                  <MapPin className='h-5 w-5 text-slate-500' />
                  <span>{patient.city || 'Não informado'}</span>
                </div>
              </div>
            </div>

            {/* Status do Tratamento */}
            <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white'>
                <Activity className='h-5 w-5 text-emerald-500' />
                Status do Tratamento
              </h2>
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-slate-900 dark:text-white'>
                    {journalEntries?.length || 0}
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Sessões/Registros</p>
                </div>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-slate-900 dark:text-white'>
                    {sessionDocuments?.length || 0}
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Documentos</p>
                </div>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-slate-900 dark:text-white'>
                    {patient.createdAt
                      ? Math.floor(
                          (Date.now() - new Date(patient.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24 * 7)
                        )
                      : 0}
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Semanas em tratamento
                  </p>
                </div>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>Alta</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Meta</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agenda */}
        {activeTab === 'agenda' && (
          <div className='space-y-6'>
            {/* Calendar + Sidebar Layout */}
            <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
              {/* Left Column - Calendar + Stats */}
              <div className='space-y-6'>
                <Calendar
                  onChange={setAgendaSelectedDate}
                  selectedDate={agendaSelectedDate}
                  tasks={agendaCalendarTasks}
                />

                {/* Progress Card */}
                {agendaShowProgressBar && (
                  <div className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2'>
                        <Target className='h-4 w-4 text-sky-500' />
                        Progresso do Dia
                      </h3>
                      <span className='text-sm font-bold text-sky-400'>{agendaDayProgress}%</span>
                    </div>
                    <div className='h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500'
                        style={{ width: `${agendaDayProgress}%` }}
                      />
                    </div>
                    <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>
                      {agendaDisplayTasks.filter((t) => t.status === 'completed').length} de{' '}
                      {agendaDisplayTasks.length} tarefas concluídas
                    </p>
                  </div>
                )}

                {/* Stats Cards */}
                <div className='grid grid-cols-3 gap-3'>
                  <div className='rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <p className='text-2xl font-bold text-sky-400'>{patientTasks?.length || 0}</p>
                    <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>Total</p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <p className='text-2xl font-bold text-emerald-400'>
                      {patientTasks?.filter((t) => t.status === 'completed').length || 0}
                    </p>
                    <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>Feitas</p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <p className='text-2xl font-bold text-amber-400'>
                      {patientTasks?.filter((t) => t.status === 'pending').length || 0}
                    </p>
                    <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>Pendentes</p>
                  </div>
                </div>

                {/* AI Suggestions */}
                {showAiSuggestions && aiSuggestions && aiSuggestions.length > 0 && (
                  <div className='rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-sm'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2'>
                        <Sparkles className='h-4 w-4 text-purple-400' />
                        Sugestões da IA
                      </h3>
                      <button
                        className='text-xs text-slate-500 hover:text-slate-300'
                        onClick={() => setShowAiSuggestions(false)}
                        type='button'
                      >
                        Ocultar
                      </button>
                    </div>
                    <div className='space-y-2'>
                      {aiSuggestions.map((suggestion, idx) => (
                        <div
                          className='flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50'
                          key={idx}
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-slate-900 dark:text-white truncate'>
                              {suggestion.title}
                            </p>
                            <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>
                              {suggestion.description}
                            </p>
                          </div>
                          <button
                            className='ml-3 flex-shrink-0 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600 transition-colors'
                            onClick={() => handleUseSuggestion(suggestion)}
                            type='button'
                          >
                            Usar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-semibold text-slate-900 dark:text-white'>
                    Tarefas do Paciente
                  </h3>
                  <button
                    className='flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 transition-colors'
                    onClick={() => {
                      setTaskForm({ ...defaultTaskForm })
                      setShowTaskForm(true)
                    }}
                    type='button'
                  >
                    <Plus className='h-3.5 w-3.5' />
                    Nova Tarefa
                  </button>
                </div>
                <AgendaSidebar
                  onCompleteTask={handleCompleteAgendaTask}
                  onDateChange={changeAgendaDate}
                  onDeleteTask={(taskId) => deletePatientTaskMutation.mutate({ taskId })}
                  selectedDate={agendaSelectedDate}
                  tasks={agendaDisplayTasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    dueDate: t.dueDate || new Date(),
                    status: t.status,
                    priority: t.priority,
                  }))}
                />
              </div>
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                      Nova Tarefa
                    </h2>
                    <button
                      className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      onClick={() => {
                        setShowTaskForm(false)
                        setTaskForm(defaultTaskForm)
                      }}
                      type='button'
                    >
                      <X className='h-5 w-5' />
                    </button>
                  </div>

                  {/* Task Category */}
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                      Tipo
                    </label>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          taskForm.taskCategory === 'sessao'
                            ? 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                            : 'border-sky-500 bg-sky-500/10 text-sky-400'
                        }`}
                        onClick={() =>
                          setTaskForm((f) => ({
                            ...f,
                            taskCategory: 'geral',
                            type: 'custom',
                          }))
                        }
                        type='button'
                      >
                        <Target className='h-4 w-4' />
                        Tarefa
                      </button>
                      <button
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          taskForm.taskCategory === 'sessao'
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                        }`}
                        onClick={() =>
                          setTaskForm((f) => ({
                            ...f,
                            taskCategory: 'sessao',
                            type: 'session',
                            title: f.title || 'Sessão de Terapia',
                          }))
                        }
                        type='button'
                      >
                        <Users className='h-4 w-4' />
                        Sessão
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                      Título
                    </label>
                    <input
                      className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none'
                      onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={
                        taskForm.taskCategory === 'sessao'
                          ? 'Ex: Sessão de Terapia'
                          : 'Ex: Praticar respiração profunda'
                      }
                      value={taskForm.title}
                    />
                  </div>

                  {/* Session Value */}
                  {taskForm.taskCategory === 'sessao' && (
                    <div className='mb-4'>
                      <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                        <Banknote className='h-3 w-3 inline mr-1' />
                        Valor da Sessão (R$)
                      </label>
                      <input
                        className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none'
                        min='0'
                        onChange={(e) =>
                          setTaskForm((f) => ({
                            ...f,
                            sessionValue: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        placeholder='150'
                        step='10'
                        type='number'
                        value={taskForm.sessionValue ?? ''}
                      />
                    </div>
                  )}

                  {/* Priority */}
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                      Prioridade
                    </label>
                    <div className='flex gap-2'>
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            taskForm.priority === p
                              ? p === 'high'
                                ? 'border-red-500 bg-red-500/10 text-red-400'
                                : p === 'medium'
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                          }`}
                          key={p}
                          onClick={() => setTaskForm((f) => ({ ...f, priority: p }))}
                          type='button'
                        >
                          <Flag className='h-3 w-3 inline mr-1' />
                          {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className='mb-4'>
                    <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                      <Repeat className='h-3 w-3 inline mr-1' />
                      Frequência
                    </label>
                    <div className='grid grid-cols-3 gap-2'>
                      {(['once', 'daily', 'weekly'] as const).map((f) => (
                        <button
                          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            taskForm.frequency === f
                              ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                              : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                          }`}
                          key={f}
                          onClick={() => setTaskForm((prev) => ({ ...prev, frequency: f }))}
                          type='button'
                        >
                          {f === 'once' ? 'Única' : f === 'daily' ? 'Diária' : 'Semanal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Week Days */}
                  {taskForm.frequency === 'weekly' && (
                    <div className='mb-4'>
                      <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                        Dias da Semana
                      </label>
                      <div className='flex gap-1'>
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                          <button
                            className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                              taskForm.weekDays?.includes(idx)
                                ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                                : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                            }`}
                            key={idx}
                            onClick={() => {
                              setTaskForm((f) => {
                                const current = f.weekDays || []
                                const updated = current.includes(idx)
                                  ? current.filter((d) => d !== idx)
                                  : [...current, idx]
                                return { ...f, weekDays: updated }
                              })
                            }}
                            type='button'
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {taskForm.frequency === 'once' && (
                    <div className='mb-4'>
                      <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                        Data
                      </label>
                      <input
                        className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none'
                        onChange={(e) =>
                          setTaskForm((f) => ({
                            ...f,
                            dueDate: e.target.value,
                          }))
                        }
                        type='date'
                        value={taskForm.dueDate || ''}
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className='flex gap-3 mt-6'>
                    <button
                      className='flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      onClick={() => {
                        setShowTaskForm(false)
                        setTaskForm(defaultTaskForm)
                      }}
                      type='button'
                    >
                      Cancelar
                    </button>
                    <button
                      className='flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50'
                      disabled={
                        createPatientTaskMutation.isPending || createSessionTaskMutation.isPending
                      }
                      onClick={handleCreateAgendaTask}
                      type='button'
                    >
                      {createPatientTaskMutation.isPending || createSessionTaskMutation.isPending
                        ? 'Criando...'
                        : 'Criar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Modal */}
            {showAgendaAlert && (
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20'>
                      <AlertTriangle className='h-5 w-5 text-amber-500' />
                    </div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                      {agendaAlertTitle}
                    </h3>
                  </div>
                  <p className='text-sm text-slate-600 dark:text-slate-400 mb-6'>
                    {agendaAlertMessage}
                  </p>
                  <button
                    className='w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 transition-colors'
                    onClick={() => setShowAgendaAlert(false)}
                    type='button'
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prêmios */}
        {activeTab === 'rewards' && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-800 dark:text-white'>
                Prêmios do Paciente ({rewards?.length || 0})
              </h2>
            </div>
            {rewards && rewards.length > 0 ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {rewards.map((reward) => (
                  <div
                    className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'
                    key={reward.id}
                  >
                    <div className='flex items-start gap-4'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500'>
                        <Trophy className='h-6 w-6' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-slate-900 dark:text-white truncate'>
                          {reward.title}
                        </h3>
                        <p className='text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1'>
                          {reward.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>

                    <div className='mt-4 pt-4 border-t border-slate-100 dark:border-slate-800'>
                      <label className='block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                        Custo (Moedas)
                      </label>
                      <div className='flex gap-2'>
                        <input
                          className='flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none'
                          defaultValue={reward.cost}
                          id={`cost-${reward.id}`}
                          min='0'
                          type='number'
                        />
                        <button
                          className='px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50'
                          disabled={updateRewardCostMutation.isPending}
                          onClick={() => {
                            const input = document.getElementById(
                              `cost-${reward.id}`
                            ) as HTMLInputElement
                            const cost = Number.parseInt(input.value, 10)
                            if (!Number.isNaN(cost)) {
                              updateRewardCostMutation.mutate({
                                rewardId: reward.id,
                                cost,
                                patientId,
                              })
                            }
                          }}
                          type='button'
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-[#161b22] py-12'>
                <Trophy className='mb-4 h-12 w-12 text-slate-600' />
                <p className='text-slate-400'>Nenhuma recompensa cadastrada</p>
                <p className='mt-1 text-sm text-slate-500'>
                  As recompensas que o paciente adicionar aparecerão aqui para precificação
                </p>
              </div>
            )}
          </div>
        )}

        {/* Conceituação TCC (moved from before journal) */}
        {activeTab === 'tcc' && (
          <div className='space-y-6'>
            {conceptualization ? (
              <>
                {/* Header da Conceituação */}
                <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                  <div className='flex items-center justify-between'>
                    <h2 className='flex items-center gap-2 text-lg font-semibold text-white'>
                      <Brain className='h-5 w-5 text-purple-400' />
                      Conceituação Cognitiva
                    </h2>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm text-slate-400'>
                        {conceptualization?.name || 'Diagrama D. Hernandes'}
                      </span>
                      <button
                        className='flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors'
                        onClick={() => setShowCognitiveWizard(true)}
                        type='button'
                      >
                        <Sparkles className='h-4 w-4' />
                        Refazer com IA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dados de Infância */}
                {conceptualization?.childhoodData && (
                  <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <h3 className='mb-3 text-sm font-medium uppercase text-slate-500 dark:text-slate-400'>
                      Dados Relevantes de Infância
                    </h3>
                    <p className='text-sm text-slate-700 dark:text-slate-300'>
                      {conceptualization.childhoodData}
                    </p>
                  </div>
                )}

                {/* Crença Central */}
                {conceptualization?.coreBelief && (
                  <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white'>
                      <Brain className='h-5 w-5 text-purple-500' />
                      Crença Central
                    </h2>
                    <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-900'>
                      <p className='text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap'>
                        {conceptualization.coreBelief}
                      </p>
                    </div>
                  </div>
                )}

                {/* Suposições Condicionais */}
                {conceptualization?.conditionalAssumptions && (
                  <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white'>
                      <Scale className='h-5 w-5 text-amber-500' />
                      Suposições Condicionais (Regras)
                    </h2>
                    <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-900'>
                      <p className='text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap'>
                        {conceptualization.conditionalAssumptions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estratégias Compensatórias */}
                {conceptualization?.compensatoryStrategies && (
                  <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white'>
                      <Activity className='h-5 w-5 text-sky-500' />
                      Estratégias Compensatórias
                    </h2>
                    <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-900'>
                      <p className='text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap'>
                        {conceptualization.compensatoryStrategies}
                      </p>
                    </div>
                  </div>
                )}

                {/* Situações */}
                {conceptualization?.situations && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                      <Scale className='h-5 w-5 text-amber-400' />
                      Situações Clínicas
                    </h2>
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-slate-700'>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>
                              Situação
                            </th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>
                              Pensamento Automático
                            </th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>
                              Emoção
                            </th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>
                              Comportamento
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-700'>
                          {(() => {
                            try {
                              const situations = JSON.parse(conceptualization.situations as string)
                              return situations.map(
                                (
                                  sit: {
                                    situation?: string
                                    automaticThought?: string
                                    emotion?: string
                                    behavior?: string
                                  },
                                  idx: number
                                ) => (
                                  <tr key={idx}>
                                    <td className='py-3 text-sm text-slate-300'>
                                      {sit.situation || '-'}
                                    </td>
                                    <td className='py-3 text-sm text-slate-300'>
                                      {sit.automaticThought || '-'}
                                    </td>
                                    <td className='py-3 text-sm text-slate-300'>
                                      {sit.emotion ? translateEmotionWithEmoji(sit.emotion) : '-'}
                                    </td>
                                    <td className='py-3 text-sm text-slate-300'>
                                      {sit.behavior || '-'}
                                    </td>
                                  </tr>
                                )
                              )
                            } catch {
                              return (
                                <tr>
                                  <td className='py-3 text-sm text-slate-400' colSpan={4}>
                                    Nenhuma situação registrada
                                  </td>
                                </tr>
                              )
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-[#161b22] py-12'>
                <Brain className='mb-4 h-12 w-12 text-slate-600' />
                <p className='text-slate-400'>Nenhuma conceituação cognitiva cadastrada</p>
                <p className='mt-1 mb-6 text-sm text-slate-500'>
                  Use a IA para analisar os dados do paciente e criar uma conceituação
                </p>
                <button
                  className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 font-medium text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/25'
                  onClick={() => setShowCognitiveWizard(true)}
                  type='button'
                >
                  <Sparkles className='h-5 w-5' />
                  Começar Conceituação Cognitiva
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cognitive Conceptualization Wizard Modal */}
        <CognitiveConceptualizationWizard
          isOpen={showCognitiveWizard}
          onClose={() => setShowCognitiveWizard(false)}
          onComplete={() => {
            utils.therapistReports.getCognitiveConceptualization.invalidate()
          }}
          patientId={patientId}
          patientName={patient?.name || 'Paciente'}
        />

        {/* Diário e Registros (Journal Entries) */}
        {activeTab === 'journal' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-800 dark:text-white'>
                Diário e Registros ({journalEntries?.length || 0})
              </h2>
            </div>
            {journalEntries && journalEntries.length > 0 ? (
              <div className='space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
                {journalEntries.map((entry) => (
                  <div
                    className={`group rounded-xl border border-slate-200 bg-white p-5 transition-all dark:border-slate-800 dark:bg-slate-800/50 ${
                      entry.isRead
                        ? 'hover:border-sky-300 dark:hover:border-slate-700'
                        : 'border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)] dark:border-sky-500/30'
                    }`}
                    key={entry.id}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex flex-1 items-start gap-4'>
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                            entry.isRead
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                              : 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                          }`}
                        >
                          <BookOpen className='h-6 w-6' />
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <h3 className='font-semibold text-slate-900 dark:text-white'>
                                Registro de Pensamento
                              </h3>
                              {!entry.isRead && (
                                <span className='rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/30'>
                                  Novo
                                </span>
                              )}
                              {entry.mood && (
                                <span className='rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700 flex items-center gap-1'>
                                  <Heart className='h-2.5 w-2.5' /> {translateMood(entry.mood)}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2 text-xs text-slate-500'>
                              <Clock className='h-3.5 w-3.5' />
                              {formatDate(entry.createdAt)}
                            </div>
                          </div>

                          <div className='mt-3 space-y-3'>
                            <div className='rounded-lg bg-slate-50 p-4 border border-slate-200 dark:border-slate-800/50 dark:bg-slate-900/50'>
                              <p className='text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed'>
                                {entry.content}
                              </p>
                            </div>

                            {entry.aiAnalysis && (
                              <div className='rounded-lg bg-purple-50 p-4 border border-purple-100 dark:bg-purple-500/5 dark:border-purple-500/10'>
                                <p className='text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1'>
                                  <Brain className='h-3 w-3' /> Análise da IA
                                </p>
                                <p className='text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed'>
                                  {entry.aiAnalysis}
                                </p>
                              </div>
                            )}

                            <div className='pt-2 border-t border-slate-800 mt-4 flex flex-col gap-4'>
                              {entry.isRead ? (
                                <FeedbackSection
                                  entryId={entry.id}
                                  existingFeedback={entry.therapistFeedback as string | null}
                                />
                              ) : (
                                <div className='flex justify-center'>
                                  <button
                                    className='flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-sky-600 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-500/20'
                                    disabled={markAsReadMutation.isPending}
                                    onClick={() =>
                                      markAsReadMutation.mutate({
                                        id: entry.id,
                                      })
                                    }
                                    type='button'
                                  >
                                    <Eye className='h-4 w-4' />
                                    {markAsReadMutation.isPending
                                      ? 'Confirmando...'
                                      : 'Marcar como Lido'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-[#161b22] py-12'>
                <BookOpen className='mb-4 h-12 w-12 text-slate-600' />
                <p className='text-slate-400'>Nenhum registro encontrado</p>
                <p className='mt-1 text-sm text-slate-500'>
                  Os registros de pensamento do paciente aparecerão aqui
                </p>
              </div>
            )}
          </div>
        )}

        {/* Documentos */}
        {activeTab === 'documents' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-white'>
                Documentos ({sessionDocuments?.length || 0})
              </h2>
            </div>
            {sessionDocuments && sessionDocuments.length > 0 ? (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {sessionDocuments.map((doc) => (
                  <div
                    className='group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-sky-500/50 shadow-sm'
                    key={doc.id}
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20'>
                      {getFileIcon((doc.fileType || 'unknown') as string)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='truncate text-sm font-medium text-slate-900 dark:text-white'>
                        {doc.fileName}
                      </p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        {formatDate((doc.createdAt || new Date()) as string | Date)}
                        {doc.sessionDate && ` • ${formatDate(doc.sessionDate as string | Date)}`}
                      </p>
                    </div>
                    <button
                      className='flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-sky-500 hover:text-white dark:bg-slate-700/50 dark:text-slate-400'
                      onClick={(e) => e.preventDefault()}
                      type='button'
                    >
                      <Download className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-[#161b22] py-12'>
                <FileText className='mb-4 h-12 w-12 text-slate-600' />
                <p className='text-slate-400'>Nenhum documento encontrado</p>
                <p className='mt-1 text-sm text-slate-500'>
                  Documentos uploadados serão exibidos aqui
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sessões (Transcrições) */}
        {activeTab === 'session' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-slate-800 dark:text-white'>
                Sessões ({sessionTranscriptions?.length || 0})
              </h2>
              <button
                className='flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600'
                onClick={() => setShowUploadModal(true)}
                type='button'
              >
                <Plus className='h-4 w-4' />
                Nova Sessão
              </button>
            </div>

            {isTranscriptionsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-sky-500' />
              </div>
            ) : sessionTranscriptions && sessionTranscriptions.length > 0 ? (
              <div className='space-y-4'>
                {sessionTranscriptions.map((transcription) => (
                  <div
                    className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'
                    key={transcription.id}
                  >
                    <div className='flex items-start gap-4'>
                      <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500'>
                        <FileAudio className='h-6 w-6' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-3'>
                          <h3 className='font-semibold text-slate-900 dark:text-white truncate'>
                            {transcription.originalFilename}
                          </h3>
                          {getStatusBadge(transcription.status)}
                        </div>
                        <div className='mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatDate(transcription.createdAt)}
                          </span>
                          {transcription.language && (
                            <span className='rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-700'>
                              {transcription.language}
                            </span>
                          )}
                        </div>

                        {transcription.status === 'completed' &&
                          transcription.segments &&
                          transcription.segments.length > 0 && (
                            <div className='mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50'>
                              <p className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2'>
                                Transcrição
                              </p>
                              <div className='space-y-2'>
                                {transcription.segments.map((segment, idx) => (
                                  <div
                                    className={`rounded-lg p-3 ${
                                      segment.isTherapist
                                        ? 'bg-sky-500/10 border-l-2 border-sky-500'
                                        : 'bg-purple-500/10 border-l-2 border-purple-500'
                                    }`}
                                    key={idx}
                                  >
                                    <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-1'>
                                      {segment.isTherapist ? 'Terapeuta' : 'Paciente'}
                                    </p>
                                    <p className='text-sm text-slate-700 dark:text-slate-300'>
                                      {segment.text}
                                    </p>
                                    {segment.emotion && (
                                      <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                        {translateEmotionWithEmoji(segment.emotion)}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {transcription.status === 'processing' && (
                          <div className='mt-4 flex items-center gap-2 text-sm text-sky-500'>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            <span>A transcrição está sendo processada...</span>
                          </div>
                        )}

                        {transcription.status === 'queued' && (
                          <div className='mt-4 flex items-center gap-2 text-sm text-amber-500'>
                            <Clock className='h-4 w-4' />
                            <span>Aguardando processamento...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 dark:border-slate-700 dark:bg-[#161b22]'>
                <Mic className='mb-4 h-12 w-12 text-slate-400 dark:text-slate-600' />
                <p className='text-slate-600 dark:text-slate-400'>Nenhuma sessão gravada</p>
                <p className='mt-1 text-sm text-slate-500'>
                  Faça upload de áudios ou vídeos de sessões para transcrição automática
                </p>
                <button
                  className='mt-4 flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600'
                  onClick={() => setShowUploadModal(true)}
                  type='button'
                >
                  <Upload className='h-4 w-4' />
                  Enviar primeira sessão
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                Enviar Sessão
              </h2>
              <button
                className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 disabled:opacity-50'
                disabled={isUploading}
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                type='button'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Dropzone ou Progress */}
            {isUploading ? (
              <div className='space-y-4 py-8'>
                <div className='flex items-center justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-sky-500/20'>
                    <Loader2 className='h-8 w-8 animate-spin text-sky-500' />
                  </div>
                </div>
                <div className='text-center'>
                  <p className='font-medium text-slate-900 dark:text-white'>Enviando arquivo...</p>
                  <p className='text-sm text-slate-500 mt-1'>{selectedFile?.name}</p>
                </div>
                <div className='space-y-2'>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                    <div
                      className='h-full bg-sky-500 transition-all duration-300'
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className='text-center text-sm text-slate-500'>{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-500/10'
                    : selectedFile
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-300 hover:border-sky-400 dark:border-slate-700 dark:hover:border-sky-500'
                }`}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  accept='audio/*,video/*'
                  className='hidden'
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  type='file'
                />

                {selectedFile ? (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-center'>
                      <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500'>
                        <FileAudio className='h-7 w-7' />
                      </div>
                    </div>
                    <div>
                      <p className='font-medium text-slate-900 dark:text-white truncate'>
                        {selectedFile.name}
                      </p>
                      <p className='text-sm text-slate-500'>{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      className='text-sm text-sky-500 hover:text-sky-600'
                      onClick={() => fileInputRef.current?.click()}
                      type='button'
                    >
                      Trocar arquivo
                    </button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-center'>
                      <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800'>
                        <Upload className='h-7 w-7' />
                      </div>
                    </div>
                    <div>
                      <p className='font-medium text-slate-700 dark:text-slate-300'>
                        Arraste um arquivo ou{' '}
                        <button
                          className='text-sky-500 hover:text-sky-600'
                          onClick={() => fileInputRef.current?.click()}
                          type='button'
                        >
                          clique para selecionar
                        </button>
                      </p>
                      <p className='mt-1 text-sm text-slate-500'>
                        Formatos aceitos: áudio (MP3, WAV, M4A) ou vídeo (MP4, MOV)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botões */}
            <div className='mt-6 flex gap-3'>
              <button
                className='flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={isUploading}
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                type='button'
              >
                {isUploading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4' />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Upload em Background - Flutuante */}
    </div>
  )
}
