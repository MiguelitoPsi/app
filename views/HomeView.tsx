'use client'

import { AlertCircle, ArrowRight, BarChart2, BookOpen, Heart } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { XP_REWARDS } from '@/lib/xp'
import { Avatar } from '../components/Avatar'
import { RANKS, useGame } from '../context/GameContext'
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
  const { stats, currentMood, setMood, tasks } = useGame()
  const [isXPAvailable, setIsXPAvailable] = useState(false)
  const [xpFeedback, setXpFeedback] = useState<{
    id: number
    amount: number
  } | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  // Local state for immediate UI feedback
  const [selectedMood, setSelectedMood] = useState<Mood>(currentMood)
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch mood history from backend
  const { data: moodHistoryData = [] } = trpc.user.getMoodHistory.useQuery({ days: 7 })

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
    const COOLDOWN = 60 * 60 * 1000

    const checkAvailability = () => {
      const now = Date.now()
      setIsXPAvailable(now - lastXP >= COOLDOWN)
    }

    checkAvailability()

    const interval = setInterval(checkAvailability, 60_000) // Check every minute

    return () => clearInterval(interval)
  }, [stats.lastMoodXPTimestamp])

  const handleMoodChange = (mood: Mood) => {
    // Update local state immediately for instant UI feedback
    setSelectedMood(mood)

    if (isXPAvailable) {
      setXpFeedback({ id: Date.now(), amount: 10 })
      setTimeout(() => setXpFeedback(null), 2000)
    }

    // Update backend asynchronously
    setMood(mood)
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

  // Determine current rank
  const currentRank = RANKS.find((r) => r.level === stats.level) || RANKS[0]

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

  const moods: { id: Mood; label: string; emoji: string }[] = [
    { id: 'happy', label: 'Feliz', emoji: '😄' },
    { id: 'calm', label: 'Calmo', emoji: '😌' },
    { id: 'neutral', label: 'Neutro', emoji: '😐' },
    { id: 'sad', label: 'Triste', emoji: '😔' },
    { id: 'anxious', label: 'Ansioso', emoji: '😰' },
    { id: 'angry', label: 'Bravo', emoji: '😡' },
  ]

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Floating XP Feedback Animation */}
      {xpFeedback && (
        <div
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
      <div className='relative z-10 rounded-b-[1.5rem] bg-white pt-safe shadow-sm sm:rounded-b-[2rem] dark:bg-slate-900'>
        {/* Greeting - Hidden on scroll */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isScrolled ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
          }`}
        >
          <div className='px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='font-black text-xl text-slate-800 tracking-tight sm:text-2xl dark:text-white'>
                  Olá, {stats.name}
                </h2>
                <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                  Vamos cuidar de você hoje?
                </p>
              </div>
              <div className='flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg sm:h-10 sm:w-10 sm:text-xl dark:border-slate-700 dark:bg-slate-800'>
                👋
              </div>
            </div>
          </div>
        </div>

        {/* Rank/Stats Card - Becomes sticky */}
        <div
          className={`px-4 transition-all duration-300 sm:px-6 ${
            isScrolled ? 'pb-3 pt-3 sm:pb-4 sm:pt-4' : 'pb-4 sm:pb-6'
          }`}
        >
          <div className='rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6'>
            <div className='mb-3 flex items-center justify-between sm:mb-4'>
              <div>
                <p className='font-medium text-xs text-violet-100 sm:text-sm'>{stats.name}</p>
                <h2 className='font-bold text-xl sm:text-2xl'>{currentRank.name}</h2>
              </div>
              <div className='text-right'>
                <p className='text-xs text-violet-100 sm:text-sm'>Nível {stats.level}</p>
                <p className='font-bold text-xl sm:text-2xl'>{stats.xp} XP</p>
              </div>
            </div>
            <div className='h-2.5 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm sm:h-3'>
              <div
                className='h-full rounded-full bg-white transition-all duration-500'
                style={{ width: `${stats.xp % 100}%` }}
              />
            </div>
            <p className='mt-2 text-sm text-violet-100'>
              {100 - (stats.xp % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className='flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-28 sm:space-y-6 sm:px-6 sm:py-6 sm:pb-32'
        ref={scrollContainerRef}
      >
        {/* Urgent Tasks Alert */}
        {urgentTasks.length > 0 && (
          <button
            className='slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-3 shadow-sm active:scale-[0.98] sm:rounded-3xl sm:p-4 dark:border-red-900/30 dark:bg-red-900/10'
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

        {/* Avatar Section */}
        <div className='flex justify-center py-2'>
          <Avatar config={stats.avatarConfig} mood={selectedMood} size='lg' />
        </div>

        {/* Quick Mood Check-in */}
        <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
          <h3 className='mb-3 flex items-center gap-2 font-bold text-slate-800 text-xs sm:mb-4 sm:text-sm dark:text-white'>
            Como você se sente?
            {isXPAvailable && (
              <span className='animate-pulse rounded-full bg-violet-100 px-2 py-0.5 font-bold text-[9px] text-violet-600 sm:text-[10px] dark:bg-violet-900/30 dark:text-violet-300'>
                +{XP_REWARDS.mood} XP
              </span>
            )}
          </h3>
          <div className='flex justify-between gap-1'>
            {moods.map((m) => (
              <button
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 transition-all duration-300 sm:rounded-2xl sm:p-2 ${
                  selectedMood === m.id
                    ? 'scale-105 bg-violet-50 shadow-sm ring-2 ring-violet-100 sm:scale-110 dark:bg-violet-900/20 dark:ring-violet-900/30'
                    : 'active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                key={m.id}
                onClick={() => handleMoodChange(m.id)}
                type='button'
              >
                <span className='text-2xl drop-shadow-sm filter sm:text-3xl'>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-2 gap-3 sm:gap-4'>
          <button
            className='group flex flex-col items-start gap-2 rounded-2xl bg-violet-600 p-4 text-white shadow-lg shadow-violet-200 transition-all active:scale-[0.98] hover:bg-violet-700 sm:gap-3 sm:rounded-3xl sm:p-5 dark:shadow-none'
            onClick={() => router.push('/journal')}
            type='button'
          >
            <div className='rounded-xl bg-white/20 p-2 transition-transform group-hover:scale-110 sm:rounded-2xl sm:p-2.5'>
              <BookOpen className='sm:hidden' size={18} />
              <BookOpen className='hidden sm:block' size={20} />
            </div>
            <div className='text-left'>
              <div className='font-bold text-xs leading-tight sm:text-sm'>
                Diário de
                <br />
                Pensamento
              </div>
              <div className='mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 font-bold text-[9px] opacity-70 sm:text-[10px]'>
                +{XP_REWARDS.journal} XP & Pts
              </div>
            </div>
          </button>

          <button
            className='group flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-slate-800 shadow-sm transition-all active:scale-[0.98] hover:border-teal-200 sm:gap-3 sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-teal-900/50'
            onClick={() => router.push('/meditation')}
            type='button'
          >
            <div className='rounded-xl bg-teal-50 p-2 text-teal-600 transition-transform group-hover:scale-110 sm:rounded-2xl sm:p-2.5 dark:bg-teal-900/20 dark:text-teal-400'>
              <Heart className='sm:hidden' size={18} />
              <Heart className='hidden sm:block' size={20} />
            </div>
            <div className='text-left'>
              <div className='font-bold text-xs leading-tight sm:text-sm'>
                Meditação
                <br />
                Rápida
              </div>
              <div className='mt-1 inline-block rounded-full bg-slate-50 px-2 py-0.5 font-bold text-[9px] text-slate-400 sm:text-[10px] dark:bg-slate-800'>
                +{XP_REWARDS.meditation} XP & Pts
              </div>
            </div>
          </button>
        </div>

        {/* Weekly Mood Chart */}
        <div className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
          <div className='mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3'>
            <div className='rounded-lg bg-violet-50 p-1.5 text-violet-600 sm:rounded-xl sm:p-2 dark:bg-violet-900/20 dark:text-violet-400'>
              <BarChart2 className='sm:hidden' size={16} />
              <BarChart2 className='hidden sm:block' size={18} />
            </div>
            <h3 className='font-bold text-sm text-slate-800 dark:text-white'>Humor Semanal</h3>
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
        </div>
      </div>
    </div>
  )
}
