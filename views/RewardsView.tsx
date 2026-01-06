'use client'

import confetti from 'canvas-confetti'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Gamepad2,
  Gem,
  Gift,
  Moon,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { HelpButton } from '@/components/HelpButton'
import { useSound } from '@/hooks/useSound'
import { useGame } from '../context/GameContext'
import type { RewardCategory } from '../types'

export const RewardsView: React.FC = () => {
  const { stats, addRewardRequest, redeemReward, deleteReward } = useGame()
  const [isAdding, setIsAdding] = useState(false)
  const [activeCategory, setActiveCategory] = useState<RewardCategory | 'all'>('all')

  // Sound effects
  const { playReward, playClick } = useSound()

  // New Reward Form State
  const [newRewardTitle, setNewRewardTitle] = useState('')
  const [newRewardCategory, setNewRewardCategory] = useState<RewardCategory>('lazer')

  // Listen for central button toggle event from BottomNav
  useEffect(() => {
    const handleToggle = () => {
      setIsAdding((prev) => !prev)
    }
    window.addEventListener('toggleRewardsAdd', handleToggle)
    return () => window.removeEventListener('toggleRewardsAdd', handleToggle)
  }, [])

  // Lock scroll when modal is open
  useEffect(() => {
    if (isAdding) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAdding])

  const categories: { id: RewardCategory; label: string; color: string; icon: React.ElementType }[] = [
    { id: 'lazer', label: 'Lazer', color: 'from-blue-500 to-cyan-400', icon: Gamepad2 },
    { id: 'autocuidado', label: 'Cuidado', color: 'from-pink-500 to-rose-400', icon: Sparkles },
    { id: 'descanso', label: 'Relaxar', color: 'from-indigo-500 to-sky-400', icon: Moon },
    { id: 'social', label: 'Social', color: 'from-emerald-500 to-teal-400', icon: Users },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRewardTitle.trim()) {
      return
    }

    playClick()
    addRewardRequest(newRewardTitle, newRewardCategory)
    setNewRewardTitle('')
    setIsAdding(false)
  }

  const filteredRewards = stats.rewards
    .filter((r) => {
      if (activeCategory === 'all') {
        return true
      }
      return r.category === activeCategory
    })
    .sort((a, b) => {
      const getStatusWeight = (s: string) => {
        if (s === 'approved') {
          return 1
        }
        if (s === 'pending') {
          return 2
        }
        if (s === 'redeemed') {
          return 3
        }
        return 4
      }

      const weightA = getStatusWeight(a.status)
      const weightB = getStatusWeight(b.status)

      if (weightA !== weightB) {
        return weightA - weightB
      }
      return b.createdAt - a.createdAt
    })

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header Section with Balance */}
      <header className='z-10 rounded-b-[1.5rem] bg-white px-4 pt-safe pb-4 shadow-sm sm:rounded-b-[2rem] sm:px-6 sm:pt-8 sm:pb-6 dark:bg-slate-900'>
        <div className='mb-4 flex items-center justify-between sm:mb-6'>
          <div>
            <h1 className='font-black text-xl text-slate-800 tracking-tight sm:text-2xl dark:text-white'>
              Loja de Prêmios
            </h1>
            <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
              Recompense suas conquistas
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <HelpButton screenId='rewards' />
            <button
              aria-expanded={isAdding}
              aria-label={
                isAdding ? 'Fechar formulário de nova recompensa' : 'Adicionar nova recompensa'
              }
              className='touch-target flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all active:scale-95 hover:bg-sky-100 hover:text-sky-600 sm:h-10 sm:w-10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-900/30 dark:hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'
              onClick={() => setIsAdding(!isAdding)}
              type='button'
            >
              {isAdding ? (
                <X aria-hidden='true' size={18} />
              ) : (
                <Plus aria-hidden='true' size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Premium Balance Card */}
        <section
          aria-label='Seu saldo de pontos'
          className='relative overflow-hidden rounded-2xl bg-slate-900 p-4 text-white shadow-slate-200 shadow-xl sm:rounded-3xl sm:p-6 dark:bg-black dark:shadow-none'
        >
          <div
            aria-hidden='true'
            className='-mt-4 -mr-4 absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 opacity-50 blur-3xl sm:h-32 sm:w-32'
          />
          <div
            aria-hidden='true'
            className='-mb-4 -ml-4 absolute bottom-0 left-0 h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-40 blur-2xl sm:h-24 sm:w-24'
          />

          <div className='relative z-10 flex items-center justify-between'>
            <div>
              <div className='mb-1 flex items-center gap-2 opacity-80'>
                <Sparkles aria-hidden='true' className='text-yellow-300' size={12} />
                <span className='font-bold text-[10px] uppercase tracking-wider sm:text-xs'>
                  Saldo Disponível
                </span>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='font-black text-3xl tracking-tight sm:text-4xl'>
                  {stats.points}
                </span>
                <span className='ml-1 font-bold text-base opacity-60 sm:text-lg'>Pontos</span>
              </div>
            </div>
            <div
              aria-hidden='true'
              className='flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-md sm:h-12 sm:w-12 sm:rounded-2xl'
            >
              <Gem
                className='text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]'
                size={20}
              />
            </div>
          </div>
        </section>
      </header>

      {/* Main Content Area */}
      <main
        className='flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6'
        id='main-content'
      >
        {/* Category Filter */}
        <div className='grid grid-cols-5 gap-2 sm:gap-3'>
          <button
            className={`group relative aspect-square overflow-hidden rounded-xl p-2 transition-all duration-300 sm:rounded-2xl sm:p-4 ${activeCategory === 'all' ? 'ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
            onClick={() => setActiveCategory('all')}
            type='button'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600' />
            <div className='relative flex h-full flex-col items-center justify-center gap-1 text-white sm:gap-2'>
              <Gift className='h-5 w-5 sm:h-7 sm:w-7' />
              <span className='text-center font-semibold text-[8px] leading-tight sm:text-xs'>
                Todas
              </span>
            </div>
          </button>
          {categories.map((cat) => {
            const ringColor =
              cat.id === 'lazer'
                ? 'ring-cyan-400'
                : cat.id === 'autocuidado'
                  ? 'ring-pink-400'
                  : cat.id === 'descanso'
                    ? 'ring-sky-400'
                    : 'ring-emerald-400'
            return (
              <button
                className={`group relative aspect-square overflow-hidden rounded-xl p-2 transition-all duration-300 sm:rounded-2xl sm:p-4 ${activeCategory === cat.id ? `ring-2 ${ringColor} ring-offset-2 dark:ring-offset-slate-900` : 'hover:scale-[1.02]'}`}
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                type='button'
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
                <div className='relative flex h-full flex-col items-center justify-center gap-1 text-white sm:gap-2'>
                  <cat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className='text-center font-semibold text-[8px] leading-tight sm:text-xs'>
                    {cat.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Rewards List */}
        <div className='space-y-3 pb-28 sm:space-y-4 sm:pb-32'>
          {filteredRewards.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center sm:py-16'>
              <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800'>
                <Trophy className='text-slate-300 dark:text-slate-600' size={28} />
              </div>
              <h3 className='mb-1 font-bold text-sm text-slate-900 sm:text-base dark:text-white'>
                Lista Vazia
              </h3>
              <p className='max-w-[200px] text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Adicione recompensas que você gostaria de ganhar.
              </p>
            </div>
          ) : (
            filteredRewards.map((reward) => {
              const categoryInfo = categories.find((c) => c.id === reward.category)
              const canAfford = stats.points >= reward.cost
              const isRedeemed = reward.status === 'redeemed'
              const isApproved = reward.status === 'approved'
              const _isPending = reward.status === 'pending'

              return (
                <div
                  className={`group relative rounded-2xl border border-slate-100 bg-white p-1 shadow-sm transition-all duration-300 sm:rounded-3xl sm:hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${isRedeemed ? 'opacity-60 grayscale-[0.5]' : ''}
                          `}
                  key={reward.id}
                >
                  <div className='p-3 pb-2 sm:p-4 sm:pb-3'>
                    <div className='mb-2 flex items-start justify-between sm:mb-3'>
                      <div className='flex items-center gap-2 sm:gap-3'>
                        <div
                          className={`h-9 w-9 rounded-xl bg-gradient-to-br ${categoryInfo?.color || 'from-slate-400 to-slate-500'} flex items-center justify-center text-white shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl`}
                        >
                          <span className='text-base sm:text-lg'>
                            {categoryInfo?.icon ? (
                              <categoryInfo.icon size={16} />
                            ) : (
                              <Tag size={16} />
                            )}
                          </span>
                        </div>
                        <div>
                          <h4 className='font-bold text-sm text-slate-800 leading-tight sm:text-base dark:text-white'>
                            {reward.title}
                          </h4>
                          <p className='mt-0.5 font-bold text-[9px] text-slate-400 uppercase tracking-wide sm:text-[10px]'>
                            {categoryInfo?.label}
                          </p>
                        </div>
                      </div>

                      {/* Cost Badge */}
                      <div
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-black text-[11px] sm:px-3 sm:py-1.5 sm:text-xs ${
                          isRedeemed
                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : canAfford && isApproved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }
                                    `}
                      >
                        <Gem className='fill-current' size={11} />
                        {reward.cost}
                      </div>
                    </div>

                    {/* Status Bar / Progress */}
                    {!isRedeemed && isApproved && (
                      <div className='mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100 sm:mb-4 sm:h-1.5 dark:bg-slate-800'>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${canAfford ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          style={{
                            width: canAfford
                              ? '100%'
                              : `${reward.cost > 0 ? Math.min((stats.points / reward.cost) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Area */}
                  <div className='flex gap-2 rounded-b-[1rem] bg-slate-50 p-2 sm:rounded-b-[1.4rem] dark:bg-slate-800/50'>
                    {isApproved ? (
                      <button
                        className={`touch-target flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-[11px] transition-all sm:rounded-2xl sm:py-3 sm:text-xs ${
                          canAfford
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 active:scale-[0.98] hover:scale-[1.02] dark:bg-white dark:text-slate-900 dark:shadow-none'
                            : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800'
                        }
                                        `}
                        disabled={!canAfford}
                        onClick={(e) => {
                          if (canAfford) {
                            playReward()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = (rect.left + rect.width / 2) / window.innerWidth
                            const y = (rect.top + rect.height / 2) / window.innerHeight

                            confetti({
                              particleCount: 100,
                              spread: 70,
                              origin: { x, y },
                              colors: ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b'],
                              zIndex: 9999,
                            })
                            redeemReward(reward.id)
                          }
                        }}
                        type='button'
                      >
                        {canAfford ? (
                          <>
                            <Sparkles size={14} />
                            Resgatar
                          </>
                        ) : (
                          <>Faltam {reward.cost - stats.points} pts</>
                        )}
                      </button>
                    ) : isRedeemed ? (
                      <div className='flex-1 bg-transparent py-2.5 text-center sm:py-3'>
                        <p className='flex items-center justify-center gap-1.5 font-bold text-slate-500 text-[11px] sm:text-xs'>
                          <CheckCircle2 className='text-emerald-500' size={14} />
                          Resgatado hoje
                        </p>
                        <p className='mt-0.5 text-[10px] text-slate-400 dark:text-slate-500'>
                          Disponível amanhã
                        </p>
                      </div>
                    ) : (
                      <div className='flex-1 rounded-xl border border-amber-100 bg-amber-50 py-2.5 text-center sm:rounded-2xl sm:py-3 dark:border-amber-900/30 dark:bg-amber-900/10'>
                        <p className='flex items-center justify-center gap-1.5 font-bold text-amber-600 text-[11px] sm:text-xs dark:text-amber-400'>
                          <Clock size={12} />
                          Aguardando Aprovação
                        </p>
                      </div>
                    )}

                    <button
                      aria-label={`Excluir recompensa ${reward.title}`}
                      className='touch-target flex w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors active:scale-95 hover:bg-red-50 hover:text-red-500 sm:w-10 sm:rounded-2xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
                      onClick={() => deleteReward(reward.id)}
                      type='button'
                    >
                      <Trash2 aria-hidden='true' size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Add Reward Modal */}
      {isAdding && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          {/* Backdrop */}
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setIsAdding(false)}
          />
          {/* Modal Content */}
          <div className='zoom-in-95 fade-in relative w-full max-w-md animate-in overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-200 sm:rounded-3xl sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
            <div className='mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3'>
              <div className='rounded-lg bg-sky-100 p-1.5 text-sky-600 sm:rounded-xl sm:p-2 dark:bg-sky-900/30 dark:text-sky-300'>
                <Gift size={18} />
              </div>
              <h3 className='font-bold text-sm text-slate-800 sm:text-base dark:text-white'>
                Nova Recompensa
              </h3>
            </div>

            <form className='space-y-3 sm:space-y-4' onSubmit={handleSubmit}>
              <div>
                <label className='mb-1 ml-1 block font-bold text-slate-400 text-[10px] uppercase sm:mb-1.5 sm:text-xs'>
                  O que você deseja?
                </label>
                <input
                  autoFocus
                  className='w-full rounded-xl border-0 bg-slate-50 p-3 font-medium text-slate-800 text-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 sm:rounded-2xl sm:p-4 sm:text-base dark:bg-slate-800 dark:text-white'
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  placeholder='Ex: Cinema, Jantar fora, Skin...'
                  type='text'
                  value={newRewardTitle}
                />
              </div>

              <div>
                <label className='mb-1 ml-1 block font-bold text-slate-400 text-[10px] uppercase sm:mb-1.5 sm:text-xs'>
                  Categoria
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  {categories.map((cat) => (
                    <button
                      className={`flex items-center gap-2 rounded-lg border-2 p-2.5 font-bold text-[11px] transition-all sm:rounded-xl sm:p-3 sm:text-xs ${
                        newRewardCategory === cat.id
                          ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                          : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }
                                    `}
                      key={cat.id}
                      onClick={() => setNewRewardCategory(cat.id)}
                      type='button'
                    >
                      <span className='text-sm sm:text-base'>
                        <cat.icon size={16} />
                      </span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex gap-3 pt-2'>
                <button
                  className='flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  onClick={() => setIsAdding(false)}
                  type='button'
                >
                  Cancelar
                </button>
                <button
                  className='touch-target flex flex-[2] items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-bold text-sm text-white shadow-lg shadow-sky-200 transition-all active:scale-[0.98] hover:bg-sky-700 dark:shadow-none'
                  type='submit'
                >
                  <span>Criar Recompensa</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

