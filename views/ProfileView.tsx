'use client'

import {
  Bell,
  BellOff,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Key,
  LayoutGrid,
  Lock,
  LogOut,
  Moon,
  Quote,
  Settings,
  Shield,
  Star,
  Stethoscope,
  Sun,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AvatarOficial from '@/components/Avatar-oficial'
import { HelpButton } from '@/components/HelpButton'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { authClient } from '@/lib/auth-client'
import { BADGE_CATEGORIES } from '@/lib/constants'
import { getXPForLevel, getXPInfo } from '@/lib/xp'
import { RANKS, useGame } from '../context/GameContext'
import type { BadgeDefinition, Tab, UserStats } from '../types'

// Props allow parent navigation
type ProfileViewProps = {
  onNavigate?: (tab: Tab) => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { stats, currentMood, allBadges, toggleTheme } = useGame()
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'rank' | 'achievements'>('stats')
  const [showSettings, setShowSettings] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const { data: termsData } = require('@/lib/trpc/client').trpc.user.checkTermsAccepted.useQuery()

  // Push notifications hook
  const {
    isSupported: isPushSupported,
    permissionState,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    toggle: togglePush,
  } = usePushNotifications()

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
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  // Track scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollY(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Daily quote
  const dailyQuote = useMemo(() => {
    const quotes = [
      'A única jornada impossível é aquela que você nunca começa.',
      'Pequenos progressos todos os dias somam grandes resultados.',
      'Seja gentil com a sua mente.',
      'Respire fundo. Você está indo bem.',
      'O autoconhecimento é o superpoder da mente.',
      'Sua saúde mental é uma prioridade, não um luxo.',
      'Cada dia é uma nova chance de recomeçar.',
      'Você é mais forte do que seus pensamentos negativos.',
    ]
    const today = new Date()
    const start = new Date(today.getFullYear(), 0, 0)
    const diff =
      today.getTime() -
      start.getTime() +
      (start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    return quotes[dayOfYear % quotes.length]
  }, [])

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

  // Change password handler
  const resetPasswordForm = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    // Validations
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

      if (
        error &&
        (error.message?.includes('Invalid password') || error.message?.includes('incorrect'))
      ) {
        setPasswordError('Senha atual incorreta')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordError('')
        setPasswordSuccess(false)
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Erro ao alterar senha')
      setIsChangingPassword(false)
    }
  }

  // Helper to format unlock date
  const formatUnlockDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const day = date.getDate()
    const month = date.toLocaleDateString('pt-BR', { month: 'long' })
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)
    const year = date.getFullYear()
    return `${day} de ${capitalizedMonth}, ${year}`
  }

  // Determine badge status, treating 100% progress as unlocked
  const getBadgeStatus = (badge: BadgeDefinition) => {
    const unlockedInfo = stats.badges.find((b) => b.id === badge.id)
    let rawValue: number | boolean = 0
    if (badge.metric === 'auto') {
      rawValue = 1
    } else {
      rawValue = stats[badge.metric as keyof UserStats] as number | boolean
    }
    const metricValue =
      typeof rawValue === 'boolean'
        ? rawValue
          ? 1
          : 0
        : typeof rawValue === 'number'
          ? rawValue
          : 0
    const percentage =
      badge.requirement > 0
        ? Math.min(100, Math.max(0, (metricValue / badge.requirement) * 100))
        : 100
    const isUnlocked = !!unlockedInfo || percentage === 100
    return {
      isUnlocked,
      unlockedDate: unlockedInfo?.date,
      currentProgress: metricValue,
      progressPercentage: percentage,
    }
  }

  // Rank calculations
  const currentRankIndex = Math.min(stats.level - 1, RANKS.length - 1)
  const currentRank = RANKS[currentRankIndex]
  const xpInfo = getXPInfo(stats.xp)
  const { xpForNextLevel, progressPercent: levelProgressPercent } = xpInfo

  const selectedBadgeStatus = selectedBadge ? getBadgeStatus(selectedBadge) : null

  return (
    <div
      className='relative h-full overflow-y-auto px-4 pt-safe py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32'
      ref={containerRef}
    >
      {/* Settings button */}
      <div className='mb-3 flex justify-end gap-2 sm:mb-4'>
        <HelpButton screenId='profile' />
        <button
          className='touch-target p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          onClick={() => setShowSettings(true)}
          type='button'
        >
          <Settings className='sm:hidden' size={18} />
          <Settings className='hidden sm:block' size={20} />
        </button>
      </div>

      {/* Avatar and user info */}
      <div className='mb-6 flex flex-col items-center sm:mb-8'>
        <div className='mb-3 sm:mb-4'>
          <AvatarOficial mood={currentMood} size='lg' />
        </div>
        <div className='mb-3 space-y-1 text-center sm:mb-4'>
          <h1 className='font-bold text-xl text-slate-900 sm:text-2xl dark:text-white'>
            {stats.name}
          </h1>
          <div className='flex items-center justify-center gap-2'>
            <Crown className='text-violet-600 dark:text-violet-400' size={14} />
            <span className='font-bold text-sm text-violet-600 sm:text-base dark:text-violet-400'>
              {currentRank.name}
            </span>
          </div>
          <div className='mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-500 text-[10px] sm:text-xs dark:bg-slate-800 dark:text-slate-400'>
            <Shield size={10} />
            <span>Nível {stats.level}</span>
          </div>
        </div>
        {/* Daily Quote */}
        <div className='relative mt-2 max-w-xs rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-center sm:rounded-2xl sm:px-6 sm:py-4 dark:border-violet-900/30 dark:bg-violet-900/20'>
          <Quote
            className='-top-2 -left-1 absolute rounded-full bg-white fill-current p-0.5 text-violet-300 dark:bg-slate-900 dark:text-violet-600'
            size={14}
          />
          <p className='font-medium text-violet-800 text-[11px] italic leading-relaxed sm:text-xs dark:text-violet-200'>
            "{dailyQuote}"
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className='mx-1 mb-6 flex rounded-lg bg-slate-100 p-1 transition-colors sm:mb-8 sm:rounded-xl dark:bg-slate-800'>
        <button
          className={`touch-target flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-bold text-[10px] transition-all duration-200 sm:gap-2 sm:rounded-lg sm:py-2.5 sm:text-xs ${
            activeTab === 'stats'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('stats')}
          type='button'
        >
          <LayoutGrid size={14} /> Resumo
        </button>
        <button
          className={`touch-target flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-bold text-[10px] transition-all duration-200 sm:gap-2 sm:rounded-lg sm:py-2.5 sm:text-xs ${
            activeTab === 'rank'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('rank')}
          type='button'
        >
          <Crown size={14} /> Rank
        </button>
        <button
          className={`touch-target flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-bold text-[10px] transition-all duration-200 sm:gap-2 sm:rounded-lg sm:py-2.5 sm:text-xs ${
            activeTab === 'achievements'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('achievements')}
          type='button'
        >
          <Trophy size={16} /> Conquistas
        </button>
      </div>

      {/* Content area */}
      <div className='min-h-[300px]'>
        {activeTab === 'stats' && (
          <div className='slide-in-from-left-4 fade-in animate-in space-y-4 duration-300 sm:space-y-6'>
            <div className='grid grid-cols-3 gap-2 sm:gap-4'>
              <div className='zoom-in flex animate-in flex-col items-center rounded-xl border border-slate-100 bg-white fill-mode-backwards p-3 shadow-sm transition-colors delay-100 duration-500 sm:rounded-2xl sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                <Flame className='mb-1.5 text-orange-500 sm:mb-2' size={20} />
                <span className='font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                  {stats.streak}
                </span>
                <span className='text-[9px] text-slate-400 uppercase tracking-wider sm:text-[10px] dark:text-slate-500'>
                  Dias
                </span>
              </div>
              <div className='zoom-in flex animate-in flex-col items-center rounded-xl border border-slate-100 bg-white fill-mode-backwards p-3 shadow-sm transition-colors delay-200 duration-500 sm:rounded-2xl sm:p-4 dark:border-slate-700 dark:bg-slate-800'>
                <Target className='mb-1.5 text-violet-500 sm:mb-2' size={20} />
                <span className='font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                  {stats.xp}
                </span>
                <span className='text-[9px] text-slate-400 uppercase tracking-wider sm:text-[10px] dark:text-slate-500'>
                  Total XP
                </span>
              </div>
              <div
                className='zoom-in flex animate-in cursor-pointer flex-col items-center rounded-xl border border-slate-100 bg-white fill-mode-backwards p-3 shadow-sm transition-colors delay-300 duration-500 hover:border-violet-200 hover:bg-violet-50 sm:rounded-2xl sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-900 dark:hover:bg-violet-900/20'
                onClick={() => setActiveTab('rank')}
              >
                <Shield className='mb-1.5 text-emerald-500 sm:mb-2' size={20} />
                <span className='font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                  {stats.level}
                </span>
                <span className='text-[9px] text-slate-400 uppercase tracking-wider sm:text-[10px] dark:text-slate-500'>
                  Nível
                </span>
              </div>
            </div>
            <div className='rounded-xl border border-slate-100 bg-slate-50 p-4 text-center transition-colors sm:rounded-2xl sm:p-6 dark:border-slate-800 dark:bg-slate-800/50'>
              <h3 className='mb-2 font-bold text-sm text-slate-800 sm:text-base dark:text-white'>
                Resumo da Jornada
              </h3>
              <p className='text-slate-500 text-xs leading-relaxed sm:text-sm dark:text-slate-400'>
                Você já completou{' '}
                <span className='font-bold text-violet-600 dark:text-violet-400'>
                  {stats.totalMeditationMinutes} min
                </span>{' '}
                de meditação e concluiu{' '}
                <span className='font-bold text-violet-600 dark:text-violet-400'>
                  {stats.totalTasksCompleted} tarefas
                </span>
                .<br />
                Continue sua ofensiva para alcançar o próximo nível!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rank' && (
          <div className='fade-in zoom-in animate-in duration-300'>
            <div
              className='relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-4 text-white shadow-lg shadow-violet-200 transition-transform duration-300 sm:mb-8 sm:rounded-3xl sm:p-6 dark:shadow-none'
              style={{
                transform: `scale(${Math.max(0.8, 1 - scrollY / 300)})`,
                transformOrigin: 'top',
              }}
            >
              <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 blur-2xl sm:h-32 sm:w-32' />
              <div className='-ml-10 -mb-10 absolute bottom-0 left-0 h-20 w-20 rounded-full bg-black opacity-10 blur-xl sm:h-24 sm:w-24' />
              <div className='relative z-10 mb-3 flex items-center justify-between sm:mb-4'>
                <div>
                  <p className='mb-1 font-bold text-violet-100 text-[10px] uppercase tracking-wider sm:text-xs'>
                    Nível Atual
                  </p>
                  <h3 className='font-bold text-xl sm:text-2xl'>{currentRank.name}</h3>
                </div>
                <div className='rounded-xl bg-white/20 p-2 backdrop-blur-sm sm:rounded-2xl sm:p-3'>
                  <Crown className='text-white' size={24} />
                </div>
              </div>
              <div className='relative z-10'>
                <div className='mb-2 flex justify-between font-medium text-violet-100 text-[10px] sm:text-xs'>
                  <span>XP Atual: {stats.xp}</span>
                  <span>Próximo Nível: {xpForNextLevel} XP</span>
                </div>
                <div className='h-2.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm sm:h-3'>
                  <div
                    className='h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out'
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
                <p className='mt-2 text-violet-200 text-[10px] italic sm:mt-3 sm:text-xs'>
                  Faltam {xpForNextLevel - stats.xp} XP para evoluir.
                </p>
              </div>
            </div>
            <div className='relative ml-4 space-y-4 border-slate-100 border-l-2 pl-4 transition-colors dark:border-slate-800'>
              {RANKS.map((rank) => {
                const isUnlocked = stats.level >= rank.level
                const isCurrent = stats.level === rank.level
                return (
                  <div
                    className={`relative py-1 pl-6 ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}
                    key={rank.level}
                  >
                    <div
                      className={`-left-[21px] absolute top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 bg-white transition-all duration-300 dark:bg-slate-800 ${
                        isCurrent
                          ? 'scale-110 border-violet-500 text-violet-600 shadow-[0_0_0_4px_rgba(139,92,246,0.1)] dark:text-violet-400'
                          : isUnlocked
                            ? 'border-violet-200 text-violet-300 dark:border-violet-800 dark:text-violet-700'
                            : 'border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                      }`}
                    >
                      <span className='font-bold text-sm'>{rank.level}</span>
                    </div>

                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-bold text-slate-900 text-sm dark:text-white'>
                          {rank.name}
                        </h4>
                        <span className='rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-500 text-xs dark:bg-slate-800 dark:text-slate-400'>
                          {getXPForLevel(rank.level)} XP
                        </span>
                      </div>
                      <p className='text-slate-500 text-xs leading-relaxed dark:text-slate-400'>
                        {rank.description}
                      </p>
                    </div>

                    {isCurrent && (
                      <div className='mt-3 flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1 font-bold text-violet-600 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                        <Star fill='currentColor' size={12} /> Você está aqui
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className='slide-in-from-right-4 fade-in animate-in duration-300'>
            <div className='mb-4 flex items-center justify-between px-1'>
              <span className='flex items-center gap-2 font-bold text-slate-400 text-xs uppercase tracking-wider dark:text-slate-500'>
                Coleção
              </span>
              <span className='rounded-md bg-violet-50 px-2 py-1 font-bold text-violet-600 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                {stats.badges.length} / {allBadges.length}
              </span>
            </div>
            <div className='space-y-8 pb-8'>
              {Object.entries(BADGE_CATEGORIES).map(([catKey, catInfo]) => {
                const categoryBadges = allBadges.filter((b) => b.category === catKey)
                if (categoryBadges.length === 0) return null
                return (
                  <div className='space-y-3' key={catKey}>
                    <div className={`flex items-center gap-2 font-bold text-sm ${catInfo.color}`}>
                      <span className='text-lg'>{catInfo.icon}</span>
                      <h3>{catInfo.label}</h3>
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      {categoryBadges.map((badge, index) => {
                        const { isUnlocked, currentProgress, progressPercentage } =
                          getBadgeStatus(badge)
                        return (
                          <button
                            className={`touch-target slide-in-from-bottom-4 fade-in group relative flex w-full animate-in items-center gap-2 overflow-hidden rounded-xl border p-3 text-left transition-all duration-500 sm:gap-3 sm:p-4 ${
                              isUnlocked
                                ? 'transform border-violet-200 bg-violet-50 text-violet-600 shadow-[0_4px_20px_rgba(139,92,246,0.15)] hover:scale-[1.02] active:scale-95 dark:border-violet-800 dark:bg-violet-900/30 dark:shadow-none'
                                : 'border-slate-100 bg-slate-50 opacity-60 grayscale hover:opacity-80 dark:border-slate-800 dark:bg-slate-900'
                            }`}
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animationFillMode: 'backwards',
                            }}
                            type='button'
                          >
                            {isUnlocked && (
                              <div className='pointer-events-none absolute inset-0 z-0 animate-pulse rounded-xl opacity-50 ring-2 ring-violet-400 ring-offset-2 dark:ring-violet-600 dark:ring-offset-slate-900' />
                            )}
                            <div
                              className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg p-2 text-xl sm:h-12 sm:w-12 sm:rounded-xl sm:p-3 sm:text-2xl ${
                                isUnlocked
                                  ? 'bg-violet-50 text-violet-600 ring-2 ring-violet-100 ring-offset-1 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800 dark:ring-offset-slate-800'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                              }`}
                            >
                              {isUnlocked && (
                                <div className='absolute inset-0 animate-pulse bg-violet-200 opacity-30' />
                              )}
                              <div className='relative z-10'>{badge.icon}</div>
                            </div>
                            <div className='z-10 min-w-0 flex-1'>
                              <div
                                className={`truncate font-bold text-xs sm:text-sm ${
                                  isUnlocked
                                    ? 'text-slate-800 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {badge.name}
                              </div>
                              <div className='truncate text-slate-500 text-[10px] sm:text-xs dark:text-slate-500'>
                                {badge.description}
                              </div>
                              {!isUnlocked && badge.metric !== 'auto' && (
                                <div className='mt-2 space-y-1'>
                                  <div className='flex justify-between font-bold text-[10px] text-slate-400 dark:text-slate-500'>
                                    <span>{Math.round(progressPercentage)}%</span>
                                    <span>
                                      {currentProgress}/{badge.requirement}
                                    </span>
                                  </div>
                                  <div className='h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'>
                                    <div
                                      className='h-full rounded-full bg-violet-400 transition-all duration-1000 ease-out dark:bg-violet-600'
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {!isUnlocked && (
                                <div className='absolute top-2 right-2 z-10 text-slate-300 dark:text-slate-700'>
                                  <Lock size={14} />
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

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
              {/* ...demais opções de configuração... */}
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
                  onClick={toggleTheme}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
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
                      isPushSubscribed ? 'Desativar notificações push' : 'Ativar notificações push'
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
                        togglePush()
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isPushLoading && permissionState !== 'denied') {
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
                className='touch-target flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-violet-200 hover:bg-violet-50 sm:p-4 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-900/20'
                onClick={() => {
                  setShowSettings(false)
                  resetPasswordForm()
                  setShowChangePassword(true)
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
              {onNavigate && stats.role === 'psychologist' && (
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
                  {termsData?.termsAcceptedAt ? (
                    <span className='text-xs text-green-600 dark:text-green-400 font-semibold'>
                      Assinado
                    </span>
                  ) : (
                    <span className='text-xs text-slate-400 dark:text-slate-500 font-semibold'>
                      Não assinado
                    </span>
                  )}
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

      {/* Modal do termo de consentimento */}
      {showConsent && (
        <div className='fade-in fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900'>
            <div className='border-slate-100 border-b bg-slate-50/50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/50'>
              <div className='flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
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
                  Este Termo de Consentimento Livre e Esclarecido (TCLE) tem como objetivo fornecer
                  informações sobre a utilização da plataforma de acompanhamento terapêutico.
                </p>
                <h3 className='text-slate-900 dark:text-white font-bold'>
                  1. Objetivo da Plataforma
                </h3>
                <p className='text-slate-800 dark:text-slate-200'>
                  Esta plataforma foi desenvolvida para auxiliar no acompanhamento do seu processo
                  terapêutico, permitindo o registro de humor, diário de pensamentos, realização de
                  tarefas e meditações.
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
                  Ao utilizar a plataforma, você se compromete a fornecer informações verídicas e a
                  utilizar os recursos de forma responsável.
                </p>
                <h3 className='text-slate-900 dark:text-white font-bold'>5. Desistência</h3>
                <p className='text-slate-800 dark:text-slate-200'>
                  Você pode deixar de utilizar a plataforma a qualquer momento, sem prejuízo ao seu
                  atendimento terapêutico presencial ou online.
                </p>
              </div>
              <div className='mt-6 rounded-xl bg-violet-50 p-4 text-slate-700 text-sm dark:bg-violet-900/20 dark:text-slate-200'>
                <strong>Data/hora da assinatura:</strong>{' '}
                {termsData?.termsAcceptedAt ? (
                  <span className='font-mono'>{formatDateTime(termsData.termsAcceptedAt)}</span>
                ) : (
                  <span className='italic text-slate-400'>Não assinado</span>
                )}
              </div>
            </div>
            <div className='border-slate-100 border-t bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end'>
                <button
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition-all hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 sm:w-auto'
                  onClick={() => setShowConsent(false)}
                  type='button'
                >
                  Fechar
                </button>
              </div>
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
                  resetPasswordForm()
                }}
              >
                <div className='space-y-4'>
                  {/* Current Password */}
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

                  {/* New Password */}
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

                  {/* Confirm Password */}
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

                  {/* Error Message */}
                  {passwordError && (
                    <div className='rounded-lg bg-red-50 p-3 text-center text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400'>
                      {passwordError}
                    </div>
                  )}

                  {/* Submit Button */}
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

      {/* Badge Detail Modal */}
      {selectedBadge && selectedBadgeStatus && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300 sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label='Fechar modal'
              className='touch-target absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 sm:top-4 sm:right-4 sm:h-8 sm:w-8 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              onClick={() => setSelectedBadge(null)}
              type='button'
            >
              <X className='sm:hidden' size={14} />
              <X className='hidden sm:block' size={16} />
            </button>
            <div className='mt-2 flex flex-col items-center text-center'>
              <div
                className={`relative mb-3 overflow-hidden rounded-full p-4 text-4xl shadow-inner sm:mb-4 sm:p-6 sm:text-5xl ${
                  selectedBadgeStatus.isUnlocked
                    ? 'bg-violet-50 text-violet-600 shadow-violet-100 ring-4 ring-violet-50 dark:bg-violet-900/30 dark:text-violet-400 dark:shadow-none dark:ring-violet-900'
                    : 'bg-slate-100 text-slate-400 grayscale dark:bg-slate-800 dark:text-slate-600'
                }`}
              >
                {selectedBadgeStatus.isUnlocked && (
                  <div className='absolute inset-0 animate-pulse bg-violet-200 opacity-30' />
                )}
                <div className='relative z-10'>{selectedBadge.icon}</div>
              </div>
              <h3 className='font-bold text-slate-900 text-lg sm:text-xl dark:text-white'>
                {selectedBadge.name}
              </h3>
              <p className='mt-2 text-slate-500 text-sm leading-relaxed sm:text-base dark:text-slate-400'>
                {selectedBadge.description}
              </p>
              <div className='mt-6 w-full rounded-xl border border-slate-100 bg-slate-50 p-4 sm:mt-8 sm:rounded-2xl sm:p-5 dark:border-slate-700 dark:bg-slate-800'>
                {selectedBadgeStatus.isUnlocked ? (
                  <div className='space-y-1'>
                    <div className='mb-2 flex items-center justify-center gap-2 font-bold text-sm text-violet-600 uppercase tracking-wider dark:text-violet-400'>
                      <CheckCircle2 size={18} /> Conquistado
                    </div>
                    {selectedBadgeStatus.unlockedDate && (
                      <div className='text-slate-500 text-sm dark:text-slate-400'>
                        Desbloqueado em{' '}
                        <span className='font-medium text-slate-700 dark:text-slate-300'>
                          {formatUnlockDate(selectedBadgeStatus.unlockedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-center gap-2 font-bold text-slate-400 text-sm uppercase tracking-wider dark:text-slate-500'>
                      <Lock size={16} /> Bloqueado
                    </div>
                    {selectedBadge.metric !== 'auto' && (
                      <>
                        <div className='h-3 w-full overflow-hidden rounded-full border border-slate-300/50 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'>
                          <div
                            className='h-full bg-violet-400 transition-all duration-500 ease-out dark:bg-violet-600'
                            style={{
                              width: `${selectedBadgeStatus.progressPercentage}%`,
                            }}
                          />
                        </div>
                        <div className='flex justify-between px-1 font-bold text-slate-500 text-xs dark:text-slate-400'>
                          <span>Progresso atual</span>
                          <span>
                            {selectedBadgeStatus.currentProgress} / {selectedBadge.requirement}
                          </span>
                        </div>
                      </>
                    )}
                    <p className='pt-1 text-slate-400 text-xs italic dark:text-slate-500'>
                      Continue usando o app para desbloquear esta conquista.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
