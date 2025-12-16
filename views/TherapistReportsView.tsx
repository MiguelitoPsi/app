'use client'

import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Key,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Save,
  Settings,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  User,
  UserCircle,
  X,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { useSelectedPatient } from '@/context/SelectedPatientContext'
import { useTherapistGame } from '@/context/TherapistGameContext'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import {
  type CognitiveConceptualizationInput,
  generateTherapeuticPlan,
} from '@/services/geminiService'

type ReportSection = 'documents' | 'cognitive' | 'therapeutic'

type SituationData = {
  situation: string
  automaticThought: string
  meaningOfAT: string
  emotion: string
  behavior: string
}

type CognitiveFormData = {
  name: string
  date: string
  childhoodData: string
  coreBelief: string
  conditionalAssumptions: string
  compensatoryStrategies: string
  situation1: SituationData
  situation2: SituationData
  situation3: SituationData
  notes: string
}

const emptySituation: SituationData = {
  situation: '',
  automaticThought: '',
  meaningOfAT: '',
  emotion: '',
  behavior: '',
}

const initialFormData: CognitiveFormData = {
  name: '',
  date: '',
  childhoodData: '',
  coreBelief: '',
  conditionalAssumptions: '',
  compensatoryStrategies: '',
  situation1: { ...emptySituation },
  situation2: { ...emptySituation },
  situation3: { ...emptySituation },
  notes: '',
}

