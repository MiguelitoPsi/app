'use client'

import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Bell,
  BellOff,
  BookOpen,
  FileText,
  Heart,
  Key,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sparkles,
  Stethoscope,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
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
  const [_showConsent, setShowConsent] = useState(false)
  // Local state for immediate UI feedback
  const [selectedMood, setSelectedMood] = useState<Mood>(currentMood)
  const [_, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

  // Check for unviewed feedback
  const { data: unviewedFeedbackCount = 0 } = trpc.journal.getUnviewedFeedbackCount.useQuery()

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

  const moods: { id: Mood; label: string; image: string; emoji?: string }[] = [
    { id: 'happy', label: 'Feliz', image: '/mascote/feliz.png', emoji: '😄' },
    { id: 'calm', label: 'Calmo', image: '/mascote/calmo.png', emoji: '😌' },

    { id: 'sad', label: 'Triste', image: '/mascote/triste.png', emoji: '😢' },
    {
      id: 'anxious',
      label: 'Ansioso',
      image: '/mascote/ansioso.png',
      emoji: '😰',
    },
    { id: 'angry', label: 'Bravo', image: '/mascote/raiva.png', emoji: '😠' },
  ]

  return (
    <>
      <XPAnimationContainer particles={particles} />
      <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
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
              className='stroke-white font-black text-4xl text-violet-600 drop-shadow-xl filter sm:text-5xl dark:text-violet-400'
              style={{ textShadow: '0 2px 10px rgba(139, 92, 246, 0.5)' }}
            >
              +{xpFeedback.amount} XP
            </span>
          </div>
        )}

        {/* Header Section */}
        <div className='mb-3 flex justify-end gap-2 px-4 sm:mb-4 sm:px-6'>
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
          className='flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28 sm:space-y-6 sm:px-6 sm:py-6 sm:pb-32'
          id='main-content'
          ref={scrollContainerRef}
        >
          {/* Feedback Notification Alert */}
          {unviewedFeedbackCount > 0 && (
            <button
              aria-label={`Você tem ${unviewedFeedbackCount} novo(s) feedback(s) do seu terapeuta. Clique para ver.`}
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-3 shadow-sm active:scale-[0.98] sm:rounded-3xl sm:p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
              onClick={() => router.push('/journal')}
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
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-3 shadow-sm active:scale-[0.98] sm:rounded-3xl sm:p-4 dark:border-red-900/30 dark:bg-red-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
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
              className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 p-3 shadow-sm active:scale-[0.98] sm:rounded-3xl sm:p-4 dark:border-teal-900/30 dark:bg-teal-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
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

          {/* Avatar Section */}
          <div className='flex justify-center py-2'>
            <AvatarOficial mood={selectedMood} size='lg' />
          </div>

          {/* Quick Mood Check-in */}
          <fieldset className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
            <legend className='sr-only'>Selecione como você está se sentindo</legend>
            <h3
              className='mb-3 flex items-center gap-2 font-bold text-slate-800 text-xs sm:mb-4 sm:text-sm dark:text-white'
              id='mood-heading'
            >
              Como você se sente?
              {isXPAvailable && (
                <span className='animate-pulse rounded-full bg-violet-100 px-2 py-0.5 font-bold text-[9px] text-violet-600 sm:text-[10px] dark:bg-violet-900/30 dark:text-violet-300'>
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
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 transition-all duration-300 sm:rounded-2xl sm:p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                    selectedMood === m.id
                      ? 'scale-105 bg-violet-50 shadow-sm ring-2 ring-violet-100 sm:scale-110 dark:bg-violet-900/20 dark:ring-violet-900/30'
                      : 'active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800'
                  } ${isXPAvailable ? '' : 'cursor-not-allowed opacity-50'}`}
                  disabled={!isXPAvailable}
                  key={m.id}
                  onClick={(e) => handleMoodChange(m.id, e)}
                  type='button'
                >
                  <span
                    className='
                  h-7 w-7 sm:h-10 sm:w-10 text-3xl 
                  flex items-center justify-center
                '
                  >
                    {m.emoji}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Quick Actions */}
          <section aria-label='Ações rápidas' className='grid grid-cols-2 gap-3 sm:gap-4'>
            <button
              aria-label={`Abrir diário de pensamento. Ganhe ${XP_REWARDS.journal} XP e pontos.`}
              className='group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2'
              onClick={() => {
                playNavigation()
                router.push('/journal')
              }}
              type='button'
            >
              <div className='absolute inset-0 bg-gradient-to-br from-violet-400 to-violet-600' />
              <div className='relative flex h-full flex-col items-center justify-center gap-2 text-white sm:gap-3'>
                <BookOpen className='h-8 w-8 sm:h-10 sm:w-10' />
                <div className='text-center'>
                  <div className='font-bold text-sm leading-tight sm:text-base'>
                    Diário de
                    <br />
                    Pensamento
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
              className='group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2'
              onClick={() => {
                playNavigation()
                router.push('/meditation')
              }}
              type='button'
            >
              <div className='absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600' />
              <div className='relative flex h-full flex-col items-center justify-center gap-2 text-white sm:gap-3'>
                <Heart className='h-8 w-8 sm:h-10 sm:w-10' />
                <div className='text-center'>
                  <div className='font-bold text-sm leading-tight sm:text-base'>
                    Meditação
                    <br />
                    Rápida
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

          {/* Weekly Mood Chart */}
          <section
            aria-label='Gráfico de humor semanal'
            className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
          >
            <div className='mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3'>
              <div
                aria-hidden='true'
                className='rounded-lg bg-violet-50 p-1.5 text-violet-600 sm:rounded-xl sm:p-2 dark:bg-violet-900/20 dark:text-violet-400'
              >
                <BarChart2 className='sm:hidden' size={16} />
                <BarChart2 className='hidden sm:block' size={18} />
              </div>
              <h2 className='font-bold text-sm text-slate-800 dark:text-white'>Humor Semanal</h2>
            </div>
            {isMounted && (
              <div className='h-32 w-full sm:h-40'>
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
                    <Bar barSize={20} dataKey='score' fill='#8b5cf6' radius={[4, 4, 4, 4]} />
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
                {/* Botão para visualizar termo de consentimento */}
                <button
                  className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-violet-200 hover:bg-violet-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-900/20'
                  onClick={() => setShowConsent(true)}
                  type='button'
                >
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='rounded-lg bg-violet-100 p-1.5 text-violet-600 sm:p-2 dark:bg-violet-900/30 dark:text-violet-400'>
                      <FileText size={18} />
                    </div>
                    <div className='text-left'>
                      <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                        Termo de Consentimento
                      </h4>
                      <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                        Visualizar termo assinado e data/hora
                      </p>
                    </div>
                  </div>
                  <div className='w-full mt-1'>
                    {termsData?.termsAcceptedAt ? (
                      <span className='block text-xs text-green-600 dark:text-green-400 font-semibold'>
                        Assinado
                      </span>
                    ) : (
                      <span className='block text-xs text-slate-400 dark:text-slate-500 font-semibold'>
                        Não assinado
                      </span>
                    )}
                  </div>
                </button>

                <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                  <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
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
                      stats.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'
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
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
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
                        isPushSubscribed ? 'bg-violet-600' : 'bg-slate-300'
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
                {/* Sound Toggle */}
                <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                  <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 sm:h-9 sm:w-9 dark:bg-violet-900/30 dark:text-violet-400'>
                      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </div>
                    <div className='min-w-0'>
                      <h4 className='font-bold text-slate-800 text-xs sm:text-sm dark:text-white'>
                        Sons do App
                      </h4>
                      <p className='text-slate-500 text-[10px] sm:text-xs dark:text-slate-400'>
                        Efeitos sonoros e feedback
                      </p>
                    </div>
                  </div>
                  <div
                    aria-checked={soundEnabled}
                    aria-label={soundEnabled ? 'Desativar sons' : 'Ativar sons'}
                    className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                      soundEnabled ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                    onClick={() => {
                      toggleSound()
                      // Play toggle sound only when enabling
                      if (!soundEnabled) {
                        setTimeout(() => playToggle(), 50)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        toggleSound()
                        if (!soundEnabled) {
                          setTimeout(() => playToggle(), 50)
                        }
                      }
                    }}
                    role='switch'
                    tabIndex={0}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        soundEnabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                {/* Change Password Button */}
                <button
                  className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-violet-200 hover:bg-violet-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-900/20'
                  onClick={() => {
                    setShowSettings(false)
                    router.push('/profile')
                  }}
                  type='button'
                >
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='rounded-lg bg-violet-100 p-1.5 text-violet-600 sm:p-2 dark:bg-violet-900/30 dark:text-violet-400'>
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
                {stats.role === 'psychologist' && (
                  <button
                    className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-violet-200 hover:bg-violet-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-900/20'
                    onClick={() => {
                      window.location.href = '/dashboard'
                    }}
                    type='button'
                  >
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='rounded-lg bg-violet-100 p-1.5 text-violet-600 sm:p-2 dark:bg-violet-900/30 dark:text-violet-400'>
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
      </div>
    </>
  )
}
