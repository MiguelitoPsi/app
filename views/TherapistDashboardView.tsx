'use client'

import {
  AlertCircle,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  ListTodo,
  Settings,
  Smile,
  Star,
  Target,
  Trophy,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { trpc } from '@/lib/trpc/client'

const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

type TherapistDashboardTab = 'overview' | 'patients' | 'challenges' | 'achievements'

const MOOD_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  happy: {
    emoji: '😄',
    label: 'Feliz',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  calm: {
    emoji: '😌',
    label: 'Calmo',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  neutral: {
    emoji: '😐',
    label: 'Neutro',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
  sad: {
    emoji: '😔',
    label: 'Triste',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  anxious: {
    emoji: '😰',
    label: 'Ansioso',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  angry: {
    emoji: '😡',
    label: 'Bravo',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

export const TherapistDashboardView: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TherapistDashboardTab>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [showPatientList, setShowPatientList] = useState(false)
  const [patientSubTab, setPatientSubTab] = useState<'summary' | 'mood' | 'journal'>('summary')

  const { data: statsData, isLoading: statsLoading } = trpc.therapistXp.getStats.useQuery()
  const { data: activitySummary } = trpc.therapistXp.getActivitySummary.useQuery()
  const { data: challengesData } = trpc.therapistChallenges.getCurrentWeek.useQuery()
  const { data: achievementProgress } = trpc.therapistAchievements.getProgress.useQuery()
  const { data: challengeStats } = trpc.therapistChallenges.getStats.useQuery()
  const { data: patients } = trpc.patient.getAll.useQuery()

  const { data: moodHistory, isLoading: isLoadingMood } =
    trpc.therapistReports.getPatientMoodHistory.useQuery(
      { patientId: selectedPatientId ?? '', limit: 30 },
      { enabled: Boolean(selectedPatientId) }
    )

  const { data: journalEntries, isLoading: isLoadingJournal } =
    trpc.therapistReports.getPatientJournalEntries.useQuery(
      { patientId: selectedPatientId ?? '', limit: 20 },
      { enabled: Boolean(selectedPatientId) }
    )

  const { data: patientSummary, isLoading: isLoadingSummary } =
    trpc.therapistReports.getPatientSummary.useQuery(
      { patientId: selectedPatientId ?? '' },
      { enabled: Boolean(selectedPatientId) }
    )

  const stats = statsData?.stats
  const selectedPatient = patients?.find((p) => p.id === selectedPatientId)

  const weeklyActivity = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    return days.map((day, i) => ({
      name: day,
      xp: Math.floor(Math.random() * 100) + 20 + (i < 5 ? 30 : 0),
    }))
  }, [])

  const unlockedAchievements = achievementProgress?.filter((a) => a.isUnlocked).length || 0
  const totalAchievements = achievementProgress?.length || 0
  const completedChallenges = challengesData?.filter((c) => c.status === 'completed').length || 0
  const totalChallenges = challengesData?.length || 0

  const formatDate = (date: Date | string): string =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const formatDateTime = (date: Date | string): string =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (statsLoading) {
    return (
      <div className='flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent' />
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      <header className='relative z-10 bg-gradient-to-br from-violet-600 to-purple-700 pt-safe text-white'>
        <div className='px-4 pt-6 pb-8 sm:px-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <Avatar mood='happy' size='lg' />
              </div>
              <div>
                <p className='text-sm text-white/80'>Bem-vindo(a) de volta!</p>
                <h1 className='font-bold text-xl'>Área do Terapeuta</h1>
              </div>
            </div>
            <button
              aria-label='Configurações'
              className='rounded-full p-2 transition-colors hover:bg-white/10'
              onClick={() => setShowSettings(true)}
              type='button'
            >
              <Settings className='h-6 w-6' />
            </button>
          </div>

          <div className='mt-6 grid grid-cols-4 gap-2 text-center'>
            <div className='rounded-xl bg-white/10 p-3'>
              <Users className='mx-auto mb-1 h-5 w-5' />
              <p className='font-bold text-lg'>{stats?.totalPatientsManaged || 0}</p>
              <p className='text-white/70 text-xs'>Pacientes</p>
            </div>
            <div className='rounded-xl bg-white/10 p-3'>
              <FileText className='mx-auto mb-1 h-5 w-5' />
              <p className='font-bold text-lg'>{stats?.totalReportsViewed || 0}</p>
              <p className='text-white/70 text-xs'>Relatórios</p>
            </div>
            <div className='rounded-xl bg-white/10 p-3'>
              <CheckCircle2 className='mx-auto mb-1 h-5 w-5' />
              <p className='font-bold text-lg'>{stats?.totalSessionsCompleted || 0}</p>
              <p className='text-white/70 text-xs'>Sessões</p>
            </div>
            <div className='rounded-xl bg-white/10 p-3'>
              <Trophy className='mx-auto mb-1 h-5 w-5' />
              <p className='font-bold text-lg'>{stats?.currentStreak || 0}</p>
              <p className='text-white/70 text-xs'>Streak</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs estilo cards coloridos */}
      <div className='bg-slate-50 px-4 py-4 dark:bg-slate-950'>
        <div className='grid grid-cols-4 gap-3'>
          {[
            {
              id: 'overview',
              label: 'Visão Geral',
              icon: BarChart2,
              bgColor: 'bg-emerald-500',
              hoverBg: 'hover:bg-emerald-600',
            },
            {
              id: 'patients',
              label: 'Pacientes',
              icon: Users,
              bgColor: 'bg-rose-500',
              hoverBg: 'hover:bg-rose-600',
            },
            {
              id: 'challenges',
              label: 'Desafios',
              icon: Target,
              bgColor: 'bg-cyan-500',
              hoverBg: 'hover:bg-cyan-600',
            },
            {
              id: 'achievements',
              label: 'Conquistas',
              icon: Award,
              bgColor: 'bg-violet-500',
              hoverBg: 'hover:bg-violet-600',
            },
          ].map((tab) => (
            <button
              className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 ${tab.bgColor} ${tab.hoverBg} ${
                activeTab === tab.id
                  ? 'scale-105 shadow-xl ring-4 ring-white/30'
                  : 'shadow-lg hover:scale-[1.02]'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TherapistDashboardTab)}
              type='button'
            >
              <tab.icon className='h-8 w-8 text-white' strokeWidth={1.5} />
              <span className='px-1 text-center font-semibold text-white text-xs leading-tight'>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className='flex-1 overflow-y-auto px-4 py-6 pb-safe sm:px-6'>
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            <section>
              <h2 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                Ações Rápidas
              </h2>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  className='flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800'
                  onClick={() => router.push('/reports')}
                  type='button'
                >
                  <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30'>
                    <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='text-left'>
                    <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                      Relatórios
                    </p>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>Documentos</p>
                  </div>
                </button>
                <button
                  className='flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800'
                  onClick={() => router.push('/routine')}
                  type='button'
                >
                  <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900/30'>
                    <ListTodo className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </div>
                  <div className='text-left'>
                    <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>Rotina</p>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>Gerenciar tarefas</p>
                  </div>
                </button>
                <button
                  className='flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800'
                  onClick={() => router.push('/financial')}
                  type='button'
                >
                  <div className='rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30'>
                    <Wallet className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  <div className='text-left'>
                    <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                      Financeiro
                    </p>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>
                      Gestão profissional
                    </p>
                  </div>
                </button>
                <button
                  className='flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800'
                  onClick={() => setActiveTab('patients')}
                  type='button'
                >
                  <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30'>
                    <Users className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                  </div>
                  <div className='text-left'>
                    <p className='font-medium text-slate-800 text-sm dark:text-slate-200'>
                      Pacientes
                    </p>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>Ver progresso</p>
                  </div>
                </button>
              </div>
            </section>

            <section className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
              <h2 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                Atividade Semanal
              </h2>
              <div className='h-40'>
                <ResponsiveContainer height='100%' width='100%'>
                  <AreaChart data={weeklyActivity}>
                    <defs>
                      <linearGradient id='colorXp' x1='0' x2='0' y1='0' y2='1'>
                        <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      axisLine={false}
                      dataKey='name'
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      dataKey='xp'
                      fill='url(#colorXp)'
                      stroke='#8b5cf6'
                      strokeWidth={2}
                      type='monotone'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
              <h2 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                Resumo de Atividades
              </h2>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30'>
                      <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    </div>
                    <span className='text-slate-600 text-sm dark:text-slate-300'>
                      Relatórios Revisados
                    </span>
                  </div>
                  <span className='font-semibold text-slate-800 dark:text-slate-200'>
                    {activitySummary?.reportsViewed || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900/30'>
                      <ListTodo className='h-4 w-4 text-green-600 dark:text-green-400' />
                    </div>
                    <span className='text-slate-600 text-sm dark:text-slate-300'>
                      Tarefas Criadas
                    </span>
                  </div>
                  <span className='font-semibold text-slate-800 dark:text-slate-200'>
                    {activitySummary?.tasksCreated || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30'>
                      <Star className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                    </div>
                    <span className='text-slate-600 text-sm dark:text-slate-300'>
                      Feedback Enviado
                    </span>
                  </div>
                  <span className='font-semibold text-slate-800 dark:text-slate-200'>
                    {activitySummary?.feedbackSent || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30'>
                      <Award className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                    </div>
                    <span className='text-slate-600 text-sm dark:text-slate-300'>
                      Recompensas Aprovadas
                    </span>
                  </div>
                  <span className='font-semibold text-slate-800 dark:text-slate-200'>
                    {activitySummary?.rewardsApproved || 0}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className='space-y-4'>
            <div>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'
                onClick={() => setShowPatientList(!showPatientList)}
                type='button'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500'>
                    <User className='h-5 w-5 text-white' />
                  </div>
                  <div className='text-left'>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>Paciente</p>
                    <p className='font-medium text-slate-800 dark:text-slate-200'>
                      {selectedPatient?.name ?? 'Selecione um paciente'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${showPatientList ? 'rotate-180' : ''}`}
                />
              </button>

              {showPatientList && (
                <div className='mt-2 max-h-60 overflow-y-auto rounded-xl bg-white shadow-lg dark:bg-slate-800'>
                  {patients?.map((patient) => (
                    <button
                      className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedPatientId === patient.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
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
                      <div className='flex-1'>
                        <p className='font-medium text-slate-800 dark:text-slate-200'>
                          {patient.name}
                        </p>
                        <p className='text-slate-500 text-sm'>{patient.email}</p>
                      </div>
                      {selectedPatientId === patient.id && (
                        <CheckCircle2 className='h-5 w-5 text-violet-500' />
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

            {selectedPatientId ? (
              <>
                <div className='flex gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-800'>
                  {[
                    { id: 'summary', label: 'Resumo', icon: BarChart2 },
                    { id: 'mood', label: 'Humor', icon: Smile },
                    { id: 'journal', label: 'Diário', icon: BookOpen },
                  ].map((tab) => (
                    <button
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${patientSubTab === tab.id ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                      key={tab.id}
                      onClick={() => setPatientSubTab(tab.id as typeof patientSubTab)}
                      type='button'
                    >
                      <tab.icon className='h-4 w-4' />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {patientSubTab === 'summary' && (
                  <div className='space-y-4'>
                    {isLoadingSummary ? (
                      <div className='flex h-40 items-center justify-center'>
                        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
                      </div>
                    ) : patientSummary ? (
                      <>
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <p className='text-slate-500 text-xs'>Registros de Humor</p>
                            <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                              {patientSummary.last30Days.moodEntries}
                            </p>
                            <p className='text-slate-400 text-xs'>últimos 30 dias</p>
                          </div>
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <p className='text-slate-500 text-xs'>Entradas no Diário</p>
                            <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                              {patientSummary.last30Days.journalEntries}
                            </p>
                            <p className='text-slate-400 text-xs'>últimos 30 dias</p>
                          </div>
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <p className='text-slate-500 text-xs'>Tarefas Completadas</p>
                            <p className='font-bold text-2xl text-slate-800 dark:text-slate-100'>
                              {patientSummary.last30Days.tasksCompleted}/
                              {patientSummary.last30Days.tasksCreated}
                            </p>
                            <p className='text-slate-400 text-xs'>
                              {patientSummary.last30Days.taskCompletionRate}%
                            </p>
                          </div>
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <p className='text-slate-500 text-xs'>Frequência de Humor</p>
                            <div className='mt-1 flex flex-wrap gap-1'>
                              {Object.entries(patientSummary.moodFrequency)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                                .map(([mood, count]) => (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${MOOD_CONFIG[mood]?.color ?? 'bg-slate-100'}`}
                                    key={mood}
                                  >
                                    {MOOD_CONFIG[mood]?.emoji} {count}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                        {patientSummary.recentMoods.length > 0 && (
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                              Humor Recente
                            </h3>
                            <div className='flex flex-wrap gap-2'>
                              {patientSummary.recentMoods.map((mood) => (
                                <div
                                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${MOOD_CONFIG[mood.mood]?.color ?? 'bg-slate-100'}`}
                                  key={mood.id}
                                >
                                  <span>{MOOD_CONFIG[mood.mood]?.emoji}</span>
                                  <span className='text-sm'>{formatDate(mood.createdAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {patientSummary.recentJournals.length > 0 && (
                          <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                            <h3 className='mb-3 font-semibold text-slate-800 dark:text-slate-200'>
                              Últimas Entradas do Diário
                            </h3>
                            <div className='space-y-2'>
                              {patientSummary.recentJournals.slice(0, 3).map((entry) => (
                                <div
                                  className='rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50'
                                  key={entry.id}
                                >
                                  <p className='line-clamp-2 text-slate-700 text-sm dark:text-slate-300'>
                                    {entry.content}
                                  </p>
                                  <p className='mt-1 text-slate-400 text-xs'>
                                    {formatDate(entry.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className='flex h-40 items-center justify-center'>
                        <AlertCircle className='mr-2 h-5 w-5 text-slate-400' />
                        <p className='text-slate-500'>Erro ao carregar resumo</p>
                      </div>
                    )}
                  </div>
                )}

                {patientSubTab === 'mood' && (
                  <div className='space-y-3'>
                    {isLoadingMood ? (
                      <div className='flex h-40 items-center justify-center'>
                        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
                      </div>
                    ) : moodHistory && moodHistory.length > 0 ? (
                      moodHistory.map((mood) => (
                        <div
                          className='flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'
                          key={mood.id}
                        >
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${MOOD_CONFIG[mood.mood]?.color ?? 'bg-slate-100'}`}
                          >
                            {MOOD_CONFIG[mood.mood]?.emoji ?? '😐'}
                          </div>
                          <div className='flex-1'>
                            <p className='font-medium text-slate-800 dark:text-slate-200'>
                              {MOOD_CONFIG[mood.mood]?.label ?? mood.mood}
                            </p>
                            <p className='text-slate-500 text-sm'>
                              {formatDateTime(mood.createdAt)}
                            </p>
                          </div>
                          {mood.xpAwarded > 0 && (
                            <span className='rounded-full bg-violet-100 px-2 py-1 font-medium text-violet-700 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                              +{mood.xpAwarded} XP
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className='flex h-40 flex-col items-center justify-center'>
                        <Smile className='mb-3 h-12 w-12 text-slate-300' />
                        <p className='text-slate-500'>Nenhum registro de humor</p>
                      </div>
                    )}
                  </div>
                )}

                {patientSubTab === 'journal' && (
                  <div className='space-y-3'>
                    {isLoadingJournal ? (
                      <div className='flex h-40 items-center justify-center'>
                        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
                      </div>
                    ) : journalEntries && journalEntries.length > 0 ? (
                      journalEntries.map((entry) => {
                        const moodKey = entry.mood ?? 'neutral'
                        return (
                          <div
                            className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'
                            key={entry.id}
                          >
                            <div className='mb-3 flex items-center justify-between'>
                              <span
                                className={`rounded-full px-3 py-1 text-sm ${MOOD_CONFIG[moodKey]?.color ?? 'bg-slate-100'}`}
                              >
                                {MOOD_CONFIG[moodKey]?.emoji} {MOOD_CONFIG[moodKey]?.label}
                              </span>
                              <span className='text-slate-400 text-sm'>
                                {formatDateTime(entry.createdAt)}
                              </span>
                            </div>
                            <p className='mb-2 text-slate-700 dark:text-slate-300'>
                              {entry.content}
                            </p>
                            {entry.aiAnalysis && (
                              <div className='mt-3 rounded-lg bg-violet-50 p-3 dark:bg-violet-900/20'>
                                <p className='mb-1 font-medium text-violet-700 text-xs dark:text-violet-400'>
                                  Análise IA
                                </p>
                                <p className='text-violet-600 text-sm dark:text-violet-300'>
                                  {entry.aiAnalysis}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className='flex h-40 flex-col items-center justify-center'>
                        <BookOpen className='mb-3 h-12 w-12 text-slate-300' />
                        <p className='text-slate-500'>Nenhuma entrada no diário</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className='flex h-64 flex-col items-center justify-center text-center'>
                <Users className='mb-4 h-16 w-16 text-slate-300' />
                <h2 className='mb-2 font-semibold text-lg text-slate-700 dark:text-slate-200'>
                  Selecione um paciente
                </h2>
                <p className='text-slate-500 text-sm'>
                  Escolha um paciente para ver seu progresso detalhado
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='font-semibold text-slate-800 dark:text-slate-200'>
                Desafios da Semana
              </h2>
              <span className='rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'>
                {completedChallenges}/{totalChallenges} completos
              </span>
            </div>
            <div className='space-y-4'>
              {challengesData?.map((challenge) => (
                <div
                  className={`rounded-xl p-4 shadow-sm transition-all ${challenge.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-800'}`}
                  key={challenge.id}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={`rounded-lg p-2 ${challenge.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-violet-100 dark:bg-violet-900/30'}`}
                      >
                        <span className='text-xl'>{challenge.template?.icon || '🎯'}</span>
                      </div>
                      <div>
                        <h3 className='font-medium text-slate-800 dark:text-slate-200'>
                          {challenge.title}
                        </h3>
                        <p className='text-slate-500 text-sm dark:text-slate-400'>
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    {challenge.status === 'completed' && (
                      <CheckCircle2 className='h-5 w-5 text-green-500' />
                    )}
                  </div>
                  <div className='mt-4'>
                    <div className='mb-1 flex items-center justify-between text-sm'>
                      <span className='text-slate-500 dark:text-slate-400'>Progresso</span>
                      <span className='text-slate-700 dark:text-slate-300'>
                        {challenge.currentCount}/{challenge.targetCount}
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                      <div
                        className={`h-full rounded-full transition-all ${challenge.status === 'completed' ? 'bg-green-500' : 'bg-violet-500'}`}
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className='mt-3 flex items-center justify-between'>
                    <span className='text-slate-500 text-sm dark:text-slate-400'>
                      Dificuldade:{' '}
                      {challenge.template?.difficulty === 'easy'
                        ? 'Fácil'
                        : challenge.template?.difficulty === 'medium'
                          ? 'Médio'
                          : 'Difícil'}
                    </span>
                    <span className='font-medium text-amber-600 text-sm dark:text-amber-400'>
                      +{challenge.xpReward * challenge.bonusMultiplier} XP
                    </span>
                  </div>
                </div>
              ))}
              {(!challengesData || challengesData.length === 0) && (
                <div className='rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-800'>
                  <Target className='mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600' />
                  <p className='text-slate-500 dark:text-slate-400'>
                    Novos desafios serão gerados em breve!
                  </p>
                </div>
              )}
            </div>
            {challengeStats && (
              <section className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                <h3 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                  Estatísticas
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <p className='font-bold text-2xl text-violet-600 dark:text-violet-400'>
                      {challengeStats.completedChallenges}
                    </p>
                    <p className='text-slate-500 text-sm dark:text-slate-400'>Completados</p>
                  </div>
                  <div className='text-center'>
                    <p className='font-bold text-2xl text-green-600 dark:text-green-400'>
                      {challengeStats.completionRate}%
                    </p>
                    <p className='text-slate-500 text-sm dark:text-slate-400'>Taxa de Conclusão</p>
                  </div>
                  <div className='text-center'>
                    <p className='font-bold text-2xl text-blue-600 dark:text-blue-400'>
                      {challengeStats.perfectWeeks}
                    </p>
                    <p className='text-slate-500 text-sm dark:text-slate-400'>Semanas Perfeitas</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='font-semibold text-slate-800 dark:text-slate-200'>Suas Conquistas</h2>
              <span className='rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>
                {unlockedAchievements}/{totalAchievements} desbloqueadas
              </span>
            </div>
            <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
              {achievementProgress?.slice(0, 12).map((achievement) => (
                <button
                  className={`relative flex flex-col items-center rounded-xl p-3 transition-all ${achievement.isUnlocked ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}
                  key={achievement.id}
                  type='button'
                >
                  <span className={`text-3xl ${!achievement.isUnlocked && 'grayscale opacity-40'}`}>
                    {achievement.icon}
                  </span>
                  <p
                    className={`mt-1 text-center text-xs ${achievement.isUnlocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {achievement.name}
                  </p>
                  {!achievement.isUnlocked && (
                    <div className='mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                      <div
                        className='h-full rounded-full bg-violet-500'
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-violet-100 py-3 font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50'
              onClick={() => router.push('/achievements')}
              type='button'
            >
              Ver Todas as Conquistas
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        )}
      </main>

      {showSettings && (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center'>
          <div className='w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-slate-800'>
            <h2 className='mb-4 font-semibold text-lg text-slate-800 dark:text-slate-200'>
              Configurações
            </h2>
            <div className='space-y-4'>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-slate-700'
                onClick={() => router.push('/profile')}
                type='button'
              >
                <span className='text-slate-700 dark:text-slate-200'>Meu Perfil</span>
                <ChevronRight className='h-5 w-5 text-slate-400' />
              </button>
              <button
                className='w-full rounded-xl bg-red-100 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                onClick={() => router.push('/auth/signin')}
                type='button'
              >
                Sair da Conta
              </button>
            </div>
            <button
              className='mt-4 w-full rounded-xl bg-slate-100 p-3 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              onClick={() => setShowSettings(false)}
              type='button'
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TherapistDashboardView
