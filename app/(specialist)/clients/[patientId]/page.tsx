'use client'

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Scale,
  User,
  Heart,
  Trophy,
} from 'lucide-react'
import { translateMood } from '@/lib/utils/mood'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

type PatientProfile = {
  id: string
  name: string | null
  email: string
  phone: string | null
  createdAt: Date
  birthdate: string | null
  gender: string | null
  city: string | null
  profession: string | null
  status: string
}

type SessionDocument = {
  id: string
  fileName: string
  fileType: string
  description: string | null
  sessionDate: Date | null
  createdAt: Date
}

type CognitiveConceptualization = {
  id: string
  name: string | null
  date: Date | null
  childhoodData: string | null
  coreBelief: string | null
  conditionalAssumptions: string | null
  compensatoryStrategies: string | null
  situations: string | null
}

type JournalEntry = {
  id: string
  createdAt: Date
  title: string | null
  content: string | null
  aiAnalysis: string | null
  mood: string | null
  isRead: boolean
  therapistFeedback: string | null
}


export default function PatientProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const patientId = params.patientId as string
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<'overview' | 'tcc' | 'journal' | 'documents' | 'rewards'>(
    'overview'
  )

  useEffect(() => {
    if (tabParam === 'journal' || tabParam === 'sessions') {
      setActiveTab('journal')
    } else if (tabParam === 'tcc') {
      setActiveTab('tcc')
    } else if (tabParam === 'documents') {
      setActiveTab('documents')
    } else if (tabParam === 'rewards') {
      setActiveTab('rewards')
    }
  }, [tabParam])


  // Buscar dados do paciente
  const { data: patient, isLoading: isPatientLoading } = trpc.patient.getById.useQuery(
    { id: patientId },
    { enabled: !!patientId }
  )

  // Buscar documentos de sessões
  const { data: sessionDocuments } = trpc.therapistReports.getPatientDocuments.useQuery(
    { patientId },
    { enabled: !!patientId }
  )

  // Buscar conceituação cognitiva (TCC)
  const { data: conceptualization } = trpc.therapistReports.getCognitiveConceptualization.useQuery(
    { patientId },
    { enabled: !!patientId }
  )

  // Buscar journal entries (registros/sessões)
  const { data: journalEntries, refetch: refetchJournal } = trpc.journal.getAll.useQuery(
    { userId: patientId },
    { enabled: !!patientId }
  )
  
  // Buscar recompensas do paciente
  const { data: rewards, refetch: refetchRewards } = trpc.reward.getAll.useQuery(
    { userId: patientId },
    { enabled: !!patientId }
  )

  const utils = trpc.useUtils()

  const markAsReadMutation = trpc.journal.markAsRead.useMutation({
    onSuccess: () => {
      toast.success('Registro marcado como lido!')
      utils.analytics.getPendingItems.invalidate()
      refetchJournal()
    },
    onError: (error) => {
      toast.error('Erro ao marcar como lido: ' + error.message)
    }
  })

  const addFeedbackMutation = trpc.journal.addFeedback.useMutation({
    onSuccess: () => {
      toast.success('Feedback enviado com sucesso!')
      refetchJournal()
    },
    onError: (error) => {
      toast.error('Erro ao enviar feedback: ' + error.message)
    }
  })

  const updateRewardCostMutation = trpc.reward.updateCost.useMutation({
    onSuccess: () => {
      toast.success('Custo da recompensa atualizado!')
      refetchRewards()
    },
    onError: (error) => {
      toast.error('Erro ao atualizar custo: ' + error.message)
    }
  })


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

  const getFileIcon = (fileType: string) => <FileText className='h-5 w-5 text-purple-400' />

  const FeedbackSection = ({ entryId, existingFeedback }: { entryId: string, existingFeedback: string | null }) => {
    const [feedback, setFeedback] = useState(existingFeedback || '')
    const [isEditing, setIsEditing] = useState(!existingFeedback)

    const handleSubmit = () => {
      if (!feedback.trim()) return
      addFeedbackMutation.mutate({ entryId, feedback }, {
        onSuccess: () => setIsEditing(false)
      })
    }

    if (!isEditing && existingFeedback) {
      return (
        <div className='mt-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs font-semibold uppercase text-emerald-400 flex items-center gap-1'>
              <MessageSquare className='h-3 w-3' /> Seu Feedback
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className='text-xs text-slate-400 hover:text-white'
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
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder='Escreva seu feedback para o paciente...'
          className='w-full rounded-lg bg-[#0d1117] p-3 text-sm text-slate-300 border border-slate-700 focus:border-sky-500 focus:outline-none min-h-[80px]'
        />
        <div className='flex justify-end gap-2'>
          {existingFeedback && (
            <button 
              onClick={() => {
                setFeedback(existingFeedback)
                setIsEditing(false)
              }}
              className='px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white'
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={addFeedbackMutation.isPending || !feedback.trim()}
            className='flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50'
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
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(patient.status || 'Ativo')}`}
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
            { id: 'journal', label: 'Diário e Registros', icon: BookOpen },
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
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
                  <p className='text-2xl font-bold text-slate-900 dark:text-white'>{journalEntries?.length || 0}</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Sessões/Registros</p>
                </div>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-slate-900 dark:text-white'>{sessionDocuments?.length || 0}</p>
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
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Semanas em tratamento</p>
                </div>
                <div className='rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900'>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>Alta</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Meta</p>
                </div>
              </div>
            </div>
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
                    key={reward.id}
                    className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'
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
                          type='number'
                          defaultValue={reward.cost}
                          min='0'
                          className='flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none'
                          id={`cost-${reward.id}`}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`cost-${reward.id}`) as HTMLInputElement
                            const cost = parseInt(input.value)
                            if (!isNaN(cost)) {
                              updateRewardCostMutation.mutate({
                                rewardId: reward.id,
                                cost,
                                patientId
                              })
                            }
                          }}
                          disabled={updateRewardCostMutation.isPending}
                          className='px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50'
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
                    <span className='text-sm text-slate-400'>
                      {conceptualization?.name || 'Diagrama D. Hernandes'}
                    </span>
                  </div>
                </div>

                {/* Dados de Infância */}
                {conceptualization?.childhoodData && (
                  <div className='rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm'>
                    <h3 className='mb-3 text-sm font-medium uppercase text-slate-500 dark:text-slate-400'>
                      Dados Relevantes de Infância
                    </h3>
                    <p className='text-sm text-slate-700 dark:text-slate-300'>{conceptualization.childhoodData}</p>
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
                              return situations.map((sit: any, idx: number) => (
                                <tr key={idx}>
                                  <td className='py-3 text-sm text-slate-300'>
                                    {sit.situation || '-'}
                                  </td>
                                  <td className='py-3 text-sm text-slate-300'>
                                    {sit.automaticThought || '-'}
                                  </td>
                                  <td className='py-3 text-sm text-slate-300'>
                                    {sit.emotion || '-'}
                                  </td>
                                  <td className='py-3 text-sm text-slate-300'>
                                    {sit.behavior || '-'}
                                  </td>
                                </tr>
                              ))
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
                <p className='mt-1 text-sm text-slate-500'>
                  Você pode criar uma através dos relatórios do terapeuta
                </p>
              </div>
            )}
          </div>
        )}

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
                    className={`group rounded-xl border border-slate-200 bg-white p-5 transition-all dark:border-slate-800 dark:bg-slate-800/50 ${!entry.isRead ? 'border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)] dark:border-sky-500/30' : 'hover:border-sky-300 dark:hover:border-slate-700'}`}
                    key={entry.id}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex flex-1 items-start gap-4'>
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${!entry.isRead ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                          <BookOpen className='h-6 w-6' />
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <h3 className='font-semibold text-slate-900 dark:text-white'>
                                {entry.title || 'Registro de Pensamento'}
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
                              {!entry.isRead ? (
                                <div className='flex justify-center'>
                                  <button
                                    onClick={() => markAsReadMutation.mutate({ id: entry.id })}
                                    disabled={markAsReadMutation.isPending}
                                    className='flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-sky-600 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-500/20'
                                  >
                                    <Eye className='h-4 w-4' />
                                    {markAsReadMutation.isPending ? 'Confirmando...' : 'Marcar como Lido'}
                                  </button>
                                </div>
                              ) : (
                                <FeedbackSection 
                                  entryId={entry.id} 
                                  existingFeedback={entry.therapistFeedback} 
                                />
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
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='truncate text-sm font-medium text-slate-900 dark:text-white'>{doc.fileName}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        {formatDate(doc.createdAt)}
                        {doc.sessionDate && ` • ${formatDate(doc.sessionDate)}`}
                      </p>
                    </div>
                    <a
                      className='flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-sky-500 hover:text-white dark:bg-slate-700/50 dark:text-slate-400'
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    >
                      <Download className='h-4 w-4' />
                    </a>
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
      </main>
    </div>
  )
}
