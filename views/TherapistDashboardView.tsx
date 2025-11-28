'use client'

import {
  AlertCircle,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Key,
  ListTodo,
  LogOut,
  Moon,
  Settings,
  Smile,
  Star,
  Sun,
  Target,
  Trophy,
  User,
  UserCircle,
  UserMinus,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { useGame } from '@/context/GameContext'
import { useSelectedPatient } from '@/context/SelectedPatientContext'
import { authClient } from '@/lib/auth-client'
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
    emoji: '😕',
    label: 'Confuso',
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
  const { stats: gameStats, toggleTheme } = useGame()
  const [activeTab, setActiveTab] = useState<TherapistDashboardTab>('overview')
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
  const { selectedPatientId, setSelectedPatientId } = useSelectedPatient()
  const [showPatientList, setShowPatientList] = useState(false)
  const [patientSubTab, setPatientSubTab] = useState<'summary' | 'mood' | 'journal' | 'profile'>(
    'summary'
  )
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false)

  // Core queries with optimized staleTime
  const { data: statsData, isLoading: statsLoading } = trpc.therapistXp.getStats.useQuery(
    undefined,
    { staleTime: 2 * 60 * 1000 } // 2 minutes
  )
  const { data: activitySummary } = trpc.therapistXp.getActivitySummary.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  )
  const { data: patients } = trpc.patient.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Only load challenges/achievements data when on those tabs
  const { data: challengesData } = trpc.therapistChallenges.getCurrentWeek.useQuery(undefined, {
    enabled: activeTab === 'challenges' || activeTab === 'overview',
    staleTime: 5 * 60 * 1000,
  })
  const { data: achievementProgress } = trpc.therapistAchievements.getProgress.useQuery(undefined, {
    enabled: activeTab === 'achievements' || activeTab === 'overview',
    staleTime: 5 * 60 * 1000,
  })
  const { data: challengeStats } = trpc.therapistChallenges.getStats.useQuery(undefined, {
    enabled: activeTab === 'challenges',
    staleTime: 5 * 60 * 1000,
  })

  // Patient-specific queries - only when patient is selected AND on patients tab
  const { data: moodHistory, isLoading: isLoadingMood } =
    trpc.therapistReports.getPatientMoodHistory.useQuery(
      { patientId: selectedPatientId ?? '', limit: 30 },
      {
        enabled: Boolean(selectedPatientId) && activeTab === 'patients' && patientSubTab === 'mood',
        staleTime: 2 * 60 * 1000,
      }
    )

  const { data: journalEntries, isLoading: isLoadingJournal } =
    trpc.therapistReports.getPatientJournalEntries.useQuery(
      { patientId: selectedPatientId ?? '', limit: 20 },
      {
        enabled:
          Boolean(selectedPatientId) && activeTab === 'patients' && patientSubTab === 'journal',
        staleTime: 2 * 60 * 1000,
      }
    )

  const { data: patientSummary, isLoading: isLoadingSummary } =
    trpc.therapistReports.getPatientSummary.useQuery(
      { patientId: selectedPatientId ?? '' },
      {
        enabled:
          Boolean(selectedPatientId) && activeTab === 'patients' && patientSubTab === 'summary',
        staleTime: 2 * 60 * 1000,
      }
    )

  // Mutations para desvincular/dar alta
  const utils = trpc.useUtils()

  const unlinkPatientMutation = trpc.patient.unlinkPatient.useMutation({
    onSuccess: () => {
      utils.patient.getAll.invalidate()
      setSelectedPatientId('')
      setShowUnlinkConfirm(false)
    },
  })

  const dischargePatientMutation = trpc.patient.dischargePatient.useMutation({
    onSuccess: () => {
      utils.patient.getAll.invalidate()
      setSelectedPatientId('')
      setShowDischargeConfirm(false)
    },
  })

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

  if (statsLoading) {
    return (
      <div className='flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent' />
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950'>
      <header className='relative z-10 bg-gradient-to-br from-violet-600 to-purple-700 pt-safe text-white'>
        <div className='mx-auto max-w-7xl px-3 pt-4 pb-4 sm:px-4 lg:px-8 lg:pt-8 lg:pb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative lg:hidden'>
                <Avatar mood='happy' size='md' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-white/80 sm:text-sm lg:text-base'>
                  Bem-vindo(a) de volta!
                </p>
                <h1 className='truncate font-bold text-lg sm:text-xl lg:text-3xl'>
                  Painel do Terapeuta
                </h1>
              </div>
            </div>
            <button
              aria-label='Configurações'
              className='flex-shrink-0 rounded-full p-2 transition-colors hover:bg-white/10 lg:hidden'
              onClick={() => setShowSettings(true)}
              type='button'
            >
              <Settings className='h-5 w-5 sm:h-6 sm:w-6' />
            </button>
          </div>

          {/* Stats - Grid responsivo */}
          <div className='mt-4 grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3 lg:mt-8 lg:gap-6'>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-4 lg:p-6'>
              <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                <div className='rounded-lg bg-white/20 p-1.5 sm:p-2'>
                  <Users className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                </div>
                <div className='text-center sm:text-left'>
                  <p className='font-bold text-lg sm:text-2xl lg:text-3xl'>
                    {stats?.totalPatientsManaged || 0}
                  </p>
                  <p className='text-white/70 text-[10px] sm:text-xs lg:text-sm'>Pacientes</p>
                </div>
              </div>
            </div>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-4 lg:p-6'>
              <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                <div className='rounded-lg bg-white/20 p-1.5 sm:p-2'>
                  <FileText className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                </div>
                <div className='text-center sm:text-left'>
                  <p className='font-bold text-lg sm:text-2xl lg:text-3xl'>
                    {stats?.totalReportsViewed || 0}
                  </p>
                  <p className='text-white/70 text-[10px] sm:text-xs lg:text-sm'>Relatórios</p>
                </div>
              </div>
            </div>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-4 lg:p-6'>
              <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                <div className='rounded-lg bg-white/20 p-1.5 sm:p-2'>
                  <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                </div>
                <div className='text-center sm:text-left'>
                  <p className='font-bold text-lg sm:text-2xl lg:text-3xl'>
                    {stats?.totalSessionsCompleted || 0}
                  </p>
                  <p className='text-white/70 text-[10px] sm:text-xs lg:text-sm'>Sessões</p>
                </div>
              </div>
            </div>
            <div className='rounded-lg bg-white/10 p-2 backdrop-blur-sm sm:rounded-xl sm:p-4 lg:p-6'>
              <div className='flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3'>
                <div className='rounded-lg bg-white/20 p-1.5 sm:p-2'>
                  <Trophy className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                </div>
                <div className='text-center sm:text-left'>
                  <p className='font-bold text-lg sm:text-2xl lg:text-3xl'>
                    {stats?.currentStreak || 0}
                  </p>
                  <p className='text-white/70 text-[10px] sm:text-xs lg:text-sm'>Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Cards no mobile, botões horizontais no desktop */}
      <div className='bg-slate-50 px-3 py-3 dark:bg-slate-950 sm:px-4 sm:py-4 lg:px-8 lg:py-6'>
        <div className='mx-auto max-w-7xl'>
          {/* Mobile: Grid de cards coloridos */}
          <div className='grid grid-cols-4 gap-2 sm:gap-3 lg:hidden'>
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
                className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 sm:gap-2 sm:rounded-2xl ${tab.bgColor} ${tab.hoverBg} ${
                  activeTab === tab.id
                    ? 'scale-105 shadow-xl ring-2 ring-white/30 sm:ring-4'
                    : 'shadow-lg hover:scale-[1.02]'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TherapistDashboardTab)}
                type='button'
              >
                <tab.icon className='h-5 w-5 text-white sm:h-8 sm:w-8' strokeWidth={1.5} />
                <span className='px-0.5 text-center font-semibold text-white text-[9px] leading-tight sm:px-1 sm:text-xs'>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: Tabs horizontais elegantes */}
          <div className='hidden lg:flex lg:gap-2 lg:rounded-xl lg:bg-white lg:p-1.5 lg:shadow-sm dark:lg:bg-slate-800'>
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
              { id: 'patients', label: 'Pacientes', icon: Users },
              { id: 'challenges', label: 'Desafios', icon: Target },
              { id: 'achievements', label: 'Conquistas', icon: Award },
            ].map((tab) => (
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TherapistDashboardTab)}
                type='button'
              >
                <tab.icon className='h-5 w-5' />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className='flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-safe sm:px-4 sm:py-6 lg:px-8 lg:py-8'>
        <div className='mx-auto max-w-7xl'>
          {activeTab === 'overview' && (
            <div className='space-y-6 lg:space-y-8'>
              {/* Desktop: Layout em 2 colunas */}
              <div className='lg:grid lg:grid-cols-3 lg:gap-8'>
                {/* Coluna principal */}
                <div className='lg:col-span-2 space-y-6'>
                  <section>
                    <h2 className='mb-2 font-semibold text-slate-800 text-base dark:text-slate-200 sm:mb-3 sm:text-lg lg:mb-4 lg:text-xl'>
                      Ações Rápidas
                    </h2>
                    <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4'>
                      <button
                        className='flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:bg-slate-800 sm:gap-3 sm:rounded-xl sm:p-4 lg:p-5'
                        onClick={() => router.push('/reports')}
                        type='button'
                      >
                        <div className='flex-shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30 sm:p-2.5'>
                          <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5' />
                        </div>
                        <div className='min-w-0 text-left'>
                          <p className='truncate font-medium text-slate-800 text-xs dark:text-slate-200 sm:text-sm'>
                            Relatórios
                          </p>
                          <p className='hidden text-slate-500 text-xs dark:text-slate-400 sm:block'>
                            Documentos
                          </p>
                        </div>
                      </button>
                      <button
                        className='flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:bg-slate-800 sm:gap-3 sm:rounded-xl sm:p-4 lg:p-5'
                        onClick={() => router.push('/therapist-routine')}
                        type='button'
                      >
                        <div className='flex-shrink-0 rounded-lg bg-green-100 p-2 dark:bg-green-900/30 sm:p-2.5'>
                          <ListTodo className='h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5' />
                        </div>
                        <div className='min-w-0 text-left'>
                          <p className='truncate font-medium text-slate-800 text-xs dark:text-slate-200 sm:text-sm'>
                            Rotina
                          </p>
                          <p className='hidden text-slate-500 text-xs dark:text-slate-400 sm:block'>
                            Gerenciar tarefas
                          </p>
                        </div>
                      </button>
                      <button
                        className='flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:bg-slate-800 sm:gap-3 sm:rounded-xl sm:p-4 lg:p-5'
                        onClick={() => router.push('/financial')}
                        type='button'
                      >
                        <div className='flex-shrink-0 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30 sm:p-2.5'>
                          <Wallet className='h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5' />
                        </div>
                        <div className='min-w-0 text-left'>
                          <p className='truncate font-medium text-slate-800 text-xs dark:text-slate-200 sm:text-sm'>
                            Financeiro
                          </p>
                          <p className='hidden text-slate-500 text-xs dark:text-slate-400 sm:block'>
                            Gestão profissional
                          </p>
                        </div>
                      </button>
                      <button
                        className='flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:bg-slate-800 sm:gap-3 sm:rounded-xl sm:p-4 lg:p-5'
                        onClick={() => setActiveTab('patients')}
                        type='button'
                      >
                        <div className='flex-shrink-0 rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30 sm:p-2.5'>
                          <Users className='h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5' />
                        </div>
                        <div className='min-w-0 text-left'>
                          <p className='truncate font-medium text-slate-800 text-xs dark:text-slate-200 sm:text-sm'>
                            Pacientes
                          </p>
                          <p className='hidden text-slate-500 text-xs dark:text-slate-400 sm:block'>
                            Ver progresso
                          </p>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Gráfico de atividade */}
                  <section className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 lg:p-6'>
                    <h2 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                      Atividade Semanal
                    </h2>
                    <div className='h-48 lg:h-64'>
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

                {/* Sidebar direita - apenas desktop */}
                <aside className='hidden lg:block space-y-6'>
                  <section className='rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800'>
                    <h3 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                      Resumo de Atividades
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30'>
                            <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                          </div>
                          <span className='text-slate-600 text-sm dark:text-slate-300'>
                            Relatórios
                          </span>
                        </div>
                        <span className='font-bold text-lg text-slate-800 dark:text-slate-200'>
                          {activitySummary?.reportsViewed || 0}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900/30'>
                            <ListTodo className='h-4 w-4 text-green-600 dark:text-green-400' />
                          </div>
                          <span className='text-slate-600 text-sm dark:text-slate-300'>
                            Tarefas
                          </span>
                        </div>
                        <span className='font-bold text-lg text-slate-800 dark:text-slate-200'>
                          {activitySummary?.tasksCreated || 0}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30'>
                            <Star className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                          </div>
                          <span className='text-slate-600 text-sm dark:text-slate-300'>
                            Feedbacks
                          </span>
                        </div>
                        <span className='font-bold text-lg text-slate-800 dark:text-slate-200'>
                          {activitySummary?.feedbackSent || 0}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className='rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg'>
                    <div className='flex items-center gap-3 mb-4'>
                      <Trophy className='h-6 w-6' />
                      <h3 className='font-semibold'>Progresso</h3>
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span className='text-white/80'>Desafios</span>
                          <span className='font-medium'>
                            {completedChallenges}/{totalChallenges}
                          </span>
                        </div>
                        <div className='h-2 bg-white/20 rounded-full'>
                          <div
                            className='h-full bg-white rounded-full transition-all'
                            style={{
                              width: `${totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className='flex justify-between text-sm mb-1'>
                          <span className='text-white/80'>Conquistas</span>
                          <span className='font-medium'>
                            {unlockedAchievements}/{totalAchievements}
                          </span>
                        </div>
                        <div className='h-2 bg-white/20 rounded-full'>
                          <div
                            className='h-full bg-white rounded-full transition-all'
                            style={{
                              width: `${totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>

              {/* Resumo mobile - escondido em desktop */}
              <section className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 lg:hidden'>
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
                      { id: 'profile', label: 'Perfil', icon: UserCircle },
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
                              {MOOD_CONFIG[mood.mood]?.emoji ?? '😕'}
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

                  {patientSubTab === 'profile' && (
                    <div className='space-y-4'>
                      {/* Informações do Paciente */}
                      <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                        <h3 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                          Informações do Paciente
                        </h3>
                        <div className='space-y-3'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 font-semibold text-white text-lg'>
                              {selectedPatient?.name?.charAt(0) ?? 'P'}
                            </div>
                            <div>
                              <p className='font-medium text-slate-800 dark:text-slate-200'>
                                {selectedPatient?.name}
                              </p>
                              <p className='text-slate-500 text-sm'>{selectedPatient?.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações do Paciente */}
                      <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800'>
                        <h3 className='mb-4 font-semibold text-slate-800 dark:text-slate-200'>
                          Ações
                        </h3>
                        <div className='space-y-3'>
                          <button
                            className='flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30'
                            onClick={() => setShowUnlinkConfirm(true)}
                            type='button'
                          >
                            <UserMinus className='h-5 w-5' />
                            Desvincular Paciente
                          </button>
                          <button
                            className='flex w-full items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-50 px-4 py-3 font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                            onClick={() => setShowDischargeConfirm(true)}
                            type='button'
                          >
                            <LogOut className='h-5 w-5' />
                            Dar Alta ao Paciente
                          </button>
                        </div>
                      </div>

                      {/* Aviso */}
                      <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50'>
                        <p className='text-slate-500 text-sm dark:text-slate-400'>
                          <strong>Atenção:</strong> Ao desvincular ou dar alta, a conta do paciente
                          será suspensa até que ele se vincule a um novo terapeuta ou o admin exclua
                          a conta.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modal de confirmação - Desvincular */}
                  {showUnlinkConfirm && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
                      <div className='mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800'>
                        <div className='mb-4 flex items-center justify-center'>
                          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
                            <UserMinus className='h-6 w-6 text-amber-600 dark:text-amber-400' />
                          </div>
                        </div>
                        <h3 className='mb-2 text-center font-semibold text-lg text-slate-800 dark:text-slate-200'>
                          Desvincular Paciente?
                        </h3>
                        <p className='mb-6 text-center text-slate-500 dark:text-slate-400'>
                          Tem certeza que deseja desvincular{' '}
                          <strong>{selectedPatient?.name}</strong>? A conta do paciente será
                          suspensa.
                        </p>
                        <div className='flex gap-3'>
                          <button
                            className='flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                            onClick={() => setShowUnlinkConfirm(false)}
                            type='button'
                          >
                            Cancelar
                          </button>
                          <button
                            className='flex-1 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50'
                            disabled={unlinkPatientMutation.isPending}
                            onClick={() => {
                              if (selectedPatientId) {
                                unlinkPatientMutation.mutate({ patientId: selectedPatientId })
                              }
                            }}
                            type='button'
                          >
                            {unlinkPatientMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal de confirmação - Dar Alta */}
                  {showDischargeConfirm && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
                      <div className='mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800'>
                        <div className='mb-4 flex items-center justify-center'>
                          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                            <LogOut className='h-6 w-6 text-green-600 dark:text-green-400' />
                          </div>
                        </div>
                        <h3 className='mb-2 text-center font-semibold text-lg text-slate-800 dark:text-slate-200'>
                          Dar Alta ao Paciente?
                        </h3>
                        <p className='mb-6 text-center text-slate-500 dark:text-slate-400'>
                          Tem certeza que deseja dar alta a <strong>{selectedPatient?.name}</strong>
                          ? A conta do paciente será suspensa.
                        </p>
                        <div className='flex gap-3'>
                          <button
                            className='flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                            onClick={() => setShowDischargeConfirm(false)}
                            type='button'
                          >
                            Cancelar
                          </button>
                          <button
                            className='flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50'
                            disabled={dischargePatientMutation.isPending}
                            onClick={() => {
                              if (selectedPatientId) {
                                dischargePatientMutation.mutate({ patientId: selectedPatientId })
                              }
                            }}
                            type='button'
                          >
                            {dischargePatientMutation.isPending ? 'Processando...' : 'Dar Alta'}
                          </button>
                        </div>
                      </div>
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
                      <p className='text-slate-500 text-sm dark:text-slate-400'>
                        Taxa de Conclusão
                      </p>
                    </div>
                    <div className='text-center'>
                      <p className='font-bold text-2xl text-blue-600 dark:text-blue-400'>
                        {challengeStats.perfectWeeks}
                      </p>
                      <p className='text-slate-500 text-sm dark:text-slate-400'>
                        Semanas Perfeitas
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='font-semibold text-slate-800 dark:text-slate-200'>
                  Suas Conquistas
                </h2>
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
                    <span
                      className={`text-3xl ${!achievement.isUnlocked && 'grayscale opacity-40'}`}
                    >
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
        </div>
      </main>

      {showSettings && (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center'>
          <div className='relative w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-slate-800'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-semibold text-lg text-slate-800 dark:text-slate-200'>
                Configurações
              </h2>
              <button
                aria-label='Fechar modal'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-200'
                onClick={() => setShowSettings(false)}
                type='button'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <div className='space-y-4'>
              <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
                    {gameStats.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
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
                  aria-checked={gameStats.theme === 'dark'}
                  aria-label={
                    gameStats.theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'
                  }
                  className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    gameStats.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                  onClick={toggleTheme}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
                  role='switch'
                  tabIndex={0}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      gameStats.theme === 'dark' ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </div>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-slate-700'
                onClick={() => router.push('/profile')}
                type='button'
              >
                <span className='text-slate-700 dark:text-slate-200'>Meu Perfil</span>
                <ChevronRight className='h-5 w-5 text-slate-400' />
              </button>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-amber-100 p-4 dark:bg-amber-900/30'
                onClick={() => {
                  setShowSettings(false)
                  resetPasswordForm()
                  setShowChangePassword(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-3'>
                  <Key className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                  <span className='text-amber-700 dark:text-amber-300'>Alterar Senha</span>
                </div>
                <ChevronRight className='h-5 w-5 text-amber-400' />
              </button>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-indigo-100 p-4 dark:bg-indigo-900/30'
                onClick={() => {
                  setShowSettings(false)
                  setShowProfileModal(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-3'>
                  <UserCircle className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                  <span className='text-indigo-700 dark:text-indigo-300'>Perfil Profissional</span>
                </div>
                <ChevronRight className='h-5 w-5 text-indigo-400' />
              </button>
              <button
                className='flex w-full items-center justify-between rounded-xl bg-violet-100 p-4 dark:bg-violet-900/30'
                onClick={() => {
                  setShowSettings(false)
                  setShowTermsModal(true)
                }}
                type='button'
              >
                <div className='flex items-center gap-3'>
                  <FileText className='h-5 w-5 text-violet-600 dark:text-violet-400' />
                  <span className='text-violet-700 dark:text-violet-300'>
                    Termo de Responsabilidade
                  </span>
                </div>
                <ChevronRight className='h-5 w-5 text-violet-400' />
              </button>
              <button
                className='w-full rounded-xl bg-red-100 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                onClick={() => router.push('/auth/signin')}
                type='button'
              >
                Sair da Conta
              </button>
            </div>
          </div>
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
    </div>
  )
}

export default TherapistDashboardView