export default function TherapistReportsView(): React.ReactElement {
  const { theme, toggleTheme } = useTherapistGame()

  const { selectedPatientId, setSelectedPatientId } = useSelectedPatient()
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
  const [showPatientList, setShowPatientList] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activeSection, setActiveSection] = useState<ReportSection>('documents')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadSessionDate, setUploadSessionDate] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cognitive Conceptualization state
  const [isEditingCognitive, setIsEditingCognitive] = useState(false)
  const [cognitiveForm, setCognitiveForm] = useState<CognitiveFormData>(initialFormData)
  const [isSavingCognitive, setIsSavingCognitive] = useState(false)
  const [isApprovingCognitive, setIsApprovingCognitive] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [activeSituation, setActiveSituation] = useState<1 | 2 | 3>(1)

  // Therapeutic Plan state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: patients } = trpc.patient.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: documents, isLoading: isLoadingDocuments } =
    trpc.therapistReports.getPatientDocuments.useQuery(
      { patientId: selectedPatientId ?? '', limit: 20 },
      {
        enabled: Boolean(selectedPatientId) && activeSection === 'documents',
        staleTime: 2 * 60 * 1000,
      }
    )

  // Cognitive Conceptualization data
  const { data: cognitiveData, isLoading: isLoadingCognitive } =
    trpc.therapistReports.getCognitiveConceptualization.useQuery(
      { patientId: selectedPatientId ?? '' },
      {
        enabled: Boolean(selectedPatientId) && activeSection === 'cognitive',
        staleTime: 2 * 60 * 1000,
      }
    )

  const saveCognitiveMutation = trpc.therapistReports.saveCognitiveConceptualization.useMutation({
    onSuccess: () => {
      utils.therapistReports.getCognitiveConceptualization.invalidate()
      setIsEditingCognitive(false)
      setIsSavingCognitive(false)
    },
    onError: () => {
      setIsSavingCognitive(false)
    },
  })

  const deleteCognitiveMutation =
    trpc.therapistReports.deleteCognitiveConceptualization.useMutation({
      onSuccess: () => {
        utils.therapistReports.getCognitiveConceptualization.invalidate()
        setCognitiveForm(initialFormData)
      },
    })

  const approveCognitiveMutation =
    trpc.therapistReports.approveCognitiveConceptualization.useMutation({
      onSuccess: () => {
        utils.therapistReports.getCognitiveConceptualization.invalidate()
        setIsApprovingCognitive(false)
      },
      onError: (error) => {
        setIsApprovingCognitive(false)
        alert(error.message)
      },
    })

  const saveTherapeuticPlanMutation = trpc.therapistReports.saveTherapeuticPlan.useMutation({
    onSuccess: () => {
      utils.therapistReports.getCognitiveConceptualization.invalidate()
      setIsGeneratingPlan(false)
      setGenerationError(null)
      // Switch to therapeutic plan tab to show the result
      setActiveSection('therapeutic')
    },
    onError: (error) => {
      setIsGeneratingPlan(false)
      setGenerationError(error.message)
    },
  })

  // Load cognitive data into form when data changes
  useEffect(() => {
    if (cognitiveData) {
      setCognitiveForm({
        name: cognitiveData.name ?? '',
        date: cognitiveData.date ? new Date(cognitiveData.date).toISOString().split('T')[0] : '',
        childhoodData: cognitiveData.childhoodData ?? '',
        coreBelief: cognitiveData.coreBelief ?? '',
        conditionalAssumptions: cognitiveData.conditionalAssumptions ?? '',
        compensatoryStrategies: cognitiveData.compensatoryStrategies ?? '',
        situation1: cognitiveData.situations?.situation1 ?? {
          ...emptySituation,
        },
        situation2: cognitiveData.situations?.situation2 ?? {
          ...emptySituation,
        },
        situation3: cognitiveData.situations?.situation3 ?? {
          ...emptySituation,
        },
        notes: cognitiveData.notes ?? '',
      })
    } else {
      setCognitiveForm(initialFormData)
    }
  }, [cognitiveData])

  const handleSaveCognitive = () => {
    if (!selectedPatientId) return
    setIsSavingCognitive(true)

    saveCognitiveMutation.mutate({
      patientId: selectedPatientId,
      name: cognitiveForm.name || undefined,
      date: cognitiveForm.date ? new Date(cognitiveForm.date) : undefined,
      childhoodData: cognitiveForm.childhoodData || undefined,
      coreBelief: cognitiveForm.coreBelief || undefined,
      conditionalAssumptions: cognitiveForm.conditionalAssumptions || undefined,
      compensatoryStrategies: cognitiveForm.compensatoryStrategies || undefined,
      situations: {
        situation1: cognitiveForm.situation1.situation ? cognitiveForm.situation1 : undefined,
        situation2: cognitiveForm.situation2.situation ? cognitiveForm.situation2 : undefined,
        situation3: cognitiveForm.situation3.situation ? cognitiveForm.situation3 : undefined,
      },
      notes: cognitiveForm.notes || undefined,
    })
  }

  const handleDeleteCognitive = () => {
    if (!selectedPatientId) return
    if (confirm('Tem certeza que deseja excluir esta conceituação cognitiva?')) {
      deleteCognitiveMutation.mutate({ patientId: selectedPatientId })
    }
  }

  const handleOpenApprovalModal = () => {
    if (!(selectedPatientId && cognitiveData)) return

    // Validate required data
    const hasCoreBelief = Boolean(cognitiveData.coreBelief)
    const hasChildhoodData = Boolean(cognitiveData.childhoodData)
    const hasRequiredData = hasCoreBelief || hasChildhoodData
    if (!hasRequiredData) {
      setGenerationError(
        'A conceituação precisa ter pelo menos a crença central ou dados de infância preenchidos.'
      )
      return
    }

    setShowApprovalModal(true)
  }

  const handleApproveAndGeneratePlan = async () => {
    if (!(selectedPatientId && cognitiveData)) return

    setShowApprovalModal(false)
    setIsApprovingCognitive(true)
    setIsGeneratingPlan(true)
    setGenerationError(null)

    try {
      // First approve the cognitive conceptualization
      await approveCognitiveMutation.mutateAsync({
        patientId: selectedPatientId,
      })

      // Get patient name
      const patient = patients?.find((p) => p.id === selectedPatientId)

      const input: CognitiveConceptualizationInput = {
        patientName: patient?.name || cognitiveData.name || undefined,
        childhoodData: cognitiveData.childhoodData || undefined,
        coreBelief: cognitiveData.coreBelief || undefined,
        conditionalAssumptions: cognitiveData.conditionalAssumptions || undefined,
        compensatoryStrategies: cognitiveData.compensatoryStrategies || undefined,
        situations: cognitiveData.situations || undefined,
        notes: cognitiveData.notes || undefined,
      }

      const plan = await generateTherapeuticPlan(input)

      // Save the generated plan
      saveTherapeuticPlanMutation.mutate({
        patientId: selectedPatientId,
        therapeuticPlan: plan,
      })
    } catch (error) {
      setIsGeneratingPlan(false)
      setIsApprovingCognitive(false)
      setGenerationError(
        error instanceof Error ? error.message : 'Erro ao aprovar e gerar plano terapêutico.'
      )
    }
  }

  // Function to regenerate the therapeutic plan (for already approved conceptualizations)
  const handleGenerateTherapeuticPlan = async () => {
    if (!(selectedPatientId && cognitiveData)) return

    setIsGeneratingPlan(true)
    setGenerationError(null)

    try {
      const patient = patients?.find((p) => p.id === selectedPatientId)

      const input: CognitiveConceptualizationInput = {
        patientName: patient?.name || cognitiveData.name || undefined,
        childhoodData: cognitiveData.childhoodData || undefined,
        coreBelief: cognitiveData.coreBelief || undefined,
        conditionalAssumptions: cognitiveData.conditionalAssumptions || undefined,
        compensatoryStrategies: cognitiveData.compensatoryStrategies || undefined,
        situations: cognitiveData.situations || undefined,
        notes: cognitiveData.notes || undefined,
      }

      const plan = await generateTherapeuticPlan(input)

      saveTherapeuticPlanMutation.mutate({
        patientId: selectedPatientId,
        therapeuticPlan: plan,
      })
    } catch (error) {
      setIsGeneratingPlan(false)
      setGenerationError(
        error instanceof Error ? error.message : 'Erro ao gerar plano terapêutico.'
      )
    }
  }

  const updateSituation = (
    situationKey: 'situation1' | 'situation2' | 'situation3',
    field: keyof SituationData,
    value: string
  ) => {
    setCognitiveForm((prev) => ({
      ...prev,
      [situationKey]: {
        ...prev[situationKey],
        [field]: value,
      },
    }))
  }

  const uploadMutation = trpc.therapistReports.uploadSessionDocument.useMutation({
    onSuccess: () => {
      utils.therapistReports.getPatientDocuments.invalidate()
      setShowUploadModal(false)
      setUploadDescription('')
      setUploadSessionDate('')
      setIsUploading(false)
    },
    onError: () => {
      setIsUploading(false)
    },
  })

  const deleteMutation = trpc.therapistReports.deleteDocument.useMutation({
    onSuccess: () => {
      utils.therapistReports.getPatientDocuments.invalidate()
    },
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedPatientId) return

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (!allowedTypes.includes(file.type)) {
      alert(
        'Tipo de arquivo não suportado. Use PDF, imagens, Word, Excel, PowerPoint ou texto simples.'
      )
      return
    }

    // Validar tamanho (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB.')
      return
    }

    setIsUploading(true)

    // Converter arquivo para Base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      let fileType:
        | 'pdf'
        | 'image'
        | 'document'
        | 'spreadsheet'
        | 'presentation'
        | 'text'
        | 'other' = 'other'

      if (file.type === 'application/pdf') {
        fileType = 'pdf'
      } else if (file.type.startsWith('image/')) {
        fileType = 'image'
      } else if (
        file.type.includes('word') ||
        file.type.includes('document') ||
        file.type === 'application/msword'
      ) {
        fileType = 'document'
      } else if (
        file.type.includes('excel') ||
        file.type.includes('spreadsheet') ||
        file.type === 'application/vnd.ms-excel'
      ) {
        fileType = 'spreadsheet'
      } else if (
        file.type.includes('powerpoint') ||
        file.type.includes('presentation') ||
        file.type === 'application/vnd.ms-powerpoint'
      ) {
        fileType = 'presentation'
      } else if (file.type === 'text/plain') {
        fileType = 'text'
      }

      uploadMutation.mutate({
        patientId: selectedPatientId,
        fileName: file.name,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        fileData: base64,
        description: uploadDescription || undefined,
        sessionDate: uploadSessionDate ? new Date(uploadSessionDate) : undefined,
      })
    }
    reader.onerror = () => {
      setIsUploading(false)
      alert('Erro ao ler o arquivo.')
    }
    reader.readAsDataURL(file)

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      deleteMutation.mutate({ documentId })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId)

  const formatDate = (date: Date | string): string =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

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
    <div className='h-full overflow-y-auto px-4 py-6 pb-28 pt-safe sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8'>
      {/* Header */}
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h2 className='font-bold text-slate-800 text-xl dark:text-white'>Relatórios</h2>
          <p className='text-slate-500 text-xs dark:text-slate-400'>
            Documentos e conceituação do paciente
          </p>
        </div>
        <button
          aria-label='Configurações'
          className='touch-target group rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-all active:scale-95 hover:bg-slate-200 sm:rounded-2xl sm:p-3 lg:hidden dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          onClick={() => setShowSettings(true)}
          type='button'
        >
          <Settings className='h-5 w-5 sm:h-6 sm:w-6' />
        </button>
      </div>

      {/* Patient Selector */}
      <div className='relative mb-6'>
        <p className='mb-1.5 ml-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider dark:text-slate-500'>
          Paciente Selecionado
        </p>
        <button
          className='flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 sm:rounded-2xl sm:p-4 lg:max-w-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
          onClick={() => setShowPatientList(!showPatientList)}
          type='button'
        >
          <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 font-semibold text-white sm:h-10 sm:w-10'>
              {selectedPatient ? (
                <span className='font-semibold text-xs sm:text-sm'>
                  {selectedPatient.name?.charAt(0) ?? 'P'}
                </span>
              ) : (
                <User className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
              )}
            </div>
            <span className='truncate font-medium text-slate-700 text-sm sm:text-base dark:text-slate-200'>
              {selectedPatient?.name ?? 'Selecione um paciente'}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform sm:h-5 sm:w-5 ${
              showPatientList ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showPatientList && (
          <div className='absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl bg-white shadow-xl lg:max-w-md dark:bg-slate-800'>
            {patients?.map((patient) => (
              <button
                className={`flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  selectedPatientId === patient.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                }`}
                key={patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id)
                  setShowPatientList(false)
                }}
                type='button'
              >
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 font-semibold text-white'>
                  {patient.name?.charAt(0) ?? 'P'}
                </div>
                <div>
                  <p className='font-medium text-slate-800 dark:text-slate-200'>{patient.name}</p>
                  <p className='text-slate-500 text-sm'>{patient.email}</p>
                </div>
                {selectedPatientId === patient.id && (
                  <CheckCircle2 className='ml-auto h-5 w-5 text-violet-500' />
                )}
              </button>
            ))}
            {(!patients || patients.length === 0) && (
              <div className='p-8 text-center'>
                <User className='mx-auto mb-3 h-12 w-12 text-slate-300' />
                <p className='text-slate-500'>Nenhum paciente encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='mx-auto max-w-7xl'>
        {selectedPatientId ? (
          <div className='space-y-4 lg:space-y-6'>
            {/* Navigation Tabs - Mobile: cards coloridos, Desktop: tabs horizontais */}
            {/* Mobile tabs */}
            <div className='grid grid-cols-3 gap-2 sm:gap-3 lg:hidden'>
              <button
                className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 sm:aspect-square sm:rounded-2xl sm:p-4 ${
                  activeSection === 'documents'
                    ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900'
                    : 'hover:scale-[1.02]'
                }`}
                onClick={() => setActiveSection('documents')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-1 py-2 text-white sm:gap-2 sm:py-0'>
                  <FileText className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='font-semibold text-[9px] sm:text-xs'>Documentos</span>
                </div>
              </button>
              <button
                className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 sm:aspect-square sm:rounded-2xl sm:p-4 ${
                  activeSection === 'cognitive'
                    ? 'ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900'
                    : 'hover:scale-[1.02]'
                }`}
                onClick={() => setActiveSection('cognitive')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-1 py-2 text-white sm:gap-2 sm:py-0'>
                  <Brain className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='truncate font-semibold text-[8px] sm:text-xs'>Conceituação</span>
                </div>
              </button>
              <button
                className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 sm:aspect-square sm:rounded-2xl sm:p-4 ${
                  activeSection === 'therapeutic'
                    ? 'ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900'
                    : 'hover:scale-[1.02]'
                }`}
                onClick={() => setActiveSection('therapeutic')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-violet-400 to-violet-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-1 py-2 text-white sm:gap-2 sm:py-0'>
                  <Target className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='font-semibold text-[9px] sm:text-xs'>Plano</span>
                </div>
              </button>
            </div>

            {/* Desktop tabs */}
            <div className='hidden lg:flex lg:gap-2 lg:rounded-xl lg:bg-white lg:p-1.5 lg:shadow-sm dark:lg:bg-slate-800'>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                  activeSection === 'documents'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                onClick={() => setActiveSection('documents')}
                type='button'
              >
                <FileText className='h-5 w-5' />
                <span>Documentos</span>
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                  activeSection === 'cognitive'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                onClick={() => setActiveSection('cognitive')}
                type='button'
              >
                <Brain className='h-5 w-5' />
                <span>Conceituação Cognitiva</span>
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                  activeSection === 'therapeutic'
                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                onClick={() => setActiveSection('therapeutic')}
                type='button'
              >
                <Target className='h-5 w-5' />
                <span>Plano Terapêutico</span>
              </button>
            </div>

            {/* Documents Section */}
            {activeSection === 'documents' && (
              <>
                {/* Upload Button */}
                <button
                  className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-300 border-dashed bg-purple-50 p-4 text-purple-600 transition-colors hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30'
                  onClick={() => setShowUploadModal(true)}
                  type='button'
                >
                  <Plus className='h-5 w-5' />
                  <span className='font-medium'>Adicionar Documento</span>
                </button>

                {/* Documents List */}
                {isLoadingDocuments ? (
                  <div className='flex h-40 items-center justify-center'>
                    <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600' />
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className='space-y-3'>
                    {documents.map((doc) => (
                      <div
                        className='flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900'
                        key={doc.id}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            doc.fileType === 'pdf'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : doc.fileType === 'image'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : doc.fileType === 'spreadsheet'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : doc.fileType === 'document'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : doc.fileType === 'presentation'
                                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {doc.fileType === 'pdf' ? (
                            <FileText className='h-6 w-6' />
                          ) : doc.fileType === 'image' ? (
                            <FileImage className='h-6 w-6' />
                          ) : doc.fileType === 'spreadsheet' ? (
                            <FileSpreadsheet className='h-6 w-6' />
                          ) : doc.fileType === 'document' ? (
                            <FileText className='h-6 w-6' />
                          ) : doc.fileType === 'presentation' ? (
                            <FileText className='h-6 w-6' />
                          ) : (
                            <File className='h-6 w-6' />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium text-slate-800 dark:text-slate-200'>
                            {doc.fileName}
                          </p>
                          <div className='flex flex-wrap items-center gap-2 text-slate-500 text-sm'>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            {doc.sessionDate && (
                              <>
                                <span>•</span>
                                <span>Sessão: {formatDate(doc.sessionDate)}</span>
                              </>
                            )}
                          </div>
                          {doc.description && (
                            <p className='mt-1 line-clamp-2 text-slate-600 text-sm dark:text-slate-400'>
                              {doc.description}
                            </p>
                          )}
                        </div>
                        <button
                          className='p-2 text-slate-400 transition-colors hover:text-red-500'
                          onClick={() => handleDeleteDocument(doc.id)}
                          title='Excluir documento'
                          type='button'
                        >
                          <Trash2 className='h-5 w-5' />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex h-40 flex-col items-center justify-center'>
                    <FileText className='mb-3 h-12 w-12 text-slate-300' />
                    <p className='text-slate-500'>Nenhum documento adicionado</p>
                    <p className='mt-1 text-slate-400 text-sm'>
                      Adicione PDFs ou imagens dos relatórios de sessão
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Cognitive Conceptualization Section */}
            {activeSection === 'cognitive' && (
              <div className='space-y-4'>
                {/* Header with actions */}
                <div className='space-y-3'>
                  <h3 className='font-semibold text-base text-slate-800 dark:text-slate-200 sm:text-lg'>
                    Diagrama de Conceituação Cognitiva
                  </h3>
                  <div className='grid w-full grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center'>
                    {isEditingCognitive ? (
                      <>
                        <button
                          className='flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-600 text-sm transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                          onClick={() => {
                            setIsEditingCognitive(false)
                            // Reset form to original data
                            if (cognitiveData) {
                              setCognitiveForm({
                                name: cognitiveData.name ?? '',
                                date: cognitiveData.date
                                  ? new Date(cognitiveData.date).toISOString().split('T')[0]
                                  : '',
                                childhoodData: cognitiveData.childhoodData ?? '',
                                coreBelief: cognitiveData.coreBelief ?? '',
                                conditionalAssumptions: cognitiveData.conditionalAssumptions ?? '',
                                compensatoryStrategies: cognitiveData.compensatoryStrategies ?? '',
                                situation1: cognitiveData.situations?.situation1 ?? {
                                  ...emptySituation,
                                },
                                situation2: cognitiveData.situations?.situation2 ?? {
                                  ...emptySituation,
                                },
                                situation3: cognitiveData.situations?.situation3 ?? {
                                  ...emptySituation,
                                },
                                notes: cognitiveData.notes ?? '',
                              })
                            } else {
                              setCognitiveForm(initialFormData)
                            }
                          }}
                          type='button'
                        >
                          <X className='h-4 w-4' />
                          Cancelar
                        </button>
                        <button
                          className='flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-rose-600 disabled:opacity-50'
                          disabled={isSavingCognitive}
                          onClick={handleSaveCognitive}
                          type='button'
                        >
                          <Save className='h-4 w-4' />
                          {isSavingCognitive ? 'Salvando...' : 'Salvar'}
                        </button>
                      </>
                    ) : (
                      <>
                        {cognitiveData && (
                          <button
                            className='flex h-9 items-center justify-center rounded-lg bg-red-100 font-medium text-red-600 text-sm transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 sm:w-9'
                            onClick={handleDeleteCognitive}
                            title='Excluir'
                            type='button'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        )}
                        {cognitiveData && !cognitiveData.isApproved && (
                          <button
                            className='flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 font-medium text-white text-[10px] transition-colors hover:bg-emerald-600 disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm'
                            disabled={isApprovingCognitive || isGeneratingPlan}
                            onClick={handleOpenApprovalModal}
                            title='Aprovar conceituação e gerar plano terapêutico'
                            type='button'
                          >
                            {isApprovingCognitive || isGeneratingPlan ? (
                              <>
                                <Loader2 className='h-3 w-3 flex-shrink-0 animate-spin sm:h-4 sm:w-4' />
                                <span className='truncate'>Processando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className='h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4' />
                                <span className='truncate'>Aprovar e Criar Plano</span>
                              </>
                            )}
                          </button>
                        )}
                        {cognitiveData?.isApproved && (
                          <span className='flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-100 px-2 font-medium text-emerald-700 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm'>
                            <CheckCircle2 className='h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4' />
                            <span className='truncate'>Aprovado</span>
                          </span>
                        )}
                        <button
                          className='flex h-9 items-center justify-center rounded-lg bg-rose-500 font-medium text-white text-sm transition-colors hover:bg-rose-600 sm:gap-1.5 sm:px-3 sm:py-2'
                          onClick={() => setIsEditingCognitive(true)}
                          title={cognitiveData ? 'Editar' : 'Criar'}
                          type='button'
                        >
                          <Edit3 className='h-4 w-4' />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Error message for plan generation */}
                {generationError && (
                  <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                    <p className='text-red-700 text-sm dark:text-red-400'>{generationError}</p>
                  </div>
                )}

                {isLoadingCognitive ? (
                  <div className='flex h-40 items-center justify-center'>
                    <div className='h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600' />
                  </div>
                ) : (
                  /* Cognitive Conceptualization Diagram */
                  <div className='overflow-x-auto rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-6'>
                    {/* Title and Header */}
                    <div className='mb-6 text-center'>
                      <h2 className='mb-4 font-bold text-lg text-slate-800 dark:text-slate-200 sm:text-xl'>
                        DIAGRAMA DE CONCEITUAÇÃO COGNITIVA
                      </h2>
                      <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
                        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2'>
                          <span className='text-slate-600 text-sm dark:text-slate-400'>NOME:</span>
                          {isEditingCognitive ? (
                            <input
                              className='rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800'
                              onChange={(e) =>
                                setCognitiveForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              placeholder={selectedPatient?.name ?? 'Nome do paciente'}
                              type='text'
                              value={cognitiveForm.name}
                            />
                          ) : (
                            <span className='font-medium text-slate-800 dark:text-slate-200'>
                              {cognitiveForm.name || selectedPatient?.name || '-'}
                            </span>
                          )}
                        </div>
                        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2'>
                          <span className='text-slate-600 text-sm dark:text-slate-400'>DATA:</span>
                          {isEditingCognitive ? (
                            <input
                              className='rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800'
                              onChange={(e) =>
                                setCognitiveForm((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                              type='date'
                              value={cognitiveForm.date}
                            />
                          ) : (
                            <span className='font-medium text-slate-800 dark:text-slate-200'>
                              {cognitiveForm.date
                                ? new Date(cognitiveForm.date).toLocaleDateString('pt-BR')
                                : '-'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Main Diagram Structure */}
                    <div className='space-y-4'>
                      {/* DADOS RELEVANTES DE INFÂNCIA */}
                      <div className='rounded-lg border-2 border-slate-300 p-3 dark:border-slate-600'>
                        <h4 className='mb-2 text-center font-semibold text-sm text-slate-700 dark:text-slate-300'>
                          DADOS RELEVANTES DE INFÂNCIA
                        </h4>
                        {isEditingCognitive ? (
                          <textarea
                            className='min-h-[60px] w-full resize-y rounded border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                            onChange={(e) =>
                              setCognitiveForm((prev) => ({
                                ...prev,
                                childhoodData: e.target.value,
                              }))
                            }
                            placeholder='Descreva dados relevantes da infância do paciente...'
                            value={cognitiveForm.childhoodData}
                          />
                        ) : (
                          <p className='min-h-[40px] text-center text-slate-600 text-sm dark:text-slate-400'>
                            {cognitiveForm.childhoodData || 'Não preenchido'}
                          </p>
                        )}
                      </div>

                      {/* Arrow down */}
                      <div className='flex justify-center'>
                        <div className='h-6 w-0.5 bg-slate-400 dark:bg-slate-500' />
                      </div>

                      {/* CRENÇA CENTRAL */}
                      <div className='rounded-lg border-2 border-slate-300 p-3 dark:border-slate-600'>
                        <h4 className='mb-2 text-center font-semibold text-sm text-slate-700 dark:text-slate-300'>
                          CRENÇA CENTRAL
                        </h4>
                        {isEditingCognitive ? (
                          <textarea
                            className='min-h-[60px] w-full resize-y rounded border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                            onChange={(e) =>
                              setCognitiveForm((prev) => ({
                                ...prev,
                                coreBelief: e.target.value,
                              }))
                            }
                            placeholder='Descreva a crença central do paciente...'
                            value={cognitiveForm.coreBelief}
                          />
                        ) : (
                          <p className='min-h-[40px] text-center text-slate-600 text-sm dark:text-slate-400'>
                            {cognitiveForm.coreBelief || 'Não preenchido'}
                          </p>
                        )}
                      </div>

                      {/* Arrow down */}
                      <div className='flex justify-center'>
                        <div className='h-6 w-0.5 bg-slate-400 dark:bg-slate-500' />
                      </div>

                      {/* SUPOSIÇÕES CONDICIONAIS - REGRAS */}
                      <div className='rounded-lg border-2 border-slate-300 p-3 dark:border-slate-600'>
                        <h4 className='mb-2 text-center font-semibold text-sm text-slate-700 dark:text-slate-300'>
                          SUPOSIÇÕES CONDICIONAIS - REGRAS
                        </h4>
                        {isEditingCognitive ? (
                          <textarea
                            className='min-h-[60px] w-full resize-y rounded border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                            onChange={(e) =>
                              setCognitiveForm((prev) => ({
                                ...prev,
                                conditionalAssumptions: e.target.value,
                              }))
                            }
                            placeholder='Descreva as suposições condicionais e regras...'
                            value={cognitiveForm.conditionalAssumptions}
                          />
                        ) : (
                          <p className='min-h-[40px] text-center text-slate-600 text-sm dark:text-slate-400'>
                            {cognitiveForm.conditionalAssumptions || 'Não preenchido'}
                          </p>
                        )}
                      </div>

                      {/* Arrow down */}
                      <div className='flex justify-center'>
                        <div className='h-6 w-0.5 bg-slate-400 dark:bg-slate-500' />
                      </div>

                      {/* ESTRATÉGIA(S) COMPENSATÓRIA(S) */}
                      <div className='rounded-lg border-2 border-slate-300 p-3 dark:border-slate-600'>
                        <h4 className='mb-2 text-center font-semibold text-sm text-slate-700 dark:text-slate-300'>
                          ESTRATÉGIA(S) COMPENSATÓRIA(S)
                        </h4>
                        {isEditingCognitive ? (
                          <textarea
                            className='min-h-[60px] w-full resize-y rounded border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                            onChange={(e) =>
                              setCognitiveForm((prev) => ({
                                ...prev,
                                compensatoryStrategies: e.target.value,
                              }))
                            }
                            placeholder='Descreva as estratégias compensatórias...'
                            value={cognitiveForm.compensatoryStrategies}
                          />
                        ) : (
                          <p className='min-h-[40px] text-center text-slate-600 text-sm dark:text-slate-400'>
                            {cognitiveForm.compensatoryStrategies || 'Não preenchido'}
                          </p>
                        )}
                      </div>

                      {/* Arrow down to situations */}
                      <div className='flex justify-center'>
                        <div className='h-6 w-0.5 bg-slate-400 dark:bg-slate-500' />
                      </div>

                      {/* Mobile: Situation Tabs */}
                      <div className='mb-4 md:hidden'>
                        <div className='flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800'>
                          {[1, 2, 3].map((num) => {
                            const colors = {
                              1: 'bg-rose-500 text-white',
                              2: 'bg-amber-500 text-white',
                              3: 'bg-emerald-500 text-white',
                            }
                            const inactiveColors = {
                              1: 'text-rose-600 dark:text-rose-400',
                              2: 'text-amber-600 dark:text-amber-400',
                              3: 'text-emerald-600 dark:text-emerald-400',
                            }
                            return (
                              <button
                                className={`flex-1 rounded-md py-2 font-medium text-sm transition-colors ${
                                  activeSituation === num
                                    ? colors[num as 1 | 2 | 3]
                                    : inactiveColors[num as 1 | 2 | 3]
                                }`}
                                key={num}
                                onClick={() => setActiveSituation(num as 1 | 2 | 3)}
                                type='button'
                              >
                                Situação {num}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Three Situations Grid - Desktop shows all, Mobile shows active */}
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        {/* Situation 1 */}
                        <div
                          className={`space-y-3 ${activeSituation !== 1 ? 'hidden md:block' : ''}`}
                        >
                          <div className='rounded-xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100 p-3 dark:border-rose-700 dark:from-rose-900/30 dark:to-rose-900/20'>
                            <h5 className='mb-2 text-center font-bold text-sm text-rose-700 dark:text-rose-400'>
                              📍 Situação 1
                            </h5>
                            {isEditingCognitive ? (
                              <textarea
                                className='w-full resize-none rounded-lg border border-rose-200 p-2 text-sm dark:border-rose-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                rows={2}
                                value={cognitiveForm.situation1.situation}
                              />
                            ) : (
                              <p className='text-center text-sm text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.situation || 'Não preenchido'}
                              </p>
                            )}
                          </div>

                          {/* Compact flow for mobile */}
                          <div className='grid grid-cols-2 gap-2'>
                            <div className='rounded-lg border border-rose-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-rose-600 dark:text-rose-400'>
                                💭 Pensamento Automático
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation(
                                      'situation1',
                                      'automaticThought',
                                      e.target.value
                                    )
                                  }
                                  placeholder='Pensamento...'
                                  rows={2}
                                  value={cognitiveForm.situation1.automaticThought}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation1.automaticThought || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-rose-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-rose-600 dark:text-rose-400'>
                                🔍 Significado do PA
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation1', 'meaningOfAT', e.target.value)
                                  }
                                  placeholder='Significado...'
                                  rows={2}
                                  value={cognitiveForm.situation1.meaningOfAT}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation1.meaningOfAT || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-rose-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-rose-600 dark:text-rose-400'>
                                ❤️ Emoção
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation1', 'emotion', e.target.value)
                                  }
                                  placeholder='Emoção...'
                                  value={cognitiveForm.situation1.emotion}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation1.emotion || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-rose-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-rose-600 dark:text-rose-400'>
                                🎯 Comportamento
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation1', 'behavior', e.target.value)
                                  }
                                  placeholder='Comportamento...'
                                  value={cognitiveForm.situation1.behavior}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation1.behavior || '-'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Situation 2 */}
                        <div
                          className={`space-y-3 ${activeSituation !== 2 ? 'hidden md:block' : ''}`}
                        >
                          <div className='rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-3 dark:border-amber-700 dark:from-amber-900/30 dark:to-amber-900/20'>
                            <h5 className='mb-2 text-center font-bold text-sm text-amber-700 dark:text-amber-400'>
                              📍 Situação 2
                            </h5>
                            {isEditingCognitive ? (
                              <textarea
                                className='w-full resize-none rounded-lg border border-amber-200 p-2 text-sm dark:border-amber-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                rows={2}
                                value={cognitiveForm.situation2.situation}
                              />
                            ) : (
                              <p className='text-center text-sm text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.situation || 'Não preenchido'}
                              </p>
                            )}
                          </div>

                          {/* Compact flow for mobile */}
                          <div className='grid grid-cols-2 gap-2'>
                            <div className='rounded-lg border border-amber-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-amber-600 dark:text-amber-400'>
                                💭 Pensamento Automático
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation(
                                      'situation2',
                                      'automaticThought',
                                      e.target.value
                                    )
                                  }
                                  placeholder='Pensamento...'
                                  rows={2}
                                  value={cognitiveForm.situation2.automaticThought}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation2.automaticThought || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-amber-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-amber-600 dark:text-amber-400'>
                                🔍 Significado do PA
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation2', 'meaningOfAT', e.target.value)
                                  }
                                  placeholder='Significado...'
                                  rows={2}
                                  value={cognitiveForm.situation2.meaningOfAT}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation2.meaningOfAT || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-amber-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-amber-600 dark:text-amber-400'>
                                ❤️ Emoção
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation2', 'emotion', e.target.value)
                                  }
                                  placeholder='Emoção...'
                                  value={cognitiveForm.situation2.emotion}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation2.emotion || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-amber-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-amber-600 dark:text-amber-400'>
                                🎯 Comportamento
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation2', 'behavior', e.target.value)
                                  }
                                  placeholder='Comportamento...'
                                  value={cognitiveForm.situation2.behavior}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation2.behavior || '-'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Situation 3 */}
                        <div
                          className={`space-y-3 ${activeSituation !== 3 ? 'hidden md:block' : ''}`}
                        >
                          <div className='rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 dark:border-emerald-700 dark:from-emerald-900/30 dark:to-emerald-900/20'>
                            <h5 className='mb-2 text-center font-bold text-sm text-emerald-700 dark:text-emerald-400'>
                              📍 Situação 3
                            </h5>
                            {isEditingCognitive ? (
                              <textarea
                                className='w-full resize-none rounded-lg border border-emerald-200 p-2 text-sm dark:border-emerald-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                rows={2}
                                value={cognitiveForm.situation3.situation}
                              />
                            ) : (
                              <p className='text-center text-sm text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.situation || 'Não preenchido'}
                              </p>
                            )}
                          </div>

                          {/* Compact flow for mobile */}
                          <div className='grid grid-cols-2 gap-2'>
                            <div className='rounded-lg border border-emerald-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400'>
                                💭 Pensamento Automático
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation(
                                      'situation3',
                                      'automaticThought',
                                      e.target.value
                                    )
                                  }
                                  placeholder='Pensamento...'
                                  rows={2}
                                  value={cognitiveForm.situation3.automaticThought}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation3.automaticThought || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-emerald-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400'>
                                🔍 Significado do PA
                              </h6>
                              {isEditingCognitive ? (
                                <textarea
                                  className='w-full resize-none rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation3', 'meaningOfAT', e.target.value)
                                  }
                                  placeholder='Significado...'
                                  rows={2}
                                  value={cognitiveForm.situation3.meaningOfAT}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation3.meaningOfAT || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-emerald-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400'>
                                ❤️ Emoção
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation3', 'emotion', e.target.value)
                                  }
                                  placeholder='Emoção...'
                                  value={cognitiveForm.situation3.emotion}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation3.emotion || '-'}
                                </p>
                              )}
                            </div>
                            <div className='rounded-lg border border-emerald-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800'>
                              <h6 className='mb-1.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400'>
                                🎯 Comportamento
                              </h6>
                              {isEditingCognitive ? (
                                <input
                                  className='w-full rounded border border-slate-200 p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900'
                                  onChange={(e) =>
                                    updateSituation('situation3', 'behavior', e.target.value)
                                  }
                                  placeholder='Comportamento...'
                                  value={cognitiveForm.situation3.behavior}
                                />
                              ) : (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {cognitiveForm.situation3.behavior || '-'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes section */}
                      {(isEditingCognitive || cognitiveForm.notes) && (
                        <div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50'>
                          <h4 className='mb-2 font-semibold text-slate-700 text-sm dark:text-slate-300'>
                            📝 Observações
                          </h4>
                          {isEditingCognitive ? (
                            <textarea
                              className='min-h-[60px] w-full resize-y rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                              onChange={(e) =>
                                setCognitiveForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                              placeholder='Adicione observações...'
                              value={cognitiveForm.notes}
                            />
                          ) : (
                            <p className='text-slate-600 text-sm dark:text-slate-400'>
                              {cognitiveForm.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Therapeutic Plan Section */}
            {activeSection === 'therapeutic' && (
              <div className='space-y-3 sm:space-y-4'>
                {cognitiveData?.therapeuticPlan ? (
                  <>
                    {/* Plan Header */}
                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <h3 className='font-semibold text-base text-slate-800 dark:text-slate-200 sm:text-lg'>
                        Plano Terapêutico
                      </h3>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400 sm:px-3 sm:py-1 sm:text-xs'>
                          <Sparkles className='mr-1 inline h-3 w-3' />
                          Gerado por IA
                        </span>
                        <button
                          className='flex items-center gap-1 rounded-lg bg-violet-500 px-2 py-1.5 font-medium text-xs text-white transition-colors hover:bg-violet-600 disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm'
                          disabled={isGeneratingPlan}
                          onClick={handleGenerateTherapeuticPlan}
                          title='Regenerar plano terapêutico'
                          type='button'
                        >
                          {isGeneratingPlan ? (
                            <>
                              <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
                              <span className='hidden sm:inline'>Gerando...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-3 w-3 sm:h-4 sm:w-4' />
                              <span>Regenerar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    {generationError && (
                      <div className='rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                        <p className='text-red-700 text-sm dark:text-red-400'>{generationError}</p>
                      </div>
                    )}

                    {/* Plan Content */}
                    <div className='space-y-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:space-y-6 sm:rounded-2xl sm:p-6'>
                      {/* Generated timestamp */}
                      <p className='text-right text-slate-400 text-[10px] sm:text-xs'>
                        Gerado em:{' '}
                        {new Date(cognitiveData.therapeuticPlan.generatedAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>

                      {/* Objectives */}
                      <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20 sm:p-4'>
                        <h4 className='mb-2 flex items-center gap-2 font-semibold text-sm text-emerald-800 dark:text-emerald-300 sm:mb-3'>
                          <Target className='h-4 w-4 sm:h-5 sm:w-5' />
                          Objetivos Terapêuticos
                        </h4>
                        <ul className='space-y-2'>
                          {cognitiveData.therapeuticPlan.objectives.map((objective, index) => (
                            <li
                              className='flex items-start gap-2 text-slate-700 text-xs dark:text-slate-300 sm:text-sm'
                              key={`obj-${index}`}
                            >
                              <span className='mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 font-medium text-emerald-800 text-[10px] dark:bg-emerald-800 dark:text-emerald-200 sm:mt-1 sm:h-5 sm:w-5 sm:text-xs'>
                                {index + 1}
                              </span>
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Interventions */}
                      <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 sm:p-4'>
                        <h4 className='mb-2 flex items-center gap-2 font-semibold text-sm text-blue-800 dark:text-blue-300 sm:mb-3'>
                          <Brain className='h-4 w-4 sm:h-5 sm:w-5' />
                          Intervenções e Técnicas
                        </h4>
                        <div className='space-y-3 sm:space-y-4'>
                          {cognitiveData.therapeuticPlan.interventions.map(
                            (intervention, index) => (
                              <div
                                className='rounded-lg border border-blue-100 bg-white p-2.5 dark:border-blue-700 dark:bg-slate-800 sm:p-3'
                                key={`int-${index}`}
                              >
                                <h5 className='font-medium text-blue-700 text-xs dark:text-blue-400 sm:text-sm'>
                                  {intervention.technique}
                                </h5>
                                <p className='mt-1 text-slate-600 text-xs dark:text-slate-400 sm:text-sm'>
                                  {intervention.description}
                                </p>
                                {intervention.targetBelief && (
                                  <p className='mt-2 border-blue-200 border-t pt-2 text-slate-500 text-[10px] italic dark:border-blue-700 dark:text-slate-500 sm:text-xs'>
                                    <strong>Foco:</strong> {intervention.targetBelief}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Suggested Activities */}
                      <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20 sm:p-4'>
                        <h4 className='mb-2 flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-300 sm:mb-3'>
                          <ClipboardList className='h-4 w-4 sm:h-5 sm:w-5' />
                          Atividades (Entre Sessões)
                        </h4>
                        <ul className='space-y-2'>
                          {cognitiveData.therapeuticPlan.suggestedActivities.map(
                            (activity, index) => (
                              <li
                                className='flex items-start gap-2 text-slate-700 text-xs dark:text-slate-300 sm:text-sm'
                                key={`act-${index}`}
                              >
                                <CheckCircle2 className='mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 sm:h-4 sm:w-4' />
                                {activity}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Duration and Observations */}
                      <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
                        <div className='rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-900/20 sm:p-4'>
                          <h4 className='mb-1.5 font-semibold text-xs text-violet-800 dark:text-violet-300 sm:mb-2 sm:text-sm'>
                            Duração Estimada
                          </h4>
                          <p className='text-slate-700 text-xs dark:text-slate-300 sm:text-sm'>
                            {cognitiveData.therapeuticPlan.estimatedDuration}
                          </p>
                        </div>
                        <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800 sm:p-4'>
                          <h4 className='mb-1.5 font-semibold text-slate-700 text-xs dark:text-slate-300 sm:mb-2 sm:text-sm'>
                            Observações
                          </h4>
                          <p className='text-slate-600 text-xs dark:text-slate-400 sm:text-sm'>
                            {cognitiveData.therapeuticPlan.observations}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                      <div className='mb-4 rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/30'>
                        <ClipboardList className='h-12 w-12 text-violet-500' />
                      </div>
                      <h3 className='mb-2 font-semibold text-lg text-slate-800 dark:text-slate-200'>
                        Plano Terapêutico
                      </h3>
                      {cognitiveData ? (
                        <>
                          <p className='mb-4 max-w-sm text-slate-500 text-sm'>
                            Clique no botão abaixo para gerar um plano terapêutico personalizado
                            baseado na conceituação cognitiva.
                          </p>
                          {generationError && (
                            <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                              <p className='text-red-700 text-sm dark:text-red-400'>
                                {generationError}
                              </p>
                            </div>
                          )}
                          <button
                            className='flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-50'
                            disabled={isGeneratingPlan}
                            onClick={handleGenerateTherapeuticPlan}
                            type='button'
                          >
                            {isGeneratingPlan ? (
                              <>
                                <Loader2 className='h-5 w-5 animate-spin' />
                                Gerando plano...
                              </>
                            ) : (
                              <>
                                <Sparkles className='h-5 w-5' />
                                Gerar Plano com IA
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className='mb-4 max-w-sm text-slate-500 text-sm'>
                            Primeiro, preencha a conceituação cognitiva do paciente para poder gerar
                            um plano terapêutico.
                          </p>
                          <button
                            className='rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            onClick={() => setActiveSection('cognitive')}
                            type='button'
                          >
                            Ir para Conceituação Cognitiva
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className='flex h-64 flex-col items-center justify-center text-center'>
            <FileText className='mb-4 h-16 w-16 text-slate-300' />
            <h2 className='mb-2 font-semibold text-lg text-slate-700 dark:text-slate-200'>
              Selecione um paciente
            </h2>
            <p className='text-slate-500 text-sm'>
              Escolha um paciente para gerenciar os documentos de sessão
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='font-semibold text-lg text-slate-800 dark:text-slate-200'>
                Adicionar Documento
              </h3>
              <button
                aria-label='Fechar modal'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadDescription('')
                  setUploadSessionDate('')
                }}
                type='button'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <div className='space-y-4'>
              {/* Description */}
              <div>
                <label
                  className='mb-1 block font-medium text-slate-700 text-sm dark:text-slate-300'
                  htmlFor='doc-description'
                >
                  Descrição (opcional)
                </label>
                <input
                  className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  id='doc-description'
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder='Ex: Relatório da sessão sobre ansiedade'
                  type='text'
                  value={uploadDescription}
                />
              </div>

              {/* Session Date */}
              <div>
                <label
                  className='mb-1 block font-medium text-slate-700 text-sm dark:text-slate-300'
                  htmlFor='session-date'
                >
                  Data da Sessão (opcional)
                </label>
                <input
                  className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  id='session-date'
                  onChange={(e) => setUploadSessionDate(e.target.value)}
                  type='date'
                  value={uploadSessionDate}
                />
              </div>

              {/* File Input */}
              <div>
                <label className='mb-1 block font-medium text-slate-700 text-sm dark:text-slate-300'>
                  Arquivo
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                    isUploading
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                  htmlFor='file-upload'
                >
                  {isUploading ? (
                    <div className='flex flex-col items-center'>
                      <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600' />
                      <span className='mt-2 text-purple-600 text-sm'>Enviando...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className='mb-2 h-8 w-8 text-slate-400' />
                      <span className='font-medium text-slate-600 text-sm dark:text-slate-400'>
                        Clique para selecionar
                      </span>
                      <span className='mt-1 text-slate-400 text-xs'>
                        PDF, Imagens, Docs, Planilhas (máx. 10MB)
                      </span>
                    </>
                  )}
                  <input
                    accept='application/pdf,image/jpeg,image/png,image/webp,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    className='hidden'
                    disabled={isUploading}
                    id='file-upload'
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    type='file'
                  />
                </label>
              </div>
            </div>

            <div className='mt-6 flex gap-3'>
              <button
                className='flex-1 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadDescription('')
                  setUploadSessionDate('')
                }}
                type='button'
              >
                Cancelar
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
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
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
                  aria-checked={theme === 'dark'}
                  aria-label={theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'}
                  className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                  onClick={toggleTheme}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
                  role='switch'
                  tabIndex={0}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      theme === 'dark' ? 'left-[22px]' : 'left-0.5'
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
                        await fetch('/api/auth/clear-role-cookie', {
                          method: 'POST',
                        })
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

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-md animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300 sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-4 flex items-center justify-between sm:mb-6'>
              <h3 className='flex items-center gap-2 font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                <Brain className='text-emerald-500' size={20} /> Confirmar Aprovação
              </h3>
              <button
                aria-label='Fechar modal'
                className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => setShowApprovalModal(false)}
                type='button'
              >
                <X size={16} />
              </button>
            </div>

            <div className='mb-6 space-y-4'>
              <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50'>
                    <CheckCircle2 className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-amber-800 text-sm dark:text-amber-300'>
                      Revisão da Conceituação Cognitiva
                    </h4>
                    <p className='mt-1 text-amber-700 text-xs dark:text-amber-400'>
                      Ao confirmar, você declara que revisou as informações da conceituação
                      cognitiva e aprova o conteúdo gerado pela IA.
                    </p>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/20'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50'>
                    <Sparkles className='h-5 w-5 text-violet-600 dark:text-violet-400' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-violet-800 text-sm dark:text-violet-300'>
                      Geração do Plano Terapêutico
                    </h4>
                    <p className='mt-1 text-violet-700 text-xs dark:text-violet-400'>
                      A IA irá analisar a conceituação cognitiva aprovada e gerar um plano
                      terapêutico personalizado com sugestões de intervenções e técnicas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 font-medium text-slate-600 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                onClick={() => setShowApprovalModal(false)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-sm text-white transition-colors hover:bg-emerald-600'
                onClick={handleApproveAndGeneratePlan}
                type='button'
              >
                <CheckCircle2 className='h-4 w-4' />
                Confirmar e Gerar Plano
              </button>
            </div>
          </div>
          <div className='-z-10 absolute inset-0' onClick={() => setShowApprovalModal(false)} />
        </div>
      )}
    </div>
  )
}
