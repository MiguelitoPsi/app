'use client'

import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  FileImage,
  FileText,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

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
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
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

  const utils = trpc.useUtils()
  const { data: patients } = trpc.patient.getAll.useQuery()

  const { data: documents, isLoading: isLoadingDocuments } =
    trpc.therapistReports.getPatientDocuments.useQuery(
      { patientId: selectedPatientId ?? '', limit: 20 },
      { enabled: Boolean(selectedPatientId) }
    )

  // Cognitive Conceptualization data
  const { data: cognitiveData, isLoading: isLoadingCognitive } =
    trpc.therapistReports.getCognitiveConceptualization.useQuery(
      { patientId: selectedPatientId ?? '' },
      { enabled: Boolean(selectedPatientId) }
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
        situation1: cognitiveData.situations?.situation1 ?? { ...emptySituation },
        situation2: cognitiveData.situations?.situation2 ?? { ...emptySituation },
        situation3: cognitiveData.situations?.situation3 ?? { ...emptySituation },
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

  const handleApproveCognitive = () => {
    if (!selectedPatientId) return
    if (
      confirm(
        'Ao aprovar esta conceituação cognitiva, ela será enviada para o plano terapêutico com sugestões de intervenções e técnicas. Deseja continuar?'
      )
    ) {
      setIsApprovingCognitive(true)
      approveCognitiveMutation.mutate({ patientId: selectedPatientId })
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
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use PDF ou imagens (JPEG, PNG, WebP, GIF).')
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
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'

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

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='bg-gradient-to-br from-purple-600 to-indigo-700 pt-safe text-white'>
        <div className='px-4 pt-6 pb-6'>
          <h1 className='mb-2 font-bold text-2xl'>Relatórios de Sessões</h1>
          <p className='text-purple-100'>Gerencie os documentos das sessões com seus pacientes</p>
        </div>

        {/* Patient Selector */}
        <div className='px-4 pb-4'>
          <button
            className='flex w-full items-center justify-between rounded-xl bg-white/10 p-4 backdrop-blur-sm'
            onClick={() => setShowPatientList(!showPatientList)}
            type='button'
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'>
                <User className='h-5 w-5' />
              </div>
              <div className='text-left'>
                <p className='text-sm text-white/70'>Paciente</p>
                <p className='font-medium'>{selectedPatient?.name ?? 'Selecione um paciente'}</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${showPatientList ? 'rotate-180' : ''}`}
            />
          </button>

          {showPatientList && (
            <div className='mt-2 max-h-60 overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-800'>
              {patients?.map((patient) => (
                <button
                  className={`flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    selectedPatientId === patient.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id)
                    setShowPatientList(false)
                  }}
                  type='button'
                >
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 font-semibold text-white'>
                    {patient.name?.charAt(0) ?? 'P'}
                  </div>
                  <div>
                    <p className='font-medium text-slate-800 dark:text-slate-200'>{patient.name}</p>
                    <p className='text-slate-500 text-sm'>{patient.email}</p>
                  </div>
                  {selectedPatientId === patient.id && (
                    <CheckCircle2 className='ml-auto h-5 w-5 text-purple-500' />
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
      </header>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto p-4 pb-24'>
        {selectedPatientId ? (
          <div className='space-y-4'>
            {/* Navigation Tabs */}
            <div className='grid grid-cols-3 gap-2 sm:gap-3'>
              <button
                className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${activeSection === 'documents' ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                onClick={() => setActiveSection('documents')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2'>
                  <FileText className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='font-semibold text-[9px] sm:text-xs'>Documentos</span>
                </div>
              </button>
              <button
                className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${activeSection === 'cognitive' ? 'ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                onClick={() => setActiveSection('cognitive')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-1 text-white sm:gap-2'>
                  <Brain className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='truncate font-semibold text-[8px] sm:text-xs'>Conceituação</span>
                </div>
              </button>
              <button
                className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 ${activeSection === 'therapeutic' ? 'ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                onClick={() => setActiveSection('therapeutic')}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-violet-400 to-violet-600' />
                <div className='relative flex h-full flex-col items-center justify-center gap-0.5 text-white sm:gap-1'>
                  <ClipboardList className='h-5 w-5 sm:h-7 sm:w-7' />
                  <span className='font-semibold text-[8px] leading-tight sm:text-xs'>Plano</span>
                  <span className='font-semibold text-[8px] leading-tight sm:text-xs'>
                    Terapêutico
                  </span>
                </div>
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
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {doc.fileType === 'pdf' ? (
                            <FileText className='h-6 w-6' />
                          ) : (
                            <FileImage className='h-6 w-6' />
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
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold text-lg text-slate-800 dark:text-slate-200'>
                    Diagrama de Conceituação Cognitiva
                  </h3>
                  <div className='flex gap-2'>
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
                            className='flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 font-medium text-red-600 text-sm transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                            onClick={handleDeleteCognitive}
                            type='button'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        )}
                        {cognitiveData && !cognitiveData.isApproved && (
                          <button
                            className='flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-emerald-600 disabled:opacity-50'
                            disabled={isApprovingCognitive}
                            onClick={handleApproveCognitive}
                            title='Aprovar e enviar para o plano terapêutico'
                            type='button'
                          >
                            <Send className='h-4 w-4' />
                            {isApprovingCognitive ? 'Aprovando...' : 'Aprovar'}
                          </button>
                        )}
                        {cognitiveData?.isApproved && (
                          <span className='flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 font-medium text-emerald-700 text-sm dark:bg-emerald-900/30 dark:text-emerald-400'>
                            <CheckCircle2 className='h-4 w-4' />
                            Aprovado
                          </span>
                        )}
                        <button
                          className='flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-rose-600'
                          onClick={() => setIsEditingCognitive(true)}
                          type='button'
                        >
                          <Edit3 className='h-4 w-4' />
                          {cognitiveData ? 'Editar' : 'Criar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

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
                                setCognitiveForm((prev) => ({ ...prev, name: e.target.value }))
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
                                setCognitiveForm((prev) => ({ ...prev, date: e.target.value }))
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
                              setCognitiveForm((prev) => ({ ...prev, coreBelief: e.target.value }))
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

                      {/* Three Situations Grid */}
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        {/* Situation 1 */}
                        <div className='space-y-2'>
                          <div className='rounded-lg border-2 border-rose-200 bg-rose-50 p-2 dark:border-rose-800 dark:bg-rose-900/20'>
                            <h5 className='mb-1 text-center font-semibold text-xs text-rose-700 dark:text-rose-400'>
                              Situação 1
                            </h5>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-rose-200 p-1 text-xs dark:border-rose-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                value={cognitiveForm.situation1.situation}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.situation || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Pensamento automático
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'automaticThought', e.target.value)
                                }
                                placeholder='Pensamento...'
                                value={cognitiveForm.situation1.automaticThought}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.automaticThought || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Significado do PA
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'meaningOfAT', e.target.value)
                                }
                                placeholder='Significado...'
                                value={cognitiveForm.situation1.meaningOfAT}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.meaningOfAT || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Emoção
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'emotion', e.target.value)
                                }
                                placeholder='Emoção...'
                                value={cognitiveForm.situation1.emotion}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.emotion || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Comportamento
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation1', 'behavior', e.target.value)
                                }
                                placeholder='Comportamento...'
                                value={cognitiveForm.situation1.behavior}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation1.behavior || '-'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Situation 2 */}
                        <div className='space-y-2'>
                          <div className='rounded-lg border-2 border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20'>
                            <h5 className='mb-1 text-center font-semibold text-xs text-amber-700 dark:text-amber-400'>
                              Situação 2
                            </h5>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-amber-200 p-1 text-xs dark:border-amber-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                value={cognitiveForm.situation2.situation}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.situation || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Pensamento automático
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'automaticThought', e.target.value)
                                }
                                placeholder='Pensamento...'
                                value={cognitiveForm.situation2.automaticThought}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.automaticThought || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Significado do PA
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'meaningOfAT', e.target.value)
                                }
                                placeholder='Significado...'
                                value={cognitiveForm.situation2.meaningOfAT}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.meaningOfAT || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Emoção
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'emotion', e.target.value)
                                }
                                placeholder='Emoção...'
                                value={cognitiveForm.situation2.emotion}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.emotion || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Comportamento
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation2', 'behavior', e.target.value)
                                }
                                placeholder='Comportamento...'
                                value={cognitiveForm.situation2.behavior}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation2.behavior || '-'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Situation 3 */}
                        <div className='space-y-2'>
                          <div className='rounded-lg border-2 border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-900/20'>
                            <h5 className='mb-1 text-center font-semibold text-xs text-emerald-700 dark:text-emerald-400'>
                              Situação 3
                            </h5>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-emerald-200 p-1 text-xs dark:border-emerald-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'situation', e.target.value)
                                }
                                placeholder='Descreva a situação...'
                                value={cognitiveForm.situation3.situation}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.situation || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Pensamento automático
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'automaticThought', e.target.value)
                                }
                                placeholder='Pensamento...'
                                value={cognitiveForm.situation3.automaticThought}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.automaticThought || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Significado do PA
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'meaningOfAT', e.target.value)
                                }
                                placeholder='Significado...'
                                value={cognitiveForm.situation3.meaningOfAT}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.meaningOfAT || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Emoção
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'emotion', e.target.value)
                                }
                                placeholder='Emoção...'
                                value={cognitiveForm.situation3.emotion}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.emotion || '-'}
                              </p>
                            )}
                          </div>
                          <div className='flex justify-center'>
                            <div className='h-4 w-0.5 bg-slate-300 dark:bg-slate-600' />
                          </div>
                          <div className='rounded-lg border border-slate-200 p-2 dark:border-slate-700'>
                            <h6 className='mb-1 text-center font-medium text-[10px] text-slate-500 dark:text-slate-400'>
                              Comportamento
                            </h6>
                            {isEditingCognitive ? (
                              <input
                                className='w-full rounded border border-slate-200 p-1 text-xs dark:border-slate-700 dark:bg-slate-800'
                                onChange={(e) =>
                                  updateSituation('situation3', 'behavior', e.target.value)
                                }
                                placeholder='Comportamento...'
                                value={cognitiveForm.situation3.behavior}
                              />
                            ) : (
                              <p className='min-h-[24px] text-center text-xs text-slate-600 dark:text-slate-400'>
                                {cognitiveForm.situation3.behavior || '-'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes section */}
                      {(isEditingCognitive || cognitiveForm.notes) && (
                        <div className='mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700'>
                          <h4 className='mb-2 font-medium text-slate-600 text-sm dark:text-slate-400'>
                            Observações
                          </h4>
                          {isEditingCognitive ? (
                            <textarea
                              className='min-h-[60px] w-full resize-y rounded border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800'
                              onChange={(e) =>
                                setCognitiveForm((prev) => ({ ...prev, notes: e.target.value }))
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
              <div className='rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <div className='mb-4 rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/30'>
                    <ClipboardList className='h-12 w-12 text-violet-500' />
                  </div>
                  <h3 className='mb-2 font-semibold text-lg text-slate-800 dark:text-slate-200'>
                    Plano Terapêutico
                  </h3>
                  <p className='mb-4 max-w-sm text-slate-500 text-sm'>
                    Em breve você poderá criar e acompanhar planos terapêuticos personalizados.
                  </p>
                  <span className='rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-600 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                    Em desenvolvimento
                  </span>
                </div>
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
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='font-semibold text-lg text-slate-800 dark:text-slate-200'>
                Adicionar Documento
              </h3>
              <button
                className='p-1 text-slate-400 hover:text-slate-600'
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadDescription('')
                  setUploadSessionDate('')
                }}
                type='button'
              >
                <X className='h-5 w-5' />
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
                        PDF ou imagens (máx. 10MB)
                      </span>
                    </>
                  )}
                  <input
                    accept='application/pdf,image/jpeg,image/png,image/webp,image/gif'
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
    </div>
  )
}
