'use client'

import {
  CheckCircle2,
  Crown,
  Flame,
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
import { useMemo, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { RANKS, useGame } from '../context/GameContext'
import { type BadgeDefinition, Tab, type UserStats } from '../types'

// Added prop to allow navigation switch from Parent
type ProfileViewProps = {
  onNavigate?: (tab: Tab) => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { stats, currentMood, allBadges, toggleTheme } = useGame()
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'rank' | 'achievements'>('stats')

  // Settings State
  const [showSettings, setShowSettings] = useState(false)

  // Daily Quote Logic
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

    return {
      isUnlocked: !!unlockedInfo,
      unlockedDate: unlockedInfo?.date,
      currentProgress: metricValue,
      progressPercentage: percentage,
    }
  }

  const formatUnlockDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const day = date.getDate()
    const month = date.toLocaleDateString('pt-BR', { month: 'long' })
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)
    const year = date.getFullYear()
    return `${day} de ${capitalizedMonth}, ${year}`
  }

  // Calculate Rank Progress based on current stats using shared RANKS
  const currentRankIndex = Math.min(stats.level - 1, RANKS.length - 1)
  const currentRank = RANKS[currentRankIndex]

  const xpForCurrentLevel = (stats.level - 1) * 100
  const xpForNextLevel = stats.level * 100
  const xpProgressInLevel = stats.xp - xpForCurrentLevel
  const levelProgressPercent = Math.min(100, Math.max(0, (xpProgressInLevel / 100) * 100))

  const selectedBadgeStatus = selectedBadge ? getBadgeStatus(selectedBadge) : null

  return (
    <div className='relative h-full overflow-y-auto px-6 py-8 pb-24'>
      <div className='mb-4 flex justify-end'>
        <button
          className='p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          onClick={() => setShowSettings(true)}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Avatar Display */}
      <div className='mb-8 flex flex-col items-center'>
        <div className='mb-4 scale-75'>
          <Avatar config={stats.avatarConfig} mood={currentMood} size='lg' />
        </div>

        {/* Name and Rank Section - Updated Hierarchy */}
        <div className='mb-4 space-y-1 text-center'>
          <h1 className='font-bold text-2xl text-slate-900 dark:text-white'>{stats.name}</h1>
          <div className='flex items-center justify-center gap-2'>
            <Crown className='text-violet-600 dark:text-violet-400' size={16} />
            <span className='font-bold text-base text-violet-600 dark:text-violet-400'>
              {currentRank.name}
            </span>
          </div>
          <div className='mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-500 text-xs dark:bg-slate-800 dark:text-slate-400'>
            <Shield size={12} />
            <span>Nível {stats.level}</span>
          </div>
        </div>

        {/* Daily Quote */}
        <div className='relative mt-2 max-w-xs rounded-2xl border border-violet-100 bg-violet-50 px-6 py-4 text-center dark:border-violet-900/30 dark:bg-violet-900/20'>
          <Quote
            className='-top-2 -left-1 absolute rounded-full bg-white fill-current p-0.5 text-violet-300 dark:bg-slate-900 dark:text-violet-600'
            size={16}
          />
          <p className='font-medium text-violet-800 text-xs italic leading-relaxed dark:text-violet-200'>
            "{dailyQuote}"
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='mx-1 mb-8 flex rounded-xl bg-slate-100 p-1 transition-colors dark:bg-slate-800'>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-xs transition-all duration-200 sm:text-sm ${
            activeTab === 'stats'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <LayoutGrid size={16} />
          Resumo
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-xs transition-all duration-200 sm:text-sm ${
            activeTab === 'rank'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('rank')}
        >
          <Crown size={16} />
          Rank
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-xs transition-all duration-200 sm:text-sm ${
            activeTab === 'achievements'
              ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy size={16} />
          Conquistas
        </button>
      </div>

      {/* Content Area */}
      <div className='min-h-[300px]'>
        {activeTab === 'stats' && (
          <div className='slide-in-from-left-4 fade-in animate-in space-y-6 duration-300'>
            {/* Stats Grid */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='zoom-in flex animate-in flex-col items-center rounded-2xl border border-slate-100 bg-white fill-mode-backwards p-4 shadow-sm transition-colors delay-100 duration-500 dark:border-slate-700 dark:bg-slate-800'>
                <Flame className='mb-2 text-orange-500' size={24} />
                <span className='font-bold text-lg text-slate-800 dark:text-white'>
                  {stats.streak}
                </span>
                <span className='text-[10px] text-slate-400 uppercase tracking-wider dark:text-slate-500'>
                  Dias
                </span>
              </div>
              <div className='zoom-in flex animate-in flex-col items-center rounded-2xl border border-slate-100 bg-white fill-mode-backwards p-4 shadow-sm transition-colors delay-200 duration-500 dark:border-slate-700 dark:bg-slate-800'>
                <Target className='mb-2 text-violet-500' size={24} />
                <span className='font-bold text-lg text-slate-800 dark:text-white'>{stats.xp}</span>
                <span className='text-[10px] text-slate-400 uppercase tracking-wider dark:text-slate-500'>
                  Total XP
                </span>
              </div>
              <div
                className='zoom-in flex animate-in cursor-pointer flex-col items-center rounded-2xl border border-slate-100 bg-white fill-mode-backwards p-4 shadow-sm transition-colors delay-300 duration-500 hover:border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-900 dark:hover:bg-violet-900/20'
                onClick={() => setActiveTab('rank')}
              >
                <Shield className='mb-2 text-emerald-500' size={24} />
                <span className='font-bold text-lg text-slate-800 dark:text-white'>
                  {stats.level}
                </span>
                <span className='text-[10px] text-slate-400 uppercase tracking-wider dark:text-slate-500'>
                  Nível
                </span>
              </div>
            </div>

            {/* Summary Section */}
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center transition-colors dark:border-slate-800 dark:bg-slate-800/50'>
              <h3 className='mb-2 font-bold text-slate-800 dark:text-white'>Resumo da Jornada</h3>
              <p className='text-slate-500 text-sm leading-relaxed dark:text-slate-400'>
                Você já completou{' '}
                <span className='font-bold text-violet-600 dark:text-violet-400'>
                  {stats.totalMeditationMinutes} min
                </span>{' '}
                de meditação e concluiu{' '}
                <span className='font-bold text-violet-600 dark:text-violet-400'>
                  {stats.totalTasksCompleted} tarefas
                </span>
                .
                <br />
                Continue sua ofensiva para alcançar o próximo nível!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rank' && (
          <div className='fade-in zoom-in animate-in duration-300'>
            {/* Current Level Header Card */}
            <div className='relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-6 text-white shadow-lg shadow-violet-200 dark:shadow-none'>
              <div className='-mr-10 -mt-10 absolute top-0 right-0 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl' />
              <div className='-ml-10 -mb-10 absolute bottom-0 left-0 h-24 w-24 rounded-full bg-black opacity-10 blur-xl' />

              <div className='relative z-10 mb-4 flex items-center justify-between'>
                <div>
                  <p className='mb-1 font-bold text-violet-100 text-xs uppercase tracking-wider'>
                    Nível Atual
                  </p>
                  <h3 className='font-bold text-2xl'>{currentRank.name}</h3>
                </div>
                <div className='rounded-2xl bg-white/20 p-3 backdrop-blur-sm'>
                  <Crown className='text-white' size={28} />
                </div>
              </div>

              <div className='relative z-10'>
                <div className='mb-2 flex justify-between font-medium text-violet-100 text-xs'>
                  <span>XP Atual: {stats.xp}</span>
                  <span>Próximo Nível: {xpForNextLevel} XP</span>
                </div>
                <div className='h-3 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm'>
                  <div
                    className='h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out'
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
                <p className='mt-3 text-violet-200 text-xs italic'>
                  Faltam {xpForNextLevel - stats.xp} XP para evoluir.
                </p>
              </div>
            </div>

            {/* Levels List */}
            <div className='relative ml-4 space-y-4 border-slate-100 border-l-2 pl-4 transition-colors dark:border-slate-800'>
              {RANKS.map((rank) => {
                const isUnlocked = stats.level >= rank.level
                const isCurrent = stats.level === rank.level

                return (
                  <div
                    className={`relative py-1 pl-6 ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}
                    key={rank.level}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`-left-[21px] absolute top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 bg-white transition-all duration-300 dark:bg-slate-800 ${
                        isCurrent
                          ? 'scale-110 border-violet-500 text-violet-600 shadow-[0_0_0_4px_rgba(139,92,246,0.1)] dark:text-violet-400'
                          : isUnlocked
                            ? 'border-violet-200 text-violet-300 dark:border-violet-800 dark:text-violet-700'
                            : 'border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                      }
                                `}
                    >
                      {isUnlocked ? (
                        <span className='font-bold text-sm'>{rank.level}</span>
                      ) : (
                        <Lock size={14} />
                      )}
                    </div>

                    <div
                      className={`rounded-2xl border p-4 transition-all duration-300 ${
                        isCurrent
                          ? 'border-violet-200 bg-white shadow-md dark:border-violet-800 dark:bg-slate-800'
                          : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                      }
                                `}
                    >
                      <div className='mb-1 flex items-start justify-between'>
                        <h4
                          className={`font-bold ${isCurrent ? 'text-violet-700 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {rank.name}
                        </h4>
                        <span className='rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-400 text-xs dark:bg-slate-800 dark:text-slate-500'>
                          {rank.minXp} XP
                        </span>
                      </div>
                      <p className='text-slate-500 text-xs leading-relaxed dark:text-slate-400'>
                        {rank.description}
                      </p>
                      {isCurrent && (
                        <div className='mt-3 flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1 font-bold text-violet-600 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                          <Star fill='currentColor' size={12} />
                          Você está aqui
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className='slide-in-from-right-4 fade-in animate-in duration-300'>
            {/* Badges Header */}
            <div className='mb-4 flex items-center justify-between px-1'>
              <span className='flex items-center gap-2 font-bold text-slate-400 text-xs uppercase tracking-wider dark:text-slate-500'>
                Coleção
              </span>
              <span className='rounded-md bg-violet-50 px-2 py-1 font-bold text-violet-600 text-xs dark:bg-violet-900/30 dark:text-violet-400'>
                {stats.badges.length} / {allBadges.length}
              </span>
            </div>

            {/* Badges Grid */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {allBadges.map((badge, index) => {
                const { isUnlocked, progressPercentage, currentProgress } = getBadgeStatus(badge)

                return (
                  <button
                    className={`slide-in-from-bottom-4 fade-in group relative flex w-full animate-in items-center gap-3 overflow-hidden rounded-xl border p-4 text-left transition-all duration-500 ${
                      isUnlocked
                        ? 'transform border-violet-200 bg-white shadow-[0_4px_20px_rgba(139,92,246,0.15)] hover:scale-[1.02] active:scale-95 dark:border-violet-800 dark:bg-slate-800 dark:shadow-none'
                        : 'border-slate-100 bg-slate-50 opacity-60 grayscale hover:opacity-80 dark:border-slate-800 dark:bg-slate-900'
                    }
                            `}
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    {/* Subtle Shimmer for Unlocked Badges */}
                    {isUnlocked && (
                      <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl'>
                        <div className='-translate-x-full absolute top-0 left-0 h-full w-full animate-subtle-shimmer bg-gradient-to-r from-transparent via-violet-200/30 to-transparent dark:via-white/10' />
                      </div>
                    )}

                    {/* Pulse Effect Ring */}
                    {isUnlocked && (
                      <div className='pointer-events-none absolute inset-0 z-0 animate-pulse rounded-xl opacity-50 ring-2 ring-violet-400 ring-offset-2 dark:ring-violet-600 dark:ring-offset-slate-900' />
                    )}

                    <div
                      className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl p-3 text-2xl ${
                        isUnlocked
                          ? 'bg-violet-50 text-violet-600 ring-2 ring-violet-100 ring-offset-1 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800 dark:ring-offset-slate-800'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                      }
                            `}
                    >
                      {isUnlocked && (
                        <div className='absolute inset-0 animate-pulse bg-violet-200 opacity-30' />
                      )}
                      <div className='relative z-10'>{badge.icon}</div>
                    </div>

                    <div className='z-10 min-w-0 flex-1'>
                      <div
                        className={`truncate font-bold text-sm ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        {badge.name}
                      </div>
                      <div className='truncate text-slate-500 text-xs dark:text-slate-500'>
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
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {!isUnlocked && (
                      <div className='absolute top-2 right-2 z-10 text-slate-300 dark:text-slate-700'>
                        <Lock size={14} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl duration-300 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-6 flex items-center justify-between'>
              <h3 className='flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white'>
                <Settings className='text-slate-400' size={20} />
                Configurações
              </h3>
              <button
                className='rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-200'
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-800'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
                    {stats.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <h4 className='font-bold text-slate-800 text-sm dark:text-white'>
                      Modo Escuro
                    </h4>
                    <p className='text-slate-500 text-xs dark:text-slate-400'>
                      Ajustar aparência do app
                    </p>
                  </div>
                </div>
                <button
                  className={`relative h-6 w-12 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${stats.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'}
                            `}
                  onClick={toggleTheme}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${stats.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
                                `}
                  />
                </button>
              </div>

              {/* Therapist Access Button */}
              {onNavigate && (
                <button
                  className='group flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30'
                  onClick={() => onNavigate(Tab.THERAPIST)}
                >
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg bg-indigo-200 p-2 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300'>
                      <Stethoscope size={20} />
                    </div>
                    <div className='text-left'>
                      <h4 className='font-bold text-indigo-900 text-sm dark:text-indigo-200'>
                        Portal do Especialista
                      </h4>
                      <p className='text-indigo-600 text-xs dark:text-indigo-400'>
                        Acessar painel do terapeuta
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className='mt-8 border-slate-100 border-t pt-6 dark:border-slate-800'>
              <button className='flex w-full items-center justify-center gap-2 py-3 font-medium text-slate-400 text-sm transition-colors hover:text-red-500 dark:text-slate-500'>
                <LogOut size={16} />
                Sair da conta
              </button>
            </div>
          </div>
          <div className='-z-10 absolute inset-0' onClick={() => setShowSettings(false)} />
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && selectedBadgeStatus && (
        <div className='fade-in fixed inset-0 z-[100] flex animate-in items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative w-full max-w-sm animate-in rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl duration-300 dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='absolute top-4 right-4 rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              onClick={() => setSelectedBadge(null)}
            >
              <X size={20} />
            </button>

            <div className='mt-2 flex flex-col items-center text-center'>
              <div
                className={`relative mb-4 overflow-hidden rounded-full p-6 text-5xl shadow-inner ${
                  selectedBadgeStatus.isUnlocked
                    ? 'bg-violet-50 text-violet-600 shadow-violet-100 ring-4 ring-violet-50 dark:bg-violet-900/30 dark:text-violet-400 dark:shadow-none dark:ring-violet-900'
                    : 'bg-slate-100 text-slate-400 grayscale dark:bg-slate-800 dark:text-slate-600'
                }
                    `}
              >
                {selectedBadgeStatus.isUnlocked && (
                  <div className='absolute inset-0 animate-pulse bg-violet-200 opacity-30' />
                )}
                <div className='relative z-10'>{selectedBadge.icon}</div>
              </div>

              <h3 className='font-bold text-slate-900 text-xl dark:text-white'>
                {selectedBadge.name}
              </h3>
              <p className='mt-2 text-slate-500 leading-relaxed dark:text-slate-400'>
                {selectedBadge.description}
              </p>

              <div className='mt-8 w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800'>
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
                            style={{ width: `${selectedBadgeStatus.progressPercentage}%` }}
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

              <button
                className='mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-600 text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                onClick={() => setSelectedBadge(null)}
              >
                Fechar
              </button>
            </div>
          </div>

          <div className='-z-10 absolute inset-0' onClick={() => setSelectedBadge(null)} />
        </div>
      )}
    </div>
  )
}
