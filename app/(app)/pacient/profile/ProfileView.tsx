'use client'

import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileTextLine,
  RiKeyLine,
  RiLockLine,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiNotification3Line,
  RiNotificationOffLine,
  RiShieldLine,
  RiStarFill,
  RiStethoscopeLine,
  RiSunLine,
  RiVipCrownLine,
} from '@remixicon/react'
import Image from 'next/image'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { authClient } from '@/lib/auth-client'
import { BADGE_CATEGORIES } from '@/lib/constants'
import { getIconByKey } from '@/lib/utils/icon-map'
import { getXPForLevel, getXPInfo } from '@/lib/xp'
import { RANKS, useGame } from '../../../../context/GameContext'
import type { BadgeDefinition, Tab } from '../../../../types'

// Props allow parent navigation
interface ProfileViewProps {
  onNavigate?: (tab: Tab) => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { stats, currentMood, allBadges, toggleTheme } = useGame()

  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null)
  const [activeTab, setActiveTab] = useState<'rank' | 'achievements' | 'settings' | 'mydata'>(
    'achievements'
  )
  const [showConsent, setShowConsent] = useState(false)
  const { data: termsData } = require('@/lib/trpc/client').trpc.user.checkTermsAccepted.useQuery()

  // LGPD Mutations
  const { trpc } = require('@/lib/trpc/client')
  const exportDataMutation = trpc.user.exportMyData.useMutation()
  const deleteAccountMutation = trpc.user.requestAccountDeletion.useMutation()

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
  // LGPD States
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [isExportingData, setIsExportingData] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
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
  const _dailyQuote = useMemo(() => {
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
      // Auto badges depend on whether they are unlocked in DB
      rawValue = unlockedInfo ? 1 : 0
    } else if (badge.metric === 'level') {
      rawValue = stats.level
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic access to stats
      rawValue = (stats as any)[badge.metric] || 0
    }

    const metricValue = typeof rawValue === 'number' ? rawValue : rawValue ? 1 : 0

    const percentage =
      badge.requirement > 0
        ? Math.min(100, Math.max(0, (metricValue / badge.requirement) * 100))
        : 100

    // Strict checks:
    // 1. Level requirement must be met (UI-side correction)
    const meetsLevelRequirement = badge.metric !== 'level' || stats.level >= badge.requirement
    // 2. Context must not explicitly say it's locked (if calculated there)
    const contextSaysLocked = badge.isUnlocked === false

    const isUnlocked =
      (!!unlockedInfo || percentage === 100) && meetsLevelRequirement && !contextSaysLocked

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

  // XP ring SVG calculations
  const ringRadius = 46
  const ringCircumference = 2 * Math.PI * ringRadius

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <header className='px-4 pt-6 pb-2'>
        <div className='flex items-center justify-between'>
          <h1 className='font-black text-xl tracking-tight'>Meu Perfil</h1>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1.5 rounded-full bg-[#a1c797] px-3 py-1.5'>
              <RiShieldLine className='text-white' size={16} />
              <span className='font-bold text-white'>Nv. {stats.level}</span>
            </div>
          </div>
        </div>

        {/* Avatar with XP Ring */}
        <div className='mt-6 flex flex-col items-center'>
          <div className='relative mb-3'>
            <svg className='h-[96px] w-[96px]' viewBox='0 0 100 100'>
              {/* Background track */}
              <circle
                cx='50'
                cy='50'
                fill='none'
                r={ringRadius}
                stroke='#a1c797'
                strokeOpacity='0.2'
                strokeWidth='4'
              />
              {/* Progress arc */}
              <circle
                className='transition-all duration-1000 ease-out'
                cx='50'
                cy='50'
                fill='none'
                r={ringRadius}
                stroke='#a1c797'
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - levelProgressPercent / 100)}
                strokeLinecap='round'
                strokeWidth='4'
                transform='rotate(-90 50 50)'
              />
            </svg>
            <div className='absolute inset-0 flex items-center justify-center'>
              <Image
                alt='Avatar'
                className='rounded-full'
                height={72}
                src={'/logo.jpg'}
                width={72}
              />
            </div>
            {/* Level badge */}
            <div className='absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#a1c797] text-white text-xs font-bold shadow-sm'>
              {stats.level}
            </div>
          </div>
          <div className='space-y-1 text-center'>
            <h2 className='font-bold text-xl text-black'>{stats.name}</h2>
            <div className='flex items-center justify-center gap-2'>
              <RiVipCrownLine className='text-[#a1c797]' size={14} />
              <span className='font-bold text-sm text-[#a1c797]'>{currentRank.name}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='mt-4 flex justify-center gap-6 overflow-x-auto border-b border-[#a1c797] scrollbar-none'>
          <button
            className={`relative flex-shrink-0 pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'achievements' ? 'text-[#a1c797]' : 'text-black/40 hover:text-black/60'
            }`}
            onClick={() => setActiveTab('achievements')}
            type='button'
          >
            Conquistas
            {activeTab === 'achievements' && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a1c797]' />
            )}
          </button>
          <button
            className={`relative pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'rank' ? 'text-[#a1c797]' : 'text-black/40 hover:text-black/60'
            }`}
            onClick={() => setActiveTab('rank')}
            type='button'
          >
            Rank
            {activeTab === 'rank' && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a1c797]' />
            )}
          </button>

          <button
            className={`relative flex-shrink-0 pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'settings' ? 'text-[#a1c797]' : 'text-black/40 hover:text-black/60'
            }`}
            onClick={() => setActiveTab('settings')}
            type='button'
          >
            Configurações
            {activeTab === 'settings' && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a1c797]' />
            )}
          </button>
          <button
            className={`relative flex-shrink-0 pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'mydata' ? 'text-[#a1c797]' : 'text-black/40 hover:text-black/60'
            }`}
            onClick={() => setActiveTab('mydata')}
            type='button'
          >
            Meus Dados
            {activeTab === 'mydata' && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a1c797]' />
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 overflow-y-auto px-4 pt-4 pb-28' id='main-content' ref={containerRef}>
        {activeTab === 'rank' && (
          <div>
            <div
              className='relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#a1c797] to-[#7da871] p-4 text-white shadow-lg shadow-[#a1c797]/20 transition-transform duration-300'
              style={{
                transform: `scale(${Math.max(0.8, 1 - scrollY / 300)})`,
                transformOrigin: 'top',
              }}
            >
              <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 blur-2xl' />
              <div className='-ml-10 -mb-10 absolute bottom-0 left-0 h-20 w-20 rounded-full bg-black opacity-10 blur-xl' />
              <div className='relative z-10 mb-3 flex items-center justify-between'>
                <div>
                  <p className='mb-1 font-bold text-white/70 text-[10px] uppercase tracking-wider'>
                    Nível Atual
                  </p>
                  <h3 className='font-bold text-xl'>{currentRank.name}</h3>
                </div>
                <div className='rounded-xl bg-white/20 p-2 backdrop-blur-sm'>
                  <RiVipCrownLine className='text-white' size={24} />
                </div>
              </div>
              <div className='relative z-10'>
                <div className='mb-2 flex justify-between font-medium text-white/70 text-[10px]'>
                  <span>XP Atual: {stats.xp}</span>
                  <span>Próximo Nível: {xpForNextLevel} XP</span>
                </div>
                <div className='h-2.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm'>
                  <div
                    className='h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out'
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
                <p className='mt-2 text-white/60 text-[10px] italic'>
                  Faltam {xpForNextLevel - stats.xp} XP para evoluir.
                </p>
              </div>
            </div>
            <div className='relative ml-4 space-y-4 border-[#a1c797]/30 border-l-2 pl-4'>
              {RANKS.map((rank) => {
                const isUnlocked = stats.level >= rank.level
                const isCurrent = stats.level === rank.level
                return (
                  <div
                    className={`relative py-1 pl-6 ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}
                    key={rank.level}
                  >
                    <div
                      className={`-left-[21px] absolute top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 bg-white transition-all duration-300 ${
                        isCurrent
                          ? 'scale-110 border-[#a1c797] text-[#a1c797] shadow-[0_0_0_4px_rgba(161,199,151,0.15)]'
                          : isUnlocked
                            ? 'border-[#a1c797]/40 text-[#a1c797]/60'
                            : 'border-slate-100 text-slate-300'
                      }`}
                    >
                      <span className='font-bold text-sm'>{rank.level}</span>
                    </div>

                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-bold text-black text-sm'>{rank.name}</h4>
                        <span className='rounded-md bg-[#C4A484]/15 px-2 py-1 font-medium text-black/50 text-xs'>
                          {getXPForLevel(rank.level)} XP
                        </span>
                      </div>
                      <p className='text-black/40 text-xs leading-relaxed'>{rank.description}</p>
                    </div>

                    {isCurrent && (
                      <div className='mt-3 flex w-fit items-center gap-2 rounded-full bg-[#a1c797]/10 px-3 py-1 font-bold text-[#a1c797] text-xs'>
                        <RiStarFill size={12} /> Você está aqui
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <div className='mb-4 flex items-center justify-between px-1'>
              <span className='flex items-center gap-2 font-bold text-black/40 text-xs uppercase tracking-wider'>
                Coleção
              </span>
              <span className='rounded-md bg-[#a1c797]/10 px-2 py-1 font-bold text-[#a1c797] text-xs'>
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
                      <span className='text-lg'>
                        {(() => {
                          const Icon = getIconByKey(catInfo.icon)
                          return <Icon size={18} />
                        })()}
                      </span>
                      <h3>{catInfo.label}</h3>
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      {categoryBadges.map((badge, _index) => {
                        const { isUnlocked, currentProgress, progressPercentage } =
                          getBadgeStatus(badge)
                        return (
                          <button
                            className={`group relative flex w-full items-center gap-2 overflow-hidden rounded-2xl border p-3 text-left transition-all sm:gap-3 sm:p-4 ${
                              isUnlocked
                                ? 'border-[#a1c797]/40 bg-[#a1c797]/10 text-[#a1c797] shadow-[0_4px_20px_rgba(161,199,151,0.15)] hover:scale-[1.02] active:scale-95'
                                : 'border-[#C4A484]/20 bg-[#C4A484]/10 opacity-60 grayscale hover:opacity-80'
                            }`}
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            type='button'
                          >
                            {isUnlocked && (
                              <div className='pointer-events-none absolute inset-0 z-0 animate-pulse rounded-2xl opacity-50 ring-2 ring-[#a1c797] ring-offset-2' />
                            )}
                            <div
                              className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg p-2 text-xl sm:h-12 sm:w-12 sm:rounded-xl sm:p-3 sm:text-2xl ${
                                isUnlocked
                                  ? 'bg-[#a1c797]/10 text-[#a1c797] ring-2 ring-[#a1c797]/20 ring-offset-1'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isUnlocked && (
                                <div className='absolute inset-0 animate-pulse bg-[#a1c797] opacity-20' />
                              )}
                              <div className='relative z-10'>
                                {(() => {
                                  const BadgeIcon = getIconByKey(badge.icon)
                                  return <BadgeIcon size={24} />
                                })()}
                              </div>
                            </div>
                            <div className='z-10 min-w-0 flex-1'>
                              <div
                                className={`truncate font-bold text-xs sm:text-sm ${
                                  isUnlocked ? 'text-black' : 'text-black/50'
                                }`}
                              >
                                {badge.name}
                              </div>
                              <div className='truncate text-black/40 text-[10px] sm:text-xs'>
                                {badge.description}
                              </div>
                              {!isUnlocked && badge.metric !== 'auto' && (
                                <div className='mt-2 space-y-1'>
                                  <div className='flex justify-between font-bold text-[10px] text-black/40'>
                                    <span>{Math.round(progressPercentage)}%</span>
                                    <span>
                                      {currentProgress}/{badge.requirement}
                                    </span>
                                  </div>
                                  <div className='h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-white'>
                                    <div
                                      className='h-full rounded-full bg-[#a1c797] transition-all duration-1000 ease-out'
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {!isUnlocked && (
                                <div className='absolute top-2 right-2 z-10 text-slate-300'>
                                  <RiLockLine size={14} />
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
        {/* Configurações Tab */}
        {activeTab === 'settings' && (
          <div className='space-y-3 pb-8'>
            {/* Dark Mode Toggle */}
            <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3'>
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#a1c797]/20 text-[#a1c797]'>
                  {stats.theme === 'dark' ? <RiMoonLine size={18} /> : <RiSunLine size={18} />}
                </div>
                <div className='min-w-0'>
                  <h4 className='font-bold text-black text-xs'>Modo Escuro</h4>
                  <p className='text-black/40 text-[10px]'>Ajustar aparência do app</p>
                </div>
              </div>
              <div
                aria-checked={stats.theme === 'dark'}
                aria-label={stats.theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'}
                className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                  stats.theme === 'dark' ? 'bg-[#a1c797]' : 'bg-slate-300'
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
              <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#a1c797]/20 text-[#a1c797]'>
                    {isPushSubscribed ? (
                      <RiNotification3Line size={18} />
                    ) : (
                      <RiNotificationOffLine size={18} />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <h4 className='font-bold text-black text-xs'>Notificações Push</h4>
                    <p className='text-black/40 text-[10px]'>
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
                    isPushSubscribed ? 'bg-[#a1c797]' : 'bg-slate-300'
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

            {/* Change Password */}
            <button
              className='flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-[#a1c797]/40 hover:bg-[#a1c797]/10'
              onClick={() => {
                resetPasswordForm()
                setShowChangePassword(true)
              }}
              type='button'
            >
              <div className='flex items-center gap-2'>
                <div className='rounded-lg bg-[#a1c797]/20 p-1.5 text-[#a1c797]'>
                  <RiKeyLine size={18} />
                </div>
                <div className='text-left'>
                  <h4 className='font-bold text-black text-xs'>Alterar Senha</h4>
                  <p className='text-black/40 text-[10px]'>Atualizar sua senha de acesso</p>
                </div>
              </div>
            </button>

            {/* Logout */}
            <div className='border-slate-100 border-t pt-4 mt-4'>
              <button
                className='flex w-full items-center justify-center gap-2 py-2.5 font-medium text-black/30 text-xs transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={isLoggingOut}
                onClick={handleLogout}
                type='button'
              >
                <RiLogoutBoxRLine size={16} /> {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          </div>
        )}

        {/* Meus Dados Tab */}
        {activeTab === 'mydata' && (
          <div className='space-y-3 pb-8'>
            <p className='flex items-center gap-1 font-semibold text-black/40 text-xs uppercase tracking-wider mb-2'>
              <RiShieldLine size={12} /> LGPD – Conformidade e Privacidade
            </p>

            {/* Consent Terms */}
            <button
              className='flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-[#a1c797]/40 hover:bg-[#a1c797]/10'
              onClick={() => setShowConsent(true)}
              type='button'
            >
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#a1c797]/20 text-[#a1c797]'>
                  <RiFileTextLine size={18} />
                </div>
                <div className='min-w-0 text-left'>
                  <h4 className='font-bold text-black text-xs'>Termo de Consentimento</h4>
                  <p className='text-black/40 text-[10px]'>Visualizar termo assinado e data/hora</p>
                </div>
              </div>
              <div className='flex-shrink-0'>
                {termsData?.termsAcceptedAt ? (
                  <span className='font-semibold text-[#a1c797] text-xs'>Assinado</span>
                ) : (
                  <span className='font-semibold text-black/30 text-xs'>Não assinado</span>
                )}
              </div>
            </button>

            {/* Export Data */}
            <button
              className='flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-[#a1c797]/40 hover:bg-[#a1c797]/10'
              disabled={isExportingData}
              onClick={handleExportData}
              type='button'
            >
              <div className='flex items-center gap-2'>
                <div className='rounded-lg bg-[#a1c797]/20 p-1.5 text-[#a1c797]'>
                  <RiDownloadLine size={18} />
                </div>
                <div className='text-left'>
                  <h4 className='font-bold text-black text-xs'>Exportar Meus Dados</h4>
                  <p className='text-black/40 text-[10px]'>Baixar todos os seus dados (JSON)</p>
                </div>
              </div>
              {isExportingData && (
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#a1c797] border-t-transparent' />
              )}
            </button>

            {/* Psychologist Portal (conditional) */}
            {onNavigate && stats.role === 'psychologist' && (
              <button
                className='flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-[#a1c797]/40 hover:bg-[#a1c797]/10'
                onClick={() => {
                  window.location.href = '/dashboard'
                }}
                type='button'
              >
                <div className='flex items-center gap-2'>
                  <div className='rounded-lg bg-[#a1c797]/20 p-1.5 text-[#a1c797]'>
                    <RiStethoscopeLine size={18} />
                  </div>
                  <div className='text-left'>
                    <h4 className='font-bold text-black text-xs'>Portal do Especialista</h4>
                    <p className='text-black/40 text-[10px]'>Gerencie seus pacientes</p>
                  </div>
                </div>
              </button>
            )}

            {/* Delete Account */}
            <button
              className='flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3 transition-all hover:border-red-200 hover:bg-red-50'
              onClick={() => setShowDeleteAccountModal(true)}
              type='button'
            >
              <div className='flex items-center gap-2'>
                <div className='rounded-lg bg-red-100 p-1.5 text-red-600'>
                  <RiDeleteBinLine size={18} />
                </div>
                <div className='text-left'>
                  <h4 className='font-bold text-red-700 text-xs'>Excluir Minha Conta</h4>
                  <p className='text-red-500/70 text-[10px]'>Solicitar exclusão permanente</p>
                </div>
              </div>
            </button>
          </div>
        )}
      </main>

      {/* Modal de Exclusão de Conta (LGPD) */}
      {showDeleteAccountModal && (
        <div className='fade-in fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl'>
            <div className='border-slate-100 border-b bg-red-50 px-6 py-6'>
              <div className='flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600'>
                  <RiAlertLine size={24} />
                </div>
                <div>
                  <h2 className='font-bold text-xl text-red-700'>Excluir Conta</h2>
                  <p className='text-red-600/70 text-sm'>Esta ação é irreversível</p>
                </div>
              </div>
            </div>
            <div className='p-6'>
              <div className='mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4'>
                <p className='text-amber-800 text-sm'>
                  <strong>Atenção:</strong> Ao excluir sua conta, todos os seus dados serão marcados
                  para remoção. Conforme nossa política de privacidade, seus dados serão
                  anonimizados/excluídos em até 30 dias.
                </p>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-black/60 mb-2'>
                    Confirme seu e-mail para continuar:
                  </label>
                  <input
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-black placeholder:text-black/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all'
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder='seu@email.com'
                    type='email'
                    value={deleteConfirmEmail}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-black/60 mb-2'>
                    Motivo (opcional):
                  </label>
                  <textarea
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-black placeholder:text-black/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none'
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder='Conte-nos por que está saindo...'
                    rows={3}
                    value={deleteReason}
                  />
                </div>
              </div>
            </div>
            <div className='border-slate-100 border-t bg-slate-50 p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                <button
                  className='flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-black/60 transition-all hover:bg-slate-100 active:scale-95 sm:w-auto'
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
                      <RiDeleteBinLine size={18} />
                      Excluir Minha Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do termo de consentimento */}
      {showConsent && (
        <div className='fade-in fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl'>
            <div className='border-slate-100 border-b bg-slate-50/50 px-6 py-6'>
              <div className='flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a1c797]/20 text-[#a1c797]'>
                  <RiFileTextLine size={24} />
                </div>
                <div>
                  <h2 className='font-bold text-xl text-black'>Termo de Consentimento</h2>
                  <p className='text-black/40 text-sm'>
                    Abaixo está o termo assinado e a data/hora do aceite.
                  </p>
                </div>
              </div>
            </div>
            <div className='max-h-[60vh] overflow-y-auto p-6 sm:p-8'>
              <div className='prose prose-slate max-w-none prose-headings:text-black prose-p:text-black/80 prose-li:text-black/80 prose-strong:text-black'>
                <p className='text-black/80 font-medium'>
                  Este Termo de Consentimento Livre e Esclarecido (TCLE) tem como objetivo fornecer
                  informações sobre a utilização da plataforma de acompanhamento terapêutico.
                </p>
                <h3 className='text-black font-bold'>1. Objetivo da Plataforma</h3>
                <p className='text-black/80'>
                  Esta plataforma foi desenvolvida para auxiliar no acompanhamento do seu processo
                  terapêutico, permitindo o registro de humor, diário de pensamentos, realização de
                  tarefas e meditações.
                </p>
                <h3 className='text-black font-bold'>2. Confidencialidade e Privacidade</h3>
                <p className='text-black/80'>
                  Todas as informações registradas na plataforma são confidenciais e protegidas.
                  Apenas você e seu terapeuta vinculado terão acesso aos dados inseridos.
                </p>
                <h3 className='text-black font-bold'>3. Uso de Dados</h3>
                <p className='text-black/80'>
                  Os dados coletados serão utilizados exclusivamente para fins terapêuticos e de
                  melhoria do seu acompanhamento. Dados anonimizados poderão ser utilizados para
                  fins estatísticos e de pesquisa.
                </p>
                <h3 className='text-black font-bold'>4. Compromisso do Usuário</h3>
                <p className='text-black/80'>
                  Ao utilizar a plataforma, você se compromete a fornecer informações verídicas e a
                  utilizar os recursos de forma responsável.
                </p>
                <h3 className='text-black font-bold'>5. Desistência</h3>
                <p className='text-black/80'>
                  Você pode deixar de utilizar a plataforma a qualquer momento, sem prejuízo ao seu
                  atendimento terapêutico presencial ou online.
                </p>
              </div>
              <div className='mt-6 rounded-xl bg-[#a1c797]/10 p-4 text-black/60 text-sm'>
                <strong>Data/hora da assinatura:</strong>{' '}
                {termsData?.termsAcceptedAt ? (
                  <span className='font-mono'>{formatDateTime(termsData.termsAcceptedAt)}</span>
                ) : (
                  <span className='italic text-black/30'>Não assinado</span>
                )}
              </div>
            </div>
            <div className='border-slate-100 border-t bg-slate-50 p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end'>
                <button
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-[#a1c797] px-6 py-3 font-bold text-white transition-all hover:bg-[#8db883] active:scale-95 sm:w-auto'
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
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='flex items-center gap-2 font-bold text-base text-black'>
                <RiKeyLine className='text-[#a1c797]' size={18} /> Alterar Senha
              </h3>
              <button
                aria-label='Fechar modal'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-black/40 transition-all duration-200 hover:bg-slate-200 hover:text-black/60 hover:scale-110 active:scale-95'
                onClick={() => {
                  setShowChangePassword(false)
                  resetPasswordForm()
                }}
                type='button'
              >
                <RiCloseLine size={16} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className='flex flex-col items-center py-6 text-center'>
                <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#a1c797]/20'>
                  <RiCheckboxCircleLine className='h-8 w-8 text-[#a1c797]' />
                </div>
                <h4 className='mb-2 font-bold text-lg text-black'>Senha alterada!</h4>
                <p className='text-black/40 text-sm'>Sua senha foi atualizada com sucesso.</p>
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
                      className='mb-1.5 block font-medium text-black/60 text-xs'
                      htmlFor='currentPassword'
                    >
                      Senha atual
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='current-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-black text-sm placeholder-black/30 transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20'
                        id='currentPassword'
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                      />
                      <button
                        aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 transition-colors hover:text-black/60'
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        type='button'
                      >
                        {showCurrentPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      className='mb-1.5 block font-medium text-black/60 text-xs'
                      htmlFor='newPassword'
                    >
                      Nova senha
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='new-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-black text-sm placeholder-black/30 transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20'
                        id='newPassword'
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                      />
                      <button
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 transition-colors hover:text-black/60'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        type='button'
                      >
                        {showNewPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                    <p className='mt-1 text-black/30 text-[10px]'>Mínimo de 8 caracteres</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className='mb-1.5 block font-medium text-black/60 text-xs'
                      htmlFor='confirmPassword'
                    >
                      Confirmar nova senha
                    </label>
                    <div className='relative'>
                      <input
                        autoComplete='new-password'
                        className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-black text-sm placeholder-black/30 transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20'
                        id='confirmPassword'
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='••••••••'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                      />
                      <button
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 transition-colors hover:text-black/60'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type='button'
                      >
                        {showConfirmPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {passwordError && (
                    <div className='rounded-lg bg-red-50 p-3 text-center text-red-600 text-sm'>
                      {passwordError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    className='mt-2 w-full rounded-xl bg-[#a1c797] py-3 font-semibold text-white transition-all hover:bg-[#8db883] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
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
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-300'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label='Fechar modal'
              className='absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-black/40 transition-all duration-200 hover:bg-slate-200 hover:text-black/60 hover:scale-110 active:scale-95'
              onClick={() => setSelectedBadge(null)}
              type='button'
            >
              <RiCloseLine size={16} />
            </button>
            <div className='mt-2 flex flex-col items-center text-center'>
              <div
                className={`relative mb-3 overflow-hidden rounded-full p-4 text-4xl shadow-inner ${
                  selectedBadgeStatus.isUnlocked
                    ? 'bg-[#a1c797]/10 text-[#a1c797] shadow-[#a1c797]/10 ring-4 ring-[#a1c797]/10'
                    : 'bg-slate-100 text-slate-400 grayscale'
                }`}
              >
                {selectedBadgeStatus.isUnlocked && (
                  <div className='absolute inset-0 animate-pulse bg-[#a1c797] opacity-20' />
                )}
                <div className='relative z-10'>
                  {(() => {
                    const ModalIcon = getIconByKey(selectedBadge.icon)
                    return <ModalIcon size={48} />
                  })()}
                </div>
              </div>
              <h3 className='font-bold text-black text-lg'>{selectedBadge.name}</h3>
              <p className='mt-2 text-black/40 text-sm leading-relaxed'>
                {selectedBadge.description}
              </p>
              <div className='mt-6 w-full rounded-xl border border-slate-100 bg-slate-50 p-4'>
                {selectedBadgeStatus.isUnlocked ? (
                  <div className='space-y-1'>
                    <div className='mb-2 flex items-center justify-center gap-2 font-bold text-sm text-[#a1c797] uppercase tracking-wider'>
                      <RiCheckboxCircleLine size={18} /> Conquistado
                    </div>
                    {selectedBadgeStatus.unlockedDate && (
                      <div className='text-black/40 text-sm'>
                        Desbloqueado em{' '}
                        <span className='font-medium text-black/60'>
                          {formatUnlockDate(selectedBadgeStatus.unlockedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-center gap-2 font-bold text-black/30 text-sm uppercase tracking-wider'>
                      <RiLockLine size={16} /> Bloqueado
                    </div>
                    {selectedBadge.metric !== 'auto' && (
                      <>
                        <div className='h-3 w-full overflow-hidden rounded-full border border-slate-300/50 bg-slate-200'>
                          <div
                            className='h-full bg-[#a1c797] transition-all duration-500 ease-out'
                            style={{
                              width: `${selectedBadgeStatus.progressPercentage}%`,
                            }}
                          />
                        </div>
                        <div className='flex justify-between px-1 font-bold text-black/40 text-xs'>
                          <span>Progresso atual</span>
                          <span>
                            {selectedBadgeStatus.currentProgress} / {selectedBadge.requirement}
                          </span>
                        </div>
                      </>
                    )}
                    <p className='pt-1 text-black/30 text-xs italic'>
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
