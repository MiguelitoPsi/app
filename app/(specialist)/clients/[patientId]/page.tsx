'use client'

import {
  ArrowLeft,
  Calendar,
  FileText,
  Brain,
  Scale,
  Activity,
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
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
}

export default function PatientProfilePage() {
  const params = useParams()
  const patientId = params.patientId as string

  const [activeTab, setActiveTab] = useState<'overview' | 'tcc' | 'sessions' | 'documents'>('overview')

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
  const { data: journalEntries } = trpc.journal.getAll.useQuery(
    { userId: patientId },
    { enabled: !!patientId }
  )

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

  const getFileIcon = (fileType: string) => {
    return <FileText className='h-5 w-5 text-purple-400' />
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
    <div className='min-h-full bg-[#0d1117]'>
      {/* Botão Voltar */}
      <div className='border-b border-slate-800 bg-[#161b22] px-4 py-4 sm:px-6 lg:px-8'>
        <Link
          className='inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-sky-400'
          href='/clients'
        >
          <ArrowLeft className='h-4 w-4' />
          Voltar para Meus Pacientes
        </Link>
      </div>

      {/* Header do Paciente */}
      <header className='border-b border-slate-800 bg-[#161b22] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-4'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-xl font-bold text-white'>
              {patient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className='text-xl font-bold text-white sm:text-2xl'>
                {patient.name || 'Nome não disponível'}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400'>
                {calculateAge(patient.birthdate) && (
                  <span className='flex items-center gap-1'>
                    <User className='h-4 w-4' />
                    {calculateAge(patient.birthdate)} anos
                  </span>
                )}
                {patient.profession && (
                  <span className='flex items-center gap-1'>
                    <Briefcase className='h-4 w-4' />
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
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(patient.status || 'Ativo')}`}>
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
      <nav className='border-b border-slate-800 bg-[#161b22] px-4 sm:px-6 lg:px-8'>
        <div className='flex gap-1 overflow-x-auto'>
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'tcc', label: 'Conceituação TCC', icon: Brain },
            { id: 'sessions', label: 'Sessões', icon: Calendar },
            { id: 'documents', label: 'Documentos', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-sky-500 bg-[#1c2128] text-sky-400'
                  : 'text-slate-400 hover:bg-[#1c2128] hover:text-white'
              }`}
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
            <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                <User className='h-5 w-5 text-sky-400' />
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
            <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                <Activity className='h-5 w-5 text-emerald-400' />
                Status do Tratamento
              </h2>
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg bg-[#0d1117] p-4 text-center'>
                  <p className='text-2xl font-bold text-white'>{journalEntries?.length || 0}</p>
                  <p className='text-xs text-slate-400'>Sessões/Registros</p>
                </div>
                <div className='rounded-lg bg-[#0d1117] p-4 text-center'>
                  <p className='text-2xl font-bold text-white'>{sessionDocuments?.length || 0}</p>
                  <p className='text-xs text-slate-400'>Documentos</p>
                </div>
                <div className='rounded-lg bg-[#0d1117] p-4 text-center'>
                  <p className='text-2xl font-bold text-white'>
                    {patient.createdAt
                      ? Math.floor(
                          (Date.now() - new Date(patient.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24 * 7)
                        )
                      : 0}
                  </p>
                  <p className='text-xs text-slate-400'>Semanas em tratamento</p>
                </div>
                <div className='rounded-lg bg-[#0d1117] p-4 text-center'>
                  <p className='text-2xl font-bold text-emerald-400'>Alta</p>
                  <p className='text-xs text-slate-400'>Meta</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conceituação TCC */}
        {activeTab === 'tcc' && (
          <div className='space-y-6'>
            {conceptualization && conceptualization.length > 0 ? (
              <>
                {/* Header da Conceituação */}
                <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                  <div className='flex items-center justify-between'>
                    <h2 className='flex items-center gap-2 text-lg font-semibold text-white'>
                      <Brain className='h-5 w-5 text-purple-400' />
                      Conceituação Cognitiva
                    </h2>
                    <span className='text-sm text-slate-400'>
                      {conceptualization[0]?.name || 'Diagrama D. Hernandes'}
                    </span>
                  </div>
                </div>

                {/* Dados de Infância */}
                {conceptualization[0]?.childhoodData && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h3 className='mb-3 text-sm font-medium uppercase text-slate-400'>
                      Dados Relevantes de Infância
                    </h3>
                    <p className='text-sm text-slate-300'>{conceptualization[0].childhoodData}</p>
                  </div>
                )}

                {/* Crença Central */}
                {conceptualization[0]?.coreBelief && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                      <Brain className='h-5 w-5 text-purple-400' />
                      Crença Central
                    </h2>
                    <div className='rounded-lg bg-[#0d1117] p-4'>
                      <p className='text-sm text-slate-300 whitespace-pre-wrap'>
                        {conceptualization[0].coreBelief}
                      </p>
                    </div>
                  </div>
                )}

                {/* Suposições Condicionais */}
                {conceptualization[0]?.conditionalAssumptions && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                      <Scale className='h-5 w-5 text-amber-400' />
                      Suposições Condicionais (Regras)
                    </h2>
                    <div className='rounded-lg bg-[#0d1117] p-4'>
                      <p className='text-sm text-slate-300 whitespace-pre-wrap'>
                        {conceptualization[0].conditionalAssumptions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estratégias Compensatórias */}
                {conceptualization[0]?.compensatoryStrategies && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                      <Activity className='h-5 w-5 text-sky-400' />
                      Estratégias Compensatórias
                    </h2>
                    <div className='rounded-lg bg-[#0d1117] p-4'>
                      <p className='text-sm text-slate-300 whitespace-pre-wrap'>
                        {conceptualization[0].compensatoryStrategies}
                      </p>
                    </div>
                  </div>
                )}

                {/* Situações */}
                {conceptualization[0]?.situations && (
                  <div className='rounded-xl border border-slate-700 bg-[#161b22] p-6'>
                    <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold text-white'>
                      <Scale className='h-5 w-5 text-amber-400' />
                      Situações Clínicas
                    </h2>
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-slate-700'>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>Situação</th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>Pensamento Automático</th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>Emoção</th>
                            <th className='pb-3 text-left text-xs font-medium uppercase text-slate-400'>Comportamento</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-700'>
                          {(() => {
                            try {
                              const situations = JSON.parse(conceptualization[0].situations as string)
                              return situations.map((sit: any, idx: number) => (
                                <tr key={idx}>
                                  <td className='py-3 text-sm text-slate-300'>{sit.situation || '-'}</td>
                                  <td className='py-3 text-sm text-slate-300'>{sit.automaticThought || '-'}</td>
                                  <td className='py-3 text-sm text-slate-300'>{sit.emotion || '-'}</td>
                                  <td className='py-3 text-sm text-slate-300'>{sit.behavior || '-'}</td>
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

        {/* Sessões (Journal Entries) */}
        {activeTab === 'sessions' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-white'>
                Histórico de Sessões ({journalEntries?.length || 0})
              </h2>
            </div>
            {journalEntries && journalEntries.length > 0 ? (
              <div className='space-y-3'>
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className='group rounded-xl border border-slate-700 bg-[#161b22] p-4 transition-all hover:border-sky-500/50'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400'>
                          <Calendar className='h-5 w-5' />
                        </div>
                        <div>
                          <h3 className='font-medium text-white'>
                            {entry.title || 'Sessão sem título'}
                          </h3>
                          <div className='mt-1 flex items-center gap-2 text-xs text-slate-400'>
                            <Clock className='h-3 w-3' />
                            {formatDate(entry.createdAt)}
                            {entry.mood && (
                              <>
                                <span>•</span>
                                <span className='capitalize'>{entry.mood}</span>
                              </>
                            )}
                          </div>
                          {entry.content && (
                            <p className='mt-2 line-clamp-2 text-sm text-slate-400'>
                              {entry.content}
                            </p>
                          )}
                          {entry.aiAnalysis && (
                            <div className='mt-3 rounded-lg bg-purple-500/10 p-3'>
                              <p className='text-xs font-medium text-purple-400'>Análise IA</p>
                              <p className='mt-1 text-sm text-slate-300 line-clamp-3'>
                                {entry.aiAnalysis}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-[#161b22] py-12'>
                <Calendar className='mb-4 h-12 w-12 text-slate-600' />
                <p className='text-slate-400'>Nenhuma sessão registrada</p>
                <p className='mt-1 text-sm text-slate-500'>
                  As sessões serão exibidas aqui após registros no journal
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
                    key={doc.id}
                    className='group flex items-center gap-3 rounded-xl border border-slate-700 bg-[#161b22] p-4 transition-all hover:border-sky-500/50'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20'>
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='truncate text-sm font-medium text-white'>{doc.fileName}</p>
                      <p className='text-xs text-slate-400'>
                        {formatDate(doc.createdAt)}
                        {doc.sessionDate && ` • ${formatDate(doc.sessionDate)}`}
                      </p>
                    </div>
                    <a
                      className='flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white'
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
