'use client'

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Key,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { getIconByKey } from '@/lib/utils/icon-map'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AvatarOficial from '@/components/Avatar-oficial'
import { HelpButton } from '@/components/HelpButton'
import { PatientConsentModal } from '@/components/PatientConsentModal'
import { XPAnimationContainer } from '@/components/XPAnimation/XPAnimationContainer'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useSound } from '@/hooks/useSound'
import { useXPAnimation } from '@/hooks/useXPAnimation'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { translateMood } from '@/lib/utils/mood'
import { XP_REWARDS } from '@/lib/xp'
import { useGame } from '../context/GameContext'
import type { Mood } from '../types'

// Dynamically import Recharts components to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  ssr: false,
})
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), {
  ssr: false,
})
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
  ssr: false,
})
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
})
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

export const HomeView: React.FC = () => {
  const router = useRouter()
  const { stats, currentMood, setMood, tasks, toggleTheme } = useGame()
  const [isXPAvailable, setIsXPAvailable] = useState(false)
  const [xpFeedback, setXpFeedback] = useState<{
    id: number
    amount: number
  } | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  // Local state for immediate UI feedback
  const [selectedMood, setSelectedMood] = useState<Mood>(currentMood)
  const [_, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Change password states
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

  // LGPD States
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [isExportingData, setIsExportingData] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // LGPD Mutations
  const exportDataMutation = trpc.user.exportMyData.useMutation()
  const deleteAccountMutation = trpc.user.requestAccountDeletion.useMutation()

  // XP Animation
  const { particles, triggerAnimation } = useXPAnimation()

  // Sound effects
  const { playMood, playToggle, playPop, playNavigation, soundEnabled, toggleSound } = useSound()

  // Fetch mood history from backend
  const { data: moodHistoryData = [] } = trpc.user.getMoodHistory.useQuery({
    days: 7,
  })

  // Check if user needs to accept terms
  const { data: termsData, refetch: refetchTerms } = trpc.user.checkTermsAccepted.useQuery()

  // Check for unviewed feedback - always refetch to ensure updated count
  const { data: unviewedFeedbackCount = 0, refetch: refetchFeedbackCount } =
    trpc.journal.getUnviewedFeedbackCount.useQuery(undefined, {
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      staleTime: 0,
      gcTime: 0,
    })

  // Refetch feedback count on every render (when coming back from history page)
  useEffect(() => {
    refetchFeedbackCount()
  }, [refetchFeedbackCount])

  // Push notifications hook
  const {
    isSupported: isPushSupported,
    permissionState,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    toggle: togglePush,
  } = usePushNotifications()

  // Helper para formatar data/hora completa
  const _formatDateTime = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Scroll detection
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      if (scrollContainer.scrollTop > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync local mood with context mood
  useEffect(() => {
    setSelectedMood(currentMood)
  }, [currentMood])

  // Block body scroll when modal is open
  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showSettings])

  useEffect(() => {
    const lastXP = stats.lastMoodXPTimestamp || 0

    const checkAvailability = () => {
      if (!lastXP) {
        setIsXPAvailable(true)
        return
      }

      // Verificar se passou 1 hora desde o último XP
      const ONE_HOUR_MS = 60 * 60 * 1000
      const now = Date.now()
      setIsXPAvailable(now - lastXP >= ONE_HOUR_MS)
    }

    checkAvailability()

    // Verificar a cada minuto
    const interval = setInterval(checkAvailability, 60_000)

    return () => clearInterval(interval)
  }, [stats.lastMoodXPTimestamp])

  const handleMoodChange = (mood: Mood, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!isXPAvailable) return
    // Update local state immediately for instant UI feedback
    setSelectedMood(mood)

    // Play mood sound
    playMood()

    if (isXPAvailable) {
      setXpFeedback({ id: Date.now(), amount: 10 })
      setTimeout(() => setXpFeedback(null), 2000)

      // Trigger animation from button position
      if (e?.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        setTimeout(() => {
          triggerAnimation(10, 'xp', centerX, centerY)
        }, 300)
      }
    }

    // Update backend asynchronously
    setMood(mood)
  }

  // Logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            // Limpar o cookie de role
            await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
            window.location.href = '/auth/signin'
          },
          onError: (ctx) => {
            console.error('Logout error:', ctx.error)
            setIsLoggingOut(false)
          },
        },
      })
    } catch (error) {
      console.error('Error during logout:', error)
      setIsLoggingOut(false)
    }
  }

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

  // Helper para formatar data/hora completa
  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  // LGPD: Export user data (Portability)
  const handleExportData = async () => {
    setIsExportingData(true)
    try {
      const data = await exportDataMutation.mutateAsync()
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nepsis_meus_dados_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    } finally {
      setIsExportingData(false)
    }
  }

  // LGPD: Request account deletion
  const handleDeleteAccount = async () => {
    if (!deleteConfirmEmail) {
      alert('Por favor, confirme seu e-mail para prosseguir.')
      return
    }

    setIsDeletingAccount(true)
    try {
      const result = await deleteAccountMutation.mutateAsync({
        confirmEmail: deleteConfirmEmail,
        reason: deleteReason || undefined,
      })

      alert(result.message)

      // Logout user after account deletion request
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
            window.location.href = '/auth/signin'
          },
        },
      })
    } catch (error) {
      console.error('Error requesting account deletion:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`Erro: ${errorMessage}`)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // Check for High Priority Tasks due Today
  const urgentTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter(
      (t) =>
        t.priority === 'high' &&
        !t.completed &&
        new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
    )
  }, [tasks])

  // Transform mood history data for the weekly chart
  const moodData = useMemo(() => {
    // Day name mappings in Portuguese
    const dayNames: Record<number, string> = {
      0: 'Dom',
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sáb',
    }

    // Get the last 7 days starting from today
    const today = new Date()
    const last7Days: { date: string; dayOfWeek: number; name: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      // Format as yyyy-MM-dd to match backend formatDateSP format
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      last7Days.push({
        date: `${year}-${month}-${day}`,
        dayOfWeek: date.getDay(),
        name: dayNames[date.getDay()],
      })
    }

    // Map the mood history data to the chart format
    return last7Days.map((day) => {
      const moodEntry = moodHistoryData.find((m) => m.date === day.date)
      return {
        name: day.name,
        score: moodEntry?.score ?? 0,
      }
    })
  }, [moodHistoryData])

  const moods: { id: Mood; label: string; image: string; emoji: string }[] = [
    { id: 'happy', label: translateMood('happy'), image: '/mascote/feliz.png', emoji: '😄' },
    { id: 'calm', label: translateMood('calm'), image: '/mascote/calmo.png', emoji: '😌' },
    { id: 'neutral', label: translateMood('neutral'), image: '/mascote/neutro.png', emoji: '😐' },
    { id: 'sad', label: translateMood('sad'), image: '/mascote/triste.png', emoji: '😢' },
    { id: 'anxious', label: translateMood('anxious'), image: '/mascote/ansioso.png', emoji: '😰' },
    { id: 'angry', label: translateMood('angry'), image: '/mascote/raiva.png', emoji: '😡' },
  ]

  return (
    <>
      <XPAnimationContainer particles={particles} />
      <div className='flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950'>
        {/* Live region for screen reader announcements */}
        <div aria-atomic='true' aria-live='polite' className='sr-only'>
          {xpFeedback && `Você ganhou ${xpFeedback.amount} pontos de experiência!`}
        </div>

        {/* Floating XP Feedback Animation */}
        {xpFeedback && (
          <div
            aria-hidden='true'
            className='-translate-x-1/2 -translate-y-1/2 fade-out slide-out-to-top-10 pointer-events-none fixed top-1/2 left-1/2 z-[100] flex transform animate-out flex-col items-center justify-center fill-mode-forwards duration-1000'
            key={xpFeedback.id}
          >
            <span
              className='stroke-white font-black text-4xl text-sky-600 drop-shadow-xl filter sm:text-5xl dark:text-sky-400'
              style={{ textShadow: '0 2px 10px rgba(139, 92, 246, 0.5)' }}
            >
              +{xpFeedback.amount} XP
            </span>
          </div>
        )}

        {/* Header Section */}
        <div className='flex justify-end gap-2 px-3 shrink-0'>
          <HelpButton screenId='home' />
          <button
            aria-label='Abrir configurações'
            className='touch-target p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            onClick={() => {
              playPop()
              setShowSettings(true)
            }}
            type='button'
          >
            <Settings className='sm:hidden' size={18} />
            <Settings className='hidden sm:block' size={20} />
          </button>
        </div>

        {/* Scrollable Content - Main area */}
        <main
          className='flex-1 flex flex-col justify-evenly overflow-hidden px-3 py-1'
          id='main-content'
          ref={scrollContainerRef}
        >
          <div className='flex flex-col gap-1.5 shrink-0'>
          {/* Feedback Notification Alert */}
          {unviewedFeedbackCount > 0 && (
            <button
              aria-label={`Você tem ${unviewedFeedbackCount} novo(s) feedback(s) do seu terapeuta. Clique para ver.`}
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-1.5 shadow-sm active:scale-[0.98] sm:rounded-2xl dark:border-emerald-900/30 dark:bg-emerald-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
              onClick={() => router.push('/journal/history')}
              type='button'
            >
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='animate-pulse rounded-xl bg-emerald-100 p-2 text-emerald-600 sm:rounded-2xl sm:p-2.5 dark:bg-emerald-900/40 dark:text-emerald-400'>
                  <MessageSquare className='sm:hidden' size={18} />
                  <MessageSquare className='hidden sm:block' size={20} />
                </div>
                <div className='text-left'>
                  <h3 className='font-bold text-emerald-700 text-xs sm:text-sm dark:text-emerald-300'>
                    Novo Feedback Recebido
                  </h3>
                  <p className='font-medium text-emerald-600/80 text-[10px] sm:text-xs dark:text-emerald-400/80'>
                    Você tem {unviewedFeedbackCount} novo(s) feedback(s) do seu terapeuta.
                  </p>
                </div>
              </div>
              <div className='flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 sm:h-8 sm:w-8 dark:bg-emerald-900/30'>
                <ArrowRight className='text-emerald-600 dark:text-emerald-400' size={14} />
              </div>
            </button>
          )}

          {/* Urgent Tasks Alert */}
          {urgentTasks.length > 0 && (
            <button
              aria-label={`Atenção: ${urgentTasks.length} tarefa${
                urgentTasks.length > 1 ? 's' : ''
              } de alta prioridade hoje. Clique para ver.`}
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-xl border border-red-100 bg-red-50 p-1.5 shadow-sm active:scale-[0.98] sm:rounded-2xl dark:border-red-900/30 dark:bg-red-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
              onClick={() => router.push('/routine')}
              type='button'
            >
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='animate-pulse rounded-xl bg-red-100 p-2 text-red-500 sm:rounded-2xl sm:p-2.5 dark:bg-red-900/40'>
                  <AlertCircle className='sm:hidden' size={18} />
                  <AlertCircle className='hidden sm:block' size={20} />
                </div>
                <div className='text-left'>
                  <h3 className='font-bold text-red-700 text-xs sm:text-sm dark:text-red-300'>
                    Atenção Necessária
                  </h3>
                  <p className='font-medium text-red-600/80 text-[10px] sm:text-xs dark:text-red-400/80'>
                    Você tem {urgentTasks.length} tarefa
                    {urgentTasks.length > 1 ? 's' : ''} de alta prioridade hoje.
                  </p>
                </div>
              </div>
              <div className='flex h-7 w-7 items-center justify-center rounded-full bg-red-100 sm:h-8 sm:w-8 dark:bg-red-900/30'>
                <ArrowRight className='text-red-500 dark:text-red-400' size={14} />
              </div>
            </button>
          )}

          {/* Meditation Suggestion Alert for Anxiety */}
          {selectedMood === 'anxious' && (
            <button
              aria-label='Sugestão: Que tal uma meditação para aliviar a ansiedade? Clique para meditar.'
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-xl border border-teal-100 bg-teal-50 p-1.5 shadow-sm active:scale-[0.98] sm:rounded-2xl dark:border-teal-900/30 dark:bg-teal-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
              onClick={() => router.push('/meditation')}
              type='button'
            >
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='animate-pulse rounded-xl bg-teal-100 p-2 text-teal-500 sm:rounded-2xl sm:p-2.5 dark:bg-teal-900/40'>
                  <Sparkles className='sm:hidden' size={18} />
                  <Sparkles className='hidden sm:block' size={20} />
                </div>
                <div className='text-left'>
                  <h3 className='font-bold text-teal-700 text-xs sm:text-sm dark:text-teal-300'>
                    Momento de Cuidar de Você
                  </h3>
                  <p className='font-medium text-teal-600/80 text-[10px] sm:text-xs dark:text-teal-400/80'>
                    Que tal uma meditação para aliviar a ansiedade?
                  </p>
                </div>
              </div>
              <div className='flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 sm:h-8 sm:w-8 dark:bg-teal-900/30'>
                <ArrowRight className='text-teal-500 dark:text-teal-400' size={14} />
              </div>
            </button>
          )}

          </div>
          {/* Middle Section: Avatar (More compact container) */}
          <div className='flex shrink-0 items-center justify-center'>
            <AvatarOficial mood={selectedMood} size='md' />
          </div>

          {/* Bottom Section: Inputs & Data */}
          <div className='flex flex-col gap-1.5 shrink-0'>
            {/* Quick Mood Check-in */}
            <fieldset className='rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-colors sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900'>
            <legend className='sr-only'>Selecione como você está se sentindo</legend>
            <h3
              className='mb-2 flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm dark:text-white'
              id='mood-heading'
            >
              Como você se sente?
              {isXPAvailable && (
                <span className='animate-pulse rounded-full bg-sky-100 px-2 py-0.5 font-bold text-[9px] text-sky-600 sm:text-[10px] dark:bg-sky-900/30 dark:text-sky-300'>
                  +{XP_REWARDS.mood} XP
                  <span className='sr-only'> disponível ao registrar seu humor</span>
                </span>
              )}
            </h3>
            <div className='flex justify-between gap-1'>
              {moods.map((m) => (
                <button
                  aria-label={`${m.label}${selectedMood === m.id ? ' (selecionado)' : ''}`}
                  aria-pressed={selectedMood === m.id}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 transition-all duration-300 sm:rounded-2xl sm:p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                    selectedMood === m.id
                      ? 'scale-105 bg-sky-50 shadow-sm ring-2 ring-sky-100 sm:scale-110 dark:bg-sky-900/20 dark:ring-sky-900/30'
                      : 'active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800'
                  } ${isXPAvailable ? '' : 'cursor-not-allowed opacity-50'}`}
                  disabled={!isXPAvailable}
                  key={m.id}
                  onClick={(e) => handleMoodChange(m.id, e)}
                  type='button'
                  >
                    <span className='flex h-6 w-6 items-center justify-center text-xl sm:h-8 sm:w-8 sm:text-2xl'>
                      {m.emoji}
                    </span>
                  </button>
              ))}
            </div>
          </fieldset>

            {/* Quick Actions */}
            <section aria-label='Ações rápidas' className='grid grid-cols-2 gap-2'>
            <button
              aria-label={`Abrir diário de pensamento. Ganhe ${XP_REWARDS.journal} XP e pontos.`}
              className='group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2'
              onClick={() => {
                playNavigation()
                router.push('/journal')
              }}
              type='button'
            >
              <div className='absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600' />
              <div className='relative flex flex-row items-center justify-center gap-3 text-white'>
                <BookOpen size={24} />
                <div className='text-left'>
                    <div className='font-bold text-sm leading-tight'>
                      Diário de Pensamento
                    </div>
                  <div
                    aria-hidden='true'
                    className='mt-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 font-bold text-[10px] sm:text-xs'
                  >
                    +{XP_REWARDS.journal} XP & Pts
                  </div>
                </div>
              </div>
            </button>

            <button
              aria-label={`Iniciar meditação rápida. Ganhe ${XP_REWARDS.meditation} XP e pontos.`}
              className='group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2'
              onClick={() => {
                playNavigation()
                router.push('/meditation')
              }}
              type='button'
            >
              <div className='absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600' />
              <div className='relative flex flex-row items-center justify-center gap-3 text-white'>
                <Heart size={24} />
                <div className='text-left'>
                    <div className='font-bold text-sm leading-tight'>
                      Meditação Rápida
                    </div>
                  <div
                    aria-hidden='true'
                    className='mt-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 font-bold text-[10px] sm:text-xs'
                  >
                    +{XP_REWARDS.meditation} XP & Pts
                  </div>
                </div>
              </div>
            </button>
          </section>
          </div>

            {/* Weekly Mood Chart */}
            <section
              aria-label='Gráfico de humor semanal'
              className='shrink-0 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm transition-colors sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900'
            >
            <div className='mb-1 flex items-center gap-1.5'>
              <div
                aria-hidden='true'
                className='rounded-md bg-sky-50 p-1 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
              >
                <BarChart2 size={12} />
              </div>
              <h2 className='font-bold text-[10px] text-slate-800 dark:text-white'>Humor Semanal</h2>
            </div>
            {isMounted && (
              <div className='h-20 w-full'>
                <ResponsiveContainer height='100%' width='100%'>
                  <BarChart data={moodData}>
                    <XAxis
                      axisLine={false}
                      dataKey='name'
                      dy={10}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#fff',
                        padding: '10px',
                      }}
                      cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                      labelStyle={{
                        color: '#1e293b',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                      }}
                    />
                    <Bar barSize={10} dataKey='score' fill='#0ea5e9' radius={[1, 1, 1, 1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </main>

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
                <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                  <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 sm:h-9 sm:w-9 dark:bg-sky-900/30 dark:text-sky-400'>
                      {stats.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
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
                    aria-checked={stats.theme === 'dark'}
                    aria-label={
                      stats.theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'
                    }
                    className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                      stats.theme === 'dark' ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                    onClick={() => {
                      playToggle()
                      toggleTheme()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        playToggle()
                        toggleTheme()
                      }
                    }}
                    role='switch'
                    tabIndex={0}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        stats.theme === 'dark' ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>

                {/* Push Notifications Toggle */}
                {isPushSupported && (
                  <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                    <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 sm:h-9 sm:w-9 dark:bg-sky-900/30 dark:text-sky-400'>
                        {isPushSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                          Notificações Push
                        </h4>
                        <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                          {permissionState === 'denied'
                            ? 'Bloqueado pelo navegador'
                            : 'Receber lembretes e alertas'}
                        </p>
                      </div>
                    </div>
                    <div
                      aria-checked={isPushSubscribed}
                      aria-disabled={isPushLoading || permissionState === 'denied'}
                      aria-label={
                        isPushSubscribed
                          ? 'Desativar notificações push'
                          : 'Ativar notificações push'
                      }
                      className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                        isPushSubscribed ? 'bg-sky-600' : 'bg-slate-300'
                      } ${
                        isPushLoading || permissionState === 'denied'
                          ? 'cursor-not-allowed opacity-50'
                          : ''
                      }`}
                      onClick={() => {
                        if (!isPushLoading && permissionState !== 'denied') {
                          playToggle()
                          togglePush()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isPushLoading && permissionState !== 'denied') {
                          playToggle()
                          togglePush()
                        }
                      }}
                      role='switch'
                      tabIndex={0}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          isPushSubscribed ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Change Password Button */}
                <button
                  className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-sky-200 hover:bg-sky-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-800 dark:hover:bg-sky-900/20'
                  onClick={() => {
                    setShowSettings(false)
                    setShowChangePassword(true)
                  }}
                  type='button'
                >
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='rounded-lg bg-sky-100 p-1.5 text-sky-600 sm:p-2 dark:bg-sky-900/30 dark:text-sky-400'>
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

                {/* LGPD Section - Meus Dados */}
                <div className='mt-4 pt-4 border-t border-slate-100 dark:border-slate-800'>
                  <p className='text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1'>
                    <Shield size={12} /> LGPD - Meus Dados
                  </p>

                  {/* Botão para visualizar termo de consentimento */}
                  <button
                    className='touch-target flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-sky-200 hover:bg-sky-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-800 dark:hover:bg-sky-900/20 mb-3'
                    onClick={() => setShowConsentModal(true)}
                    type='button'
                  >
                    <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 sm:h-9 sm:w-9 dark:bg-sky-900/30 dark:text-sky-400'>
                        <FileText size={18} />
                      </div>
                      <div className='min-w-0 text-left'>
                        <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                          Termo de Consentimento
                        </h4>
                        <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                          Visualizar termo assinado e data/hora
                        </p>
                      </div>
                    </div>
                    <div className='flex-shrink-0'>
                      {termsData?.termsAcceptedAt ? (
                        <span className='text-xs text-green-600 dark:text-green-400 font-semibold'>
                          Assinado
                        </span>
                      ) : (
                        <span className='text-xs text-slate-400 dark:text-slate-500 font-semibold'>
                          Não assinado
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Export Data Button */}
                  <button
                    className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 mb-3'
                    disabled={isExportingData}
                    onClick={handleExportData}
                    type='button'
                  >
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='rounded-lg bg-emerald-100 p-1.5 text-emerald-600 sm:p-2 dark:bg-emerald-900/30 dark:text-emerald-400'>
                        <Download size={18} />
                      </div>
                      <div className='text-left'>
                        <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                          Exportar Meus Dados
                        </h4>
                        <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                          Baixar todos os seus dados (JSON)
                        </p>
                      </div>
                    </div>
                    {isExportingData && (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent' />
                    )}
                  </button>

                  {/* Delete Account Button */}
                  <button
                    className='touch-target flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3 transition-all hover:border-red-200 hover:bg-red-50 sm:p-4 dark:border-red-900/30 dark:bg-red-900/10 dark:hover:border-red-800 dark:hover:bg-red-900/20'
                    onClick={() => {
                      setShowSettings(false)
                      setShowDeleteAccountModal(true)
                    }}
                    type='button'
                  >
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='rounded-lg bg-red-100 p-1.5 text-red-600 sm:p-2 dark:bg-red-900/30 dark:text-red-400'>
                        <Trash2 size={18} />
                      </div>
                      <div className='text-left'>
                        <h4 className='font-bold text-red-700 text-xs sm:text-sm dark:text-red-400'>
                          Excluir Minha Conta
                        </h4>
                        <p className='text-red-500/70 text-[10px] sm:text-xs dark:text-red-400/60'>
                          Solicitar exclusão permanente
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {stats.role === 'psychologist' && (
                  <button
                    className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-sky-200 hover:bg-sky-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-800 dark:hover:bg-sky-900/20'
                    onClick={() => {
                      window.location.href = '/dashboard'
                    }}
                    type='button'
                  >
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='rounded-lg bg-sky-100 p-1.5 text-sky-600 sm:p-2 dark:bg-sky-900/30 dark:text-sky-400'>
                        <Stethoscope size={18} />
                      </div>
                      <div className='text-left'>
                        <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                          Portal do Especialista
                        </h4>
                        <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                          Gerencie seus pacientes
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
              <div className='mt-6 border-slate-100 border-t pt-4 sm:mt-8 sm:pt-6 dark:border-slate-800'>
                <button
                  className='touch-target flex w-full items-center justify-center gap-2 py-2.5 font-medium text-slate-400 text-xs transition-colors hover:text-red-500 sm:py-3 sm:text-sm dark:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  type='button'
                >
                  <LogOut size={16} /> {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
                </button>
              </div>
            </div>
            <div className='-z-10 absolute inset-0' onClick={() => setShowSettings(false)} />
          </div>
        )}

        {/* Patient Consent Modal */}
        {termsData?.needsToAcceptTerms && <PatientConsentModal onSuccess={() => refetchTerms()} />}

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm duration-200'>
            <div
              className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300 sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='mb-4 flex items-center justify-between sm:mb-6'>
                <h3 className='flex items-center gap-2 font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                  <Key className='text-sky-500' size={18} /> Alterar Senha
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
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
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
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
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
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
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
                      className='mt-2 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
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

        {/* Modal de Exclusão de Conta (LGPD) */}
        {showDeleteAccountModal && (
          <div className='fade-in fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm'>
            <div className='w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900'>
              <div className='border-slate-100 border-b bg-red-50 px-6 py-6 dark:border-slate-800 dark:bg-red-900/20'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className='font-bold text-xl text-red-700 sm:text-2xl dark:text-red-400'>
                      Excluir Conta
                    </h2>
                    <p className='text-red-600/70 text-sm dark:text-red-400/70'>
                      Esta ação é irreversível
                    </p>
                  </div>
                </div>
              </div>
              <div className='p-6 sm:p-8'>
                <div className='mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800'>
                  <p className='text-amber-800 text-sm dark:text-amber-300'>
                    <strong>Atenção:</strong> Ao excluir sua conta, todos os seus dados serão
                    marcados para remoção. Conforme nossa política de privacidade, seus dados serão
                    anonimizados/excluídos em até 30 dias.
                  </p>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Confirme seu e-mail para continuar:
                    </label>
                    <input
                      className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder='seu@email.com'
                      type='email'
                      value={deleteConfirmEmail}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                      Motivo (opcional):
                    </label>
                    <textarea
                      className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder='Conte-nos por que está saindo...'
                      rows={3}
                      value={deleteReason}
                    />
                  </div>
                </div>
              </div>
              <div className='border-slate-100 border-t bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                  <button
                    className='flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    onClick={() => {
                      setShowDeleteAccountModal(false)
                      setDeleteConfirmEmail('')
                      setDeleteReason('')
                    }}
                    type='button'
                  >
                    Cancelar
                  </button>
                  <button
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition-all hover:bg-red-700 active:scale-95 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed'
                    disabled={isDeletingAccount || !deleteConfirmEmail}
                    onClick={handleDeleteAccount}
                    type='button'
                  >
                    {isDeletingAccount ? (
                      <>
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Excluir Permanentemente
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal do termo de consentimento */}
        {showConsentModal && (
          <div className='fade-in fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm'>
            <div className='w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900'>
              <div className='border-slate-100 border-b bg-slate-50/50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className='font-bold text-xl text-slate-900 sm:text-2xl dark:text-white'>
                      Termo de Consentimento
                    </h2>
                    <p className='text-slate-500 text-sm dark:text-slate-400'>
                      Abaixo está o termo assinado e a data/hora do aceite.
                    </p>
                  </div>
                </div>
              </div>
              <div className='max-h-[60vh] overflow-y-auto p-6 sm:p-8'>
                <div className='prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-800 dark:prose-p:text-slate-200 prose-li:text-slate-800 dark:prose-li:text-slate-200 prose-strong:text-slate-900 dark:prose-strong:text-white'>
                  <p className='text-slate-800 dark:text-slate-200 font-medium'>
                    Este Termo de Consentimento Livre e Esclarecido (TCLE) tem como objetivo
                    fornecer informações sobre a utilização da plataforma de acompanhamento
                    terapêutico.
                  </p>
                  <h3 className='text-slate-900 dark:text-white font-bold'>
                    1. Objetivo da Plataforma
                  </h3>
                  <p className='text-slate-800 dark:text-slate-200'>
                    Esta plataforma foi desenvolvida para auxiliar no acompanhamento do seu processo
                    terapêutico, permitindo o registro de humor, diário de pensamentos, realização
                    de tarefas e meditações.
                  </p>
                  <h3 className='text-slate-900 dark:text-white font-bold'>
                    2. Confidencialidade e Privacidade
                  </h3>
                  <p className='text-slate-800 dark:text-slate-200'>
                    Todas as informações registradas na plataforma são confidenciais e protegidas.
                    Apenas você e seu terapeuta vinculado terão acesso aos dados inseridos.
                  </p>
                  <h3 className='text-slate-900 dark:text-white font-bold'>3. Uso de Dados</h3>
                  <p className='text-slate-800 dark:text-slate-200'>
                    Os dados coletados serão utilizados exclusivamente para fins terapêuticos e de
                    melhoria do seu acompanhamento. Dados anonimizados poderão ser utilizados para
                    fins estatísticos e de pesquisa.
                  </p>
                  <h3 className='text-slate-900 dark:text-white font-bold'>
                    4. Compromisso do Usuário
                  </h3>
                  <p className='text-slate-800 dark:text-slate-200'>
                    Ao utilizar a plataforma, você se compromete a fornecer informações verídicas e
                    a utilizar os recursos de forma responsável.
                  </p>
                  <h3 className='text-slate-900 dark:text-white font-bold'>5. Desistência</h3>
                  <p className='text-slate-800 dark:text-slate-200'>
                    Você pode deixar de utilizar a plataforma a qualquer momento, sem prejuízo ao
                    seu atendimento terapêutico presencial ou online.
                  </p>
                </div>
                <div className='mt-6 rounded-xl bg-sky-50 p-4 text-slate-700 text-sm dark:bg-sky-900/20 dark:text-slate-200'>
                  <strong>Data/hora da assinatura:</strong>{' '}
                  {termsData?.termsAcceptedAt ? (
                    <span className='font-mono'>
                      {formatDateTime(termsData.termsAcceptedAt.getTime())}
                    </span>
                  ) : (
                    <span className='italic text-slate-400'>Não assinado</span>
                  )}
                </div>
              </div>
              <div className='border-slate-100 border-t bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end'>
                  <button
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-bold text-white transition-all hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-500/20 active:scale-95 sm:w-auto'
                    onClick={() => setShowConsentModal(false)}
                    type='button'
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

