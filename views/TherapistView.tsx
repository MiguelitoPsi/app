'use client'

import {
  Activity,
  ArrowLeft,
  BarChart2,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  Gift,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { useGame } from '../context/GameContext'
import type { Mood, Reward } from '../types'

type TherapistViewProps = {
  goBack: () => void
}

// Mock data for demo purposes
const DEMO_PATIENT = {
  name: 'Ana (Demo)',
  stats: {
    level: 5,
    streak: 12,
    totalMeditationMinutes: 145,
    totalTasksCompleted: 32,
    totalJournals: 8,
    points: 450,
  },
  moodData: [
    { name: 'Seg', score: 40 },
    { name: 'Ter', score: 50 },
    { name: 'Qua', score: 30 },
    { name: 'Qui', score: 60 },
    { name: 'Sex', score: 55 },
    { name: 'Sáb', score: 70 },
    { name: 'Dom', score: 80 },
  ],
  journal: [
    {
      id: 'demo1',
      timestamp: Date.now() - 86_400_000 * 2,
      emotion: 'anxious' as Mood,
      intensity: 8,
      thought: 'Sinto que não vou conseguir entregar o projeto a tempo.',
      aiAnalysis:
        'Pensamento catastrófico identificado. Tente focar nas etapas pequenas que você já concluiu.',
    },
  ],
}

export const TherapistView: React.FC<TherapistViewProps> = ({ goBack }) => {
  const { stats: realStats, journal: realJournal, updateReward } = useGame()
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [activeSection, setActiveSection] = useState<
    'overview' | 'journal' | 'rewards' | 'profile'
  >('overview')

  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const patientDropdownRef = useRef<HTMLDivElement>(null)
  const patientSearchInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPatientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isPatientDropdownOpen && patientSearchInputRef.current) {
      patientSearchInputRef.current.focus()
    }
  }, [isPatientDropdownOpen])

  // Fetch linked patients
  const {
    data: linkedPatients = [],
    isLoading: isLoadingPatients,
    refetch: refetchPatients,
  } = trpc.patient.getMyPatients.useQuery()

  // Fetch patient top emotions
  const { data: topEmotionsData } = trpc.analytics.getPatientTopEmotions.useQuery(
    { patientId: selectedPatientId, days: 30 },
    { enabled: !!selectedPatientId }
  )

  // Remove patient mutation
  const removePatientMutation = trpc.patient.removePatient.useMutation({
    onSuccess: () => {
      refetchPatients()
      setSelectedPatientId('')
    },
  })

  // Journal filter state
  const [journalDateFilter, setJournalDateFilter] = useState<string>('')
  const [journalEmotionFilter, setJournalEmotionFilter] = useState<Mood | ''>('')
  const [isJournalFilterOpen, setIsJournalFilterOpen] = useState(false)

  // Reward Management State
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [rewardCost, setRewardCost] = useState<string>('')
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)

  const openCostModal = (reward: Reward) => {
    setEditingReward(reward)
    setRewardCost(reward.cost > 0 ? reward.cost.toString() : '')
    setIsCostModalOpen(true)
  }

  const saveRewardCost = () => {
    if (!editingReward) {
      return
    }
    const cost = Number.parseInt(rewardCost, 10)
    if (Number.isNaN(cost) || cost < 0) {
      return
    }

    updateReward(editingReward.id, {
      cost,
      status: 'approved',
    })

    setIsCostModalOpen(false)
    setEditingReward(null)
    setRewardCost('')
  }

  const handleRemovePatient = (relationshipId: string, patientName: string) => {
    if (confirm(`Tem certeza que deseja remover o vínculo com ${patientName}?`)) {
      removePatientMutation.mutate({ relationshipId })
    }
  }

  // Helper to normalize patient data from database
  const normalizePatientStats = (patient: any) => {
    if (!patient) return realStats

    return {
      ...realStats,
      name: patient.name,
      level: patient.level || 1,
      streak: patient.streak || 0,
      points: patient.coins || 0,
      totalMeditationMinutes: patient.stats?.totalMeditations || 0,
      totalTasksCompleted: patient.stats?.completedTasks || 0,
      totalJournals: patient.stats?.totalJournalEntries || 0,
    }
  }

  // Determine which data to show
  const selectedPatient = linkedPatients.find((p) => p.id === selectedPatientId)
  const _patientName = selectedPatient?.name || realStats.name
  const stats = normalizePatientStats(selectedPatient)

  const journalDataRaw = realJournal // TODO: Fetch patient-specific journal when implemented
  const rewardsData = realStats.rewards // TODO: Fetch patient-specific rewards when implemented

  // Filter journal data based on filters
  const journalData = journalDataRaw.filter((entry) => {
    // Filter by emotion
    if (journalEmotionFilter && entry.emotion !== journalEmotionFilter) {
      return false
    }
    // Filter by date
    if (journalDateFilter) {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0]
      if (entryDate !== journalDateFilter) {
        return false
      }
    }
    return true
  })

  // Clear journal filters
  const clearJournalFilters = () => {
    setJournalDateFilter('')
    setJournalEmotionFilter('')
  }

  // Check if any filter is active
  const hasActiveJournalFilters = journalDateFilter || journalEmotionFilter

  // Count emotions in journal entries (use raw data for counts)
  const emotionCounts = journalDataRaw.reduce(
    (acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Format data for chart (using real data or demo data)
  const chartData = [
    { name: 'Seg', score: 0 },
    { name: 'Ter', score: 0 },
    { name: 'Qua', score: 0 },
    { name: 'Qui', score: 0 },
    { name: 'Sex', score: 0 },
    { name: 'Sáb', score: 0 },
    { name: 'Dom', score: 0 },
  ]

  const getMoodColor = (mood: Mood) => {
    switch (mood) {
      case 'happy':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
      case 'sad':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
      case 'anxious':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
      case 'angry':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
      case 'calm':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const getMoodEmoji = (mood: Mood) => {
    const map: Record<string, string> = {
      happy: '😄',
      sad: '😔',
      anxious: '😰',
      angry: '😡',
      calm: '😌',
      neutral: '😐',
    }
    return map[mood] || '😐'
  }

  const handleInvite = async () => {
    try {
      // For now, we'll create a simple invite link
      // In a full implementation, this would call the sendInvite mutation
      const inviteLink = `${window.location.origin}/therapist-invite/${realStats.id || 'unknown'}`
      await navigator.clipboard.writeText(inviteLink)
      alert(
        'Link de convite copiado!\n\nCompartilhe este link com seu cliente para que ele possa se cadastrar vinculado ao seu perfil.'
      )
    } catch (error) {
      alert('Erro ao copiar link. Por favor, tente novamente.')
    }
  }

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <div className='relative z-20 overflow-visible rounded-b-2xl border-slate-100 border-b bg-white px-4 pb-4 pt-safe shadow-sm sm:rounded-b-[2rem] sm:px-6 sm:pb-6 dark:border-slate-800 dark:bg-slate-900'>
        <div className='mb-4 flex items-center justify-between sm:mb-6'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='rounded-xl bg-indigo-600 p-2 text-white shadow-indigo-200 shadow-lg sm:rounded-2xl sm:p-3 dark:shadow-none'>
              <Activity className='sm:hidden' size={20} />
              <Activity className='hidden sm:block' size={24} />
            </div>
            <div>
              <h1 className='font-black text-slate-800 text-lg tracking-tight sm:text-xl dark:text-white'>
                Portal do Especialista
              </h1>
              <p className='font-medium text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                Acompanhamento de Pacientes
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1.5 sm:gap-2'>
            <button
              className='touch-target rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-200 sm:rounded-xl dark:shadow-none'
              onClick={handleInvite}
              title='Convidar Cliente'
              type='button'
            >
              <UserPlus className='sm:hidden' size={18} />
              <UserPlus className='hidden sm:block' size={20} />
            </button>
            <button
              className='touch-target rounded-lg bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 sm:rounded-xl dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              onClick={goBack}
              title='Voltar ao App'
              type='button'
            >
              <ArrowLeft className='sm:hidden' size={18} />
              <ArrowLeft className='hidden sm:block' size={20} />
            </button>
            <button
              className='touch-target rounded-lg bg-slate-100 p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 sm:rounded-xl dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = '/auth/signin'
                    },
                  },
                })
              }}
              title='Sair'
              type='button'
            >
              <LogOut className='sm:hidden' size={18} />
              <LogOut className='hidden sm:block' size={20} />
            </button>
          </div>
        </div>

        {/* Patient Selector */}
        {linkedPatients.length > 0 && (
          <div className='group relative' ref={patientDropdownRef}>
            <label className='mb-1.5 ml-1 block font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:mb-2 sm:text-xs'>
              Paciente Selecionado
            </label>
            <div className='relative'>
              <button
                className='touch-target w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 p-3 pl-10 pr-10 text-left font-bold text-sm text-slate-700 outline-none transition-all hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500 sm:rounded-2xl sm:p-4 sm:pl-12 sm:pr-12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50'
                disabled={isLoadingPatients}
                onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                type='button'
              >
                {selectedPatientId
                  ? linkedPatients.find((p) => p.id === selectedPatientId)?.name
                  : 'Selecione um paciente'}
              </button>
              <div className='-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 rounded-md bg-white p-1 shadow-sm sm:left-4 sm:rounded-lg sm:p-1.5 dark:bg-slate-700'>
                <Users className='text-indigo-500 dark:text-indigo-400' size={14} />
              </div>
              <ChevronDown
                className={`-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 text-slate-400 transition-all group-hover:text-indigo-500 sm:right-4 ${isPatientDropdownOpen ? 'rotate-180' : ''}`}
                size={18}
              />

              {/* Dropdown with search */}
              {isPatientDropdownOpen && (
                <div className='absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:rounded-2xl dark:border-slate-700 dark:bg-slate-800'>
                  {/* Search input */}
                  <div className='border-slate-100 border-b p-2 dark:border-slate-700'>
                    <div className='relative'>
                      <input
                        className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 pl-9 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500'
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        placeholder='Pesquisar por nome...'
                        ref={patientSearchInputRef}
                        type='text'
                        value={patientSearchQuery}
                      />
                      <Search
                        className='-translate-y-1/2 absolute top-1/2 left-3 text-slate-400'
                        size={16}
                      />
                    </div>
                  </div>

                  {/* Patient list */}
                  <div className='max-h-60 overflow-y-auto'>
                    <button
                      className={`w-full p-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                        selectedPatientId
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      }`}
                      onClick={() => {
                        setSelectedPatientId('')
                        setIsPatientDropdownOpen(false)
                        setPatientSearchQuery('')
                      }}
                      type='button'
                    >
                      Selecione um paciente
                    </button>
                    {linkedPatients
                      .filter((patient) =>
                        patient.name.toLowerCase().includes(patientSearchQuery.toLowerCase())
                      )
                      .map((patient) => (
                        <button
                          className={`w-full p-3 text-left text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                            selectedPatientId === patient.id
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatientId(patient.id)
                            setIsPatientDropdownOpen(false)
                            setPatientSearchQuery('')
                          }}
                          type='button'
                        >
                          {patient.name}
                        </button>
                      ))}
                    {linkedPatients.filter((patient) =>
                      patient.name.toLowerCase().includes(patientSearchQuery.toLowerCase())
                    ).length === 0 &&
                      patientSearchQuery && (
                        <div className='p-3 text-center text-slate-400 text-sm'>
                          Nenhum paciente encontrado
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='relative z-10 flex-1 space-y-4 overflow-y-auto p-4 pb-28 sm:space-y-6 sm:p-6 sm:pb-32'>
        {selectedPatientId ? (
          <>
            {/* Navigation Tabs - Only shown when patient is selected */}
            <div className='flex rounded-lg border border-slate-100 bg-white p-1 shadow-sm sm:rounded-xl dark:border-slate-800 dark:bg-slate-900'>
              <button
                className={`touch-target flex-1 rounded-md py-2 font-bold text-[10px] transition-all duration-300 sm:rounded-lg sm:py-3 sm:text-sm ${activeSection === 'overview' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                onClick={() => setActiveSection('overview')}
                type='button'
              >
                Visão Geral
              </button>
              <button
                className={`touch-target flex-1 rounded-md py-2 font-bold text-[10px] transition-all duration-300 sm:rounded-lg sm:py-3 sm:text-sm ${activeSection === 'journal' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                onClick={() => setActiveSection('journal')}
                type='button'
              >
                Diário ({journalData.length})
              </button>
              <button
                className={`touch-target flex-1 rounded-md py-2 font-bold text-[10px] transition-all duration-300 sm:rounded-lg sm:py-3 sm:text-sm ${activeSection === 'rewards' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                onClick={() => setActiveSection('rewards')}
                type='button'
              >
                Recompensas
              </button>
              <button
                className={`touch-target flex-1 rounded-md py-2 font-bold text-[10px] transition-all duration-300 sm:rounded-lg sm:py-3 sm:text-sm ${activeSection === 'profile' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                onClick={() => setActiveSection('profile')}
                type='button'
              >
                Perfil
              </button>
            </div>
          </>
        ) : null}
        {selectedPatientId ? (
          activeSection === 'overview' && (
            <div className='fade-in slide-in-from-bottom-4 animate-in space-y-4 duration-500 sm:space-y-6'>
              {/* Key Metrics */}
              <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
                  <div className='mb-2 flex items-center gap-1.5 text-slate-400 sm:mb-3 sm:gap-2'>
                    <div className='rounded-md bg-teal-50 p-1.5 text-teal-500 sm:rounded-lg sm:p-2 dark:bg-teal-900/20'>
                      <Clock size={16} />
                    </div>
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Meditação
                    </span>
                  </div>
                  <p className='font-black text-2xl text-slate-800 sm:text-3xl dark:text-white'>
                    {stats.totalMeditationMinutes}{' '}
                    <span className='font-medium text-slate-400 text-xs sm:text-sm'>min</span>
                  </p>
                </div>
                <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
                  <div className='mb-2 flex items-center gap-1.5 text-slate-400 sm:mb-3 sm:gap-2'>
                    <div className='rounded-md bg-violet-50 p-1.5 text-violet-500 sm:rounded-lg sm:p-2 dark:bg-violet-900/20'>
                      <FileText size={16} />
                    </div>
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Registros
                    </span>
                  </div>
                  <p className='font-black text-2xl text-slate-800 sm:text-3xl dark:text-white'>
                    {stats.totalJournals}
                  </p>
                </div>
                <div className='relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-indigo-200 shadow-lg sm:rounded-3xl sm:p-6 dark:shadow-none'>
                  <div className='-mr-8 -mt-8 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 blur-2xl sm:-mr-10 sm:-mt-10 sm:h-32 sm:w-32' />

                  <div className='relative z-10 mb-3 flex items-center gap-1.5 text-indigo-100 sm:mb-4 sm:gap-2'>
                    <Activity size={16} />
                    <span className='font-bold text-[10px] uppercase tracking-wider sm:text-xs'>
                      Engajamento
                    </span>
                  </div>
                  <div className='relative z-10 flex items-end justify-between'>
                    <div>
                      <p className='mb-1 font-black text-2xl sm:text-3xl'>Nível {stats.level}</p>
                      <div className='flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 font-medium text-indigo-100 text-xs sm:gap-2 sm:px-3 sm:text-sm'>
                        <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 sm:h-2 sm:w-2' />
                        Ofensiva de {stats.streak} dias
                      </div>
                    </div>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/20 font-bold text-lg sm:h-16 sm:w-16 sm:text-xl'>
                      {Math.min(100, stats.streak * 10)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Mood Chart */}
              <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
                <h3 className='mb-4 flex items-center gap-2 font-bold text-sm text-slate-800 sm:mb-6 sm:gap-3 sm:text-base dark:text-white'>
                  <div className='rounded-lg bg-indigo-50 p-1.5 text-indigo-500 sm:rounded-xl sm:p-2 dark:bg-indigo-900/20'>
                    <BarChart2 size={18} />
                  </div>
                  Variação de Humor
                </h3>
                <div className='h-44 w-full sm:h-56'>
                  <ResponsiveContainer height='100%' width='100%'>
                    <LineChart data={chartData}>
                      <CartesianGrid
                        opacity={0.5}
                        stroke='#e2e8f0'
                        strokeDasharray='3 3'
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey='name'
                        dy={10}
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          padding: '12px',
                        }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line
                        activeDot={{ r: 8, fill: '#4f46e5' }}
                        dataKey='score'
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }}
                        stroke='#6366f1'
                        strokeWidth={4}
                        type='monotone'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Emotions Annotation */}
                {topEmotionsData && topEmotionsData.topEmotions.length > 0 && (
                  <div className='mt-4 border-slate-100 border-t pt-4 sm:mt-6 sm:pt-6 dark:border-slate-800'>
                    <div className='mb-3 flex items-center gap-2'>
                      <Brain className='text-violet-500' size={16} />
                      <span className='font-bold text-[10px] text-slate-500 uppercase tracking-wider sm:text-xs dark:text-slate-400'>
                        Emoções mais frequentes
                      </span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {topEmotionsData.topEmotions.map((item) => (
                        <div
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2 ${getMoodColor(item.emotion as Mood)}`}
                          key={item.emotion}
                        >
                          <span className='text-base drop-shadow-sm filter sm:text-lg'>
                            {getMoodEmoji(item.emotion as Mood)}
                          </span>
                          <span className='font-bold text-[10px] capitalize sm:text-xs'>
                            {item.emotion}
                          </span>
                          <span className='rounded-full bg-black/10 px-1.5 py-0.5 font-bold text-[9px] sm:px-2 sm:text-[10px] dark:bg-white/10'>
                            {item.count}x
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className='mt-3 text-slate-400 text-[10px] sm:mt-4 sm:text-xs dark:text-slate-500'>
                      Baseado em {topEmotionsData.totalMoodEntries} registros de humor e{' '}
                      {topEmotionsData.totalJournalEntries} registros de pensamento dos últimos 30
                      dias.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-4 duration-500'>
            {isLoadingPatients ? (
              <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 py-12 text-center sm:rounded-3xl sm:py-16 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800 dark:text-slate-600'>
                  <Users className='sm:hidden' size={32} />
                  <Users className='hidden sm:block' size={40} />
                </div>
                <h4 className='mb-1 font-bold text-sm text-slate-700 sm:text-base dark:text-slate-300'>
                  Carregando pacientes...
                </h4>
              </div>
            ) : linkedPatients.length === 0 ? (
              <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 py-12 text-center sm:rounded-3xl sm:py-16 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800 dark:text-slate-600'>
                  <Users className='sm:hidden' size={32} />
                  <Users className='hidden sm:block' size={40} />
                </div>
                <h4 className='mb-1 font-bold text-sm text-slate-700 sm:text-base dark:text-slate-300'>
                  Nenhum paciente vinculado
                </h4>
                <p className='text-slate-400 text-xs sm:text-sm dark:text-slate-500'>
                  Use o botão de convite para adicionar pacientes.
                </p>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-indigo-200 border-dashed bg-indigo-50/50 py-12 text-center sm:rounded-3xl sm:py-16 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-500 sm:mb-4 sm:h-20 sm:w-20 dark:bg-indigo-900/30 dark:text-indigo-400'>
                  <Users className='sm:hidden' size={32} />
                  <Users className='hidden sm:block' size={40} />
                </div>
                <h4 className='mb-1 font-bold text-sm text-slate-700 sm:mb-2 sm:text-base dark:text-slate-300'>
                  Selecione um paciente
                </h4>
                <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                  Use o seletor acima para visualizar os dados de um paciente.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedPatientId && activeSection === 'journal' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-3 duration-500 sm:space-y-4'>
            {/* Journal Filters */}
            <div className='rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4 dark:border-slate-800 dark:bg-slate-900'>
              <button
                className='flex w-full items-center justify-between'
                onClick={() => setIsJournalFilterOpen(!isJournalFilterOpen)}
                type='button'
              >
                <div className='flex items-center gap-2'>
                  <Filter className='text-slate-400' size={16} />
                  <span className='font-bold text-slate-600 text-xs sm:text-sm dark:text-slate-300'>
                    Filtros
                  </span>
                  {hasActiveJournalFilters && (
                    <span className='rounded-full bg-indigo-100 px-2 py-0.5 font-bold text-[10px] text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'>
                      Ativos
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`text-slate-400 transition-transform duration-200 ${isJournalFilterOpen ? 'rotate-180' : ''}`}
                  size={16}
                />
              </button>

              {isJournalFilterOpen && (
                <div className='mt-3 space-y-3 border-slate-100 border-t pt-3 sm:mt-4 sm:space-y-4 sm:pt-4 dark:border-slate-800'>
                  {/* Date Filter */}
                  <div className='space-y-1.5 sm:space-y-2'>
                    <label className='flex items-center gap-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                      <Calendar size={12} />
                      Data
                    </label>
                    <input
                      className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:rounded-xl sm:p-2.5 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-indigo-900/30'
                      onChange={(e) => setJournalDateFilter(e.target.value)}
                      type='date'
                      value={journalDateFilter}
                    />
                  </div>

                  {/* Emotion Filter */}
                  <div className='space-y-1.5 sm:space-y-2'>
                    <label className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                      Emoção
                    </label>
                    <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                      {[
                        { id: 'happy', emoji: '😊', label: 'Feliz' },
                        { id: 'calm', emoji: '😌', label: 'Calmo' },
                        { id: 'neutral', emoji: '😐', label: 'Neutro' },
                        { id: 'sad', emoji: '😢', label: 'Triste' },
                        { id: 'anxious', emoji: '😰', label: 'Ansioso' },
                        { id: 'angry', emoji: '😠', label: 'Raiva' },
                      ].map((mood) => {
                        const count = emotionCounts[mood.id] || 0
                        return (
                          <button
                            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-all sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs ${
                              journalEmotionFilter === mood.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
                            } ${count === 0 ? 'opacity-50' : ''}`}
                            disabled={count === 0}
                            key={mood.id}
                            onClick={() =>
                              setJournalEmotionFilter(
                                journalEmotionFilter === mood.id ? '' : (mood.id as Mood)
                              )
                            }
                            type='button'
                          >
                            <span>{mood.emoji}</span>
                            <span className='hidden sm:inline'>{mood.label}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 font-bold text-[9px] sm:text-[10px] ${
                                journalEmotionFilter === mood.id
                                  ? 'bg-indigo-200 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveJournalFilters && (
                    <button
                      className='flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 font-bold text-[10px] text-slate-500 transition-colors hover:bg-slate-200 sm:rounded-xl sm:py-2.5 sm:text-xs dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      onClick={clearJournalFilters}
                      type='button'
                    >
                      <X size={12} />
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results count */}
            {hasActiveJournalFilters && (
              <div className='flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-2.5 dark:bg-indigo-900/20'>
                <span className='font-medium text-[10px] text-indigo-600 sm:text-xs dark:text-indigo-400'>
                  {journalData.length} registro{journalData.length !== 1 ? 's' : ''} encontrado
                  {journalData.length !== 1 ? 's' : ''}
                </span>
                <span className='text-[10px] text-indigo-500 sm:text-xs dark:text-indigo-400'>
                  de {journalDataRaw.length} total
                </span>
              </div>
            )}

            {journalData.length === 0 ? (
              <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 py-12 text-center sm:rounded-3xl sm:py-16 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800 dark:text-slate-600'>
                  {hasActiveJournalFilters ? (
                    <>
                      <Filter className='sm:hidden' size={32} />
                      <Filter className='hidden sm:block' size={40} />
                    </>
                  ) : (
                    <>
                      <Brain className='sm:hidden' size={32} />
                      <Brain className='hidden sm:block' size={40} />
                    </>
                  )}
                </div>
                <h4 className='mb-1 font-bold text-sm text-slate-700 sm:text-base dark:text-slate-300'>
                  {hasActiveJournalFilters ? 'Nenhum resultado' : 'Nenhum registro'}
                </h4>
                <p className='text-slate-400 text-xs sm:text-sm dark:text-slate-500'>
                  {hasActiveJournalFilters
                    ? 'Nenhum registro corresponde aos filtros aplicados.'
                    : 'O paciente ainda não fez anotações.'}
                </p>
                {hasActiveJournalFilters && (
                  <button
                    className='mt-3 rounded-lg bg-indigo-100 px-4 py-2 font-bold text-indigo-600 text-xs transition-colors hover:bg-indigo-200 sm:rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                    onClick={clearJournalFilters}
                    type='button'
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              journalData.map((entry, index) => (
                <div
                  className='slide-in-from-bottom-2 animate-in rounded-2xl border border-slate-100 bg-white fill-mode-backwards p-4 shadow-sm transition-all hover:shadow-md sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
                  key={entry.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='mb-3 flex items-start justify-between sm:mb-4'>
                    <div
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2 ${getMoodColor(entry.emotion)}`}
                    >
                      <span className='text-xl drop-shadow-sm filter sm:text-2xl'>
                        {getMoodEmoji(entry.emotion)}
                      </span>
                      <div>
                        <span className='block font-black text-[10px] uppercase opacity-80 sm:text-xs'>
                          {entry.emotion}
                        </span>
                        <span className='font-bold text-[9px] opacity-60 sm:text-[10px]'>
                          Intensidade: {entry.intensity}
                        </span>
                      </div>
                    </div>
                    <span className='rounded-full bg-slate-50 px-2 py-1 font-bold text-slate-400 text-[10px] sm:px-3 sm:text-xs dark:bg-slate-800'>
                      {new Date(entry.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className='mb-4 border-slate-100 border-l-2 pl-2 sm:mb-5 dark:border-slate-800'>
                    <p className='mb-1.5 font-bold text-[9px] text-slate-400 uppercase tracking-wider sm:mb-2 sm:text-[10px]'>
                      Pensamento Automático
                    </p>
                    <p className='text-slate-700 text-xs italic leading-relaxed sm:text-sm dark:text-slate-300'>
                      "{entry.thought}"
                    </p>
                  </div>

                  {entry.aiAnalysis && (
                    <div className='relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 p-3 sm:rounded-2xl sm:p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                      <div className='-mr-6 -mt-6 absolute top-0 right-0 h-12 w-12 rounded-full bg-indigo-200/20 sm:-mr-8 sm:-mt-8 sm:h-16 sm:w-16' />
                      <div className='relative z-10 mb-1.5 flex items-center gap-1.5 text-indigo-600 sm:mb-2 sm:gap-2 dark:text-indigo-400'>
                        <Brain size={14} />
                        <span className='font-black text-[10px] uppercase tracking-wider sm:text-xs'>
                          Análise do Sistema
                        </span>
                      </div>
                      <p className='relative z-10 font-medium text-indigo-800 text-[10px] leading-relaxed sm:text-xs dark:text-indigo-200'>
                        {entry.aiAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedPatientId && activeSection === 'rewards' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-8 duration-500'>
            {/* Points Summary */}
            <div className='relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg dark:bg-black'>
              <div className='-mr-16 -mt-16 pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl' />
              <div className='relative z-10 flex items-center justify-between'>
                <div>
                  <p className='mb-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    Saldo do Paciente
                  </p>
                  <p className='font-black text-4xl'>
                    {stats.points} <span className='font-bold text-lg text-slate-500'>pts</span>
                  </p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10'>
                  <Gift className='text-indigo-300' size={24} />
                </div>
              </div>
            </div>

            {/* Pending Rewards */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-amber-500' />
                Pendentes de Aprovação
              </h3>
              <div className='space-y-3'>
                {rewardsData.filter((r) => r.status === 'pending').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhuma solicitação pendente.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'pending')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-xl border border-amber-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 dark:border-amber-900/30 dark:bg-slate-900'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-sm text-slate-800 sm:text-base dark:text-white'>
                            {reward.title}
                          </h4>
                          <span className='mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-bold text-[9px] text-slate-400 uppercase sm:py-1 sm:text-[10px] dark:bg-slate-800'>
                            {reward.category}
                          </span>
                        </div>
                        <button
                          className='touch-target rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white text-[10px] shadow-indigo-200 shadow-sm transition-colors hover:bg-indigo-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs dark:shadow-none'
                          onClick={() => openCostModal(reward)}
                          type='button'
                        >
                          Definir Custo
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Approved Rewards */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-emerald-500' />
                Aprovadas
              </h3>
              <div className='space-y-3'>
                {rewardsData.filter((r) => r.status === 'approved').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhuma recompensa ativa.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'approved')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-xl border border-emerald-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 dark:border-emerald-900/30 dark:bg-slate-900'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-sm text-slate-800 sm:text-base dark:text-white'>
                            {reward.title}
                          </h4>
                          <div className='mt-1 flex items-center gap-2'>
                            <span className='rounded-md bg-slate-100 px-2 py-0.5 font-bold text-[9px] text-slate-400 uppercase sm:py-1 sm:text-[10px] dark:bg-slate-800'>
                              {reward.category}
                            </span>
                            <span className='font-bold text-emerald-600 text-[10px] sm:text-xs dark:text-emerald-400'>
                              {reward.cost} pts
                            </span>
                          </div>
                        </div>
                        <button
                          className='touch-target rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 sm:rounded-lg sm:p-2 dark:hover:bg-indigo-900/20'
                          onClick={() => openCostModal(reward)}
                          title='Editar custo'
                          type='button'
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Redeemed History */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-slate-300' />
                Histórico de Resgates
              </h3>
              <div className='space-y-3 opacity-60'>
                {rewardsData.filter((r) => r.status === 'redeemed').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhum resgate realizado ainda.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'redeemed')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-slate-700 line-through dark:text-slate-300'>
                            {reward.title}
                          </h4>
                          <span className='font-bold text-[10px] text-slate-400 uppercase'>
                            {reward.category} • {reward.cost} pts
                          </span>
                        </div>
                        <CheckCircle2 className='text-slate-400' size={18} />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {selectedPatientId && activeSection === 'profile' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-4 duration-500 sm:space-y-6'>
            {/* Patient Profile Header */}
            <div className='relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
              <div className='-mr-16 -mt-16 pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/20' />
              <div className='relative z-10 flex items-center gap-4 sm:gap-6'>
                <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 sm:h-20 sm:w-20 sm:rounded-3xl dark:shadow-none'>
                  <User className='sm:hidden' size={28} />
                  <User className='hidden sm:block' size={36} />
                </div>
                <div className='flex-1'>
                  <h2 className='mb-1 font-black text-lg text-slate-800 sm:text-xl dark:text-white'>
                    {selectedPatient?.name || 'Paciente'}
                  </h2>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-[10px] text-indigo-600 sm:px-3 sm:py-1 sm:text-xs dark:bg-indigo-900/30 dark:text-indigo-400'>
                      Nível {stats.level}
                    </span>
                    <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-600 sm:px-3 sm:py-1 sm:text-xs dark:bg-emerald-900/30 dark:text-emerald-400'>
                      {stats.streak} dias de ofensiva
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 sm:gap-3 dark:text-white'>
                <div className='rounded-lg bg-blue-50 p-1.5 text-blue-500 sm:rounded-xl sm:p-2 dark:bg-blue-900/20'>
                  <Mail size={16} />
                </div>
                Informações de Contato
              </h3>
              <div className='space-y-3 sm:space-y-4'>
                {selectedPatient?.email && (
                  <div className='flex items-center gap-3 rounded-xl bg-slate-50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                    <div className='rounded-lg bg-slate-100 p-2 text-slate-500 sm:rounded-xl dark:bg-slate-700'>
                      <Mail size={16} />
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                        Email
                      </p>
                      <p className='truncate font-medium text-sm text-slate-700 sm:text-base dark:text-slate-200'>
                        {selectedPatient.email}
                      </p>
                    </div>
                  </div>
                )}
                {selectedPatient?.phone && (
                  <div className='flex items-center gap-3 rounded-xl bg-slate-50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                    <div className='rounded-lg bg-slate-100 p-2 text-slate-500 sm:rounded-xl dark:bg-slate-700'>
                      <Phone size={16} />
                    </div>
                    <div className='flex-1'>
                      <p className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                        Telefone
                      </p>
                      <p className='font-medium text-sm text-slate-700 sm:text-base dark:text-slate-200'>
                        {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                )}
                {selectedPatient?.address && (
                  <div className='flex items-start gap-3 rounded-xl bg-slate-50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                    <div className='rounded-lg bg-slate-100 p-2 text-slate-500 sm:rounded-xl dark:bg-slate-700'>
                      <MapPin size={16} />
                    </div>
                    <div className='flex-1'>
                      <p className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                        Endereço
                      </p>
                      <p className='font-medium text-sm text-slate-700 sm:text-base dark:text-slate-200'>
                        {[
                          selectedPatient.address.street,
                          selectedPatient.address.city,
                          selectedPatient.address.state,
                          selectedPatient.address.zip,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Não informado'}
                      </p>
                    </div>
                  </div>
                )}
                {[selectedPatient?.email, selectedPatient?.phone, selectedPatient?.address].every(
                  (v) => !v
                ) && (
                  <div className='rounded-xl bg-slate-50 p-4 text-center sm:rounded-2xl sm:p-6 dark:bg-slate-800'>
                    <p className='text-slate-400 text-sm italic'>
                      Nenhuma informação de contato disponível.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Stats Summary */}
            <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 sm:gap-3 dark:text-white'>
                <div className='rounded-lg bg-violet-50 p-1.5 text-violet-500 sm:rounded-xl sm:p-2 dark:bg-violet-900/20'>
                  <BarChart2 size={16} />
                </div>
                Estatísticas
              </h3>
              <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                <div className='rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 p-3 sm:rounded-2xl sm:p-4 dark:from-teal-900/20 dark:to-teal-900/10'>
                  <div className='mb-1 flex items-center gap-1.5 text-teal-600 sm:mb-2 dark:text-teal-400'>
                    <Clock size={14} />
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Meditação
                    </span>
                  </div>
                  <p className='font-black text-xl text-teal-700 sm:text-2xl dark:text-teal-300'>
                    {stats.totalMeditationMinutes}{' '}
                    <span className='font-medium text-teal-500 text-xs'>min</span>
                  </p>
                </div>
                <div className='rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-3 sm:rounded-2xl sm:p-4 dark:from-violet-900/20 dark:to-violet-900/10'>
                  <div className='mb-1 flex items-center gap-1.5 text-violet-600 sm:mb-2 dark:text-violet-400'>
                    <FileText size={14} />
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Registros
                    </span>
                  </div>
                  <p className='font-black text-xl text-violet-700 sm:text-2xl dark:text-violet-300'>
                    {stats.totalJournals}
                  </p>
                </div>
                <div className='rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 sm:rounded-2xl sm:p-4 dark:from-amber-900/20 dark:to-amber-900/10'>
                  <div className='mb-1 flex items-center gap-1.5 text-amber-600 sm:mb-2 dark:text-amber-400'>
                    <CheckCircle2 size={14} />
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Tarefas
                    </span>
                  </div>
                  <p className='font-black text-xl text-amber-700 sm:text-2xl dark:text-amber-300'>
                    {stats.totalTasksCompleted}
                  </p>
                </div>
                <div className='rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-3 sm:rounded-2xl sm:p-4 dark:from-indigo-900/20 dark:to-indigo-900/10'>
                  <div className='mb-1 flex items-center gap-1.5 text-indigo-600 sm:mb-2 dark:text-indigo-400'>
                    <Gift size={14} />
                    <span className='font-bold text-[9px] uppercase tracking-wider sm:text-[10px]'>
                      Pontos
                    </span>
                  </div>
                  <p className='font-black text-xl text-indigo-700 sm:text-2xl dark:text-indigo-300'>
                    {stats.points}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 sm:gap-3 dark:text-white'>
                <div className='rounded-lg bg-slate-100 p-1.5 text-slate-500 sm:rounded-xl sm:p-2 dark:bg-slate-700'>
                  <Calendar size={16} />
                </div>
                Informações da Conta
              </h3>
              <div className='space-y-3 sm:space-y-4'>
                {selectedPatient?.createdAt && (
                  <div className='flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                    <span className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                      Membro desde
                    </span>
                    <span className='font-medium text-sm text-slate-700 sm:text-base dark:text-slate-200'>
                      {new Date(selectedPatient.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className='flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                  <span className='font-bold text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs'>
                    Vínculo
                  </span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-[10px] text-emerald-600 sm:px-3 sm:py-1 sm:text-xs dark:bg-emerald-900/30 dark:text-emerald-400'>
                    {selectedPatient?.isPrimary ? 'Terapeuta Principal' : 'Vinculado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Modal */}
        {isCostModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm sm:p-6'>
            <div className='zoom-in-95 w-full max-w-sm animate-in rounded-2xl bg-white p-4 shadow-2xl duration-200 sm:rounded-3xl sm:p-6 dark:bg-slate-900'>
              <div className='mb-4 flex items-center justify-between sm:mb-6'>
                <h3 className='font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                  Definir Custo
                </h3>
                <button
                  className='touch-target rounded-full bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 sm:p-2 dark:bg-slate-800 dark:hover:bg-slate-700'
                  onClick={() => setIsCostModalOpen(false)}
                  type='button'
                >
                  <X size={18} />
                </button>
              </div>

              <div className='mb-4 sm:mb-6'>
                <p className='mb-2 text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                  Quanto deve custar esta recompensa?
                </p>
                <div className='mb-2 rounded-xl bg-slate-50 p-3 sm:rounded-2xl sm:p-4 dark:bg-slate-800'>
                  <p className='mb-1 font-bold text-sm text-slate-800 sm:text-base dark:text-white'>
                    {editingReward?.title}
                  </p>
                  <span className='font-bold text-slate-400 text-[10px] uppercase sm:text-xs'>
                    {editingReward?.category}
                  </span>
                </div>
                <div className='relative'>
                  <input
                    autoFocus
                    className='touch-target w-full rounded-xl border-2 border-indigo-100 bg-white p-3 text-center font-black text-xl outline-none transition-colors focus:border-indigo-500 sm:rounded-2xl sm:p-4 sm:text-2xl dark:border-indigo-900/50 dark:bg-slate-950'
                    onChange={(e) => setRewardCost(e.target.value)}
                    placeholder='0'
                    type='number'
                    value={rewardCost}
                  />
                  <span className='-translate-y-1/2 absolute top-1/2 right-3 font-bold text-slate-400 text-xs sm:right-4 sm:text-sm'>
                    PTS
                  </span>
                </div>
              </div>

              <button
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-sm text-white shadow-indigo-200 shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] sm:rounded-2xl sm:py-4 sm:text-base dark:shadow-none'
                onClick={saveRewardCost}
                type='button'
              >
                <Save size={18} />
                Salvar Valor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
