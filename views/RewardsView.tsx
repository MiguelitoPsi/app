'use client'

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Gem,
  Gift,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useGame } from '../context/GameContext'
import type { RewardCategory } from '../types'

export const RewardsView: React.FC = () => {
  const { stats, addRewardRequest, redeemReward, deleteReward } = useGame()
  const [isAdding, setIsAdding] = useState(false)
  const [activeCategory, setActiveCategory] = useState<RewardCategory | 'all'>('all')

  // New Reward Form State
  const [newRewardTitle, setNewRewardTitle] = useState('')
  const [newRewardCategory, setNewRewardCategory] = useState<RewardCategory>('lazer')

  const categories: { id: RewardCategory; label: string; color: string; icon: string }[] = [
    { id: 'lazer', label: 'Lazer', color: 'from-blue-500 to-cyan-400', icon: '🎮' },
    { id: 'autocuidado', label: 'Autocuidado', color: 'from-pink-500 to-rose-400', icon: '🧖‍♀️' },
    { id: 'descanso', label: 'Descanso', color: 'from-indigo-500 to-violet-400', icon: '😴' },
    { id: 'social', label: 'Social', color: 'from-emerald-500 to-teal-400', icon: '👥' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRewardTitle.trim()) {
      return
    }

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
      <div className='z-10 rounded-b-[2rem] bg-white px-6 pt-8 pb-6 shadow-sm dark:bg-slate-900'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='font-black text-2xl text-slate-800 tracking-tight dark:text-white'>
              Loja de Prêmios
            </h2>
            <p className='font-medium text-slate-500 text-sm dark:text-slate-400'>
              Recompense suas conquistas
            </p>
          </div>
          <button
            className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-violet-100 hover:text-violet-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-violet-900/30 dark:hover:text-violet-300'
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {/* Premium Balance Card */}
        <div className='relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-slate-200 shadow-xl dark:bg-black dark:shadow-none'>
          <div className='-mt-4 -mr-4 absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-50 blur-3xl' />
          <div className='-mb-4 -ml-4 absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-40 blur-2xl' />

          <div className='relative z-10 flex items-center justify-between'>
            <div>
              <div className='mb-1 flex items-center gap-2 opacity-80'>
                <Sparkles className='text-yellow-300' size={14} />
                <span className='font-bold text-xs uppercase tracking-wider'>Saldo Disponível</span>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='font-black text-4xl tracking-tight'>{stats.points}</span>
                <span className='ml-1 font-bold text-lg opacity-60'>Pontos</span>
              </div>
            </div>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-md'>
              <Gem
                className='text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]'
                size={24}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 space-y-6 overflow-y-auto px-6 py-6'>
        {/* Add Reward Form */}
        {isAdding && (
          <div className='slide-in-from-top-4 fade-in animate-in rounded-3xl border border-slate-100 bg-white p-5 shadow-slate-200/50 shadow-xl duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='rounded-xl bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300'>
                <Gift size={20} />
              </div>
              <h3 className='font-bold text-slate-800 dark:text-white'>Nova Recompensa</h3>
            </div>

            <form className='space-y-4' onSubmit={handleSubmit}>
              <div>
                <label className='mb-1.5 ml-1 block font-bold text-slate-400 text-xs uppercase'>
                  O que você deseja?
                </label>
                <input
                  autoFocus
                  className='w-full rounded-2xl border-0 bg-slate-50 p-4 font-medium text-slate-800 text-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 dark:bg-slate-800 dark:text-white'
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  placeholder='Ex: Cinema, Jantar fora, Skin...'
                  type='text'
                  value={newRewardTitle}
                />
              </div>

              <div>
                <label className='mb-1.5 ml-1 block font-bold text-slate-400 text-xs uppercase'>
                  Categoria
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  {categories.map((cat) => (
                    <button
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 font-bold text-xs transition-all ${
                        newRewardCategory === cat.id
                          ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                          : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }
                                    `}
                      key={cat.id}
                      onClick={() => setNewRewardCategory(cat.id)}
                      type='button'
                    >
                      <span className='text-base'>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className='flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98] dark:shadow-none'
                type='submit'
              >
                <span>Criar Recompensa</span>
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Category Filter */}
        <div className='-mx-6 no-scrollbar flex snap-x gap-2 overflow-x-auto px-6 pb-2'>
          <button
            className={`flex-shrink-0 snap-start whitespace-nowrap rounded-full border px-5 py-2.5 font-bold text-xs transition-all ${
              activeCategory === 'all'
                ? 'scale-105 transform border-slate-800 bg-slate-800 text-white shadow-md dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }
                `}
            onClick={() => setActiveCategory('all')}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              className={`flex flex-shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 font-bold text-xs transition-all ${
                activeCategory === cat.id
                  ? 'scale-105 transform border-slate-800 bg-slate-800 text-white shadow-md dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }
                    `}
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Rewards List */}
        <div className='space-y-4 pb-20'>
          {filteredRewards.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800'>
                <Trophy className='text-slate-300 dark:text-slate-600' size={32} />
              </div>
              <h3 className='mb-1 font-bold text-slate-900 dark:text-white'>Lista Vazia</h3>
              <p className='max-w-[200px] text-slate-500 text-sm dark:text-slate-400'>
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
                  className={`group relative rounded-3xl border border-slate-100 bg-white p-1 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${isRedeemed ? 'opacity-60 grayscale-[0.5]' : ''}
                          `}
                  key={reward.id}
                >
                  <div className='p-4 pb-3'>
                    <div className='mb-3 flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${categoryInfo?.color || 'from-slate-400 to-slate-500'} flex items-center justify-center text-white shadow-sm`}
                        >
                          <span className='text-lg'>{categoryInfo?.icon || <Tag size={18} />}</span>
                        </div>
                        <div>
                          <h4 className='font-bold text-slate-800 leading-tight dark:text-white'>
                            {reward.title}
                          </h4>
                          <p className='mt-0.5 font-bold text-[10px] text-slate-400 uppercase tracking-wide'>
                            {categoryInfo?.label}
                          </p>
                        </div>
                      </div>

                      {/* Cost Badge */}
                      <div
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-black text-xs ${
                          isRedeemed
                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : canAfford && isApproved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }
                                    `}
                      >
                        <Gem className='fill-current' size={12} />
                        {reward.cost}
                      </div>
                    </div>

                    {/* Status Bar / Progress */}
                    {!isRedeemed && isApproved && (
                      <div className='mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
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
                  <div className='flex gap-2 rounded-b-[1.4rem] bg-slate-50 p-2 dark:bg-slate-800/50'>
                    {isApproved ? (
                      <button
                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-bold text-xs transition-all ${
                          canAfford
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:shadow-none'
                            : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800'
                        }
                                        `}
                        disabled={!canAfford}
                        onClick={() => redeemReward(reward.id)}
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
                      <div className='flex-1 bg-transparent py-3 text-center'>
                        <p className='flex items-center justify-center gap-1.5 font-bold text-slate-500 text-xs'>
                          <CheckCircle2 className='text-emerald-500' size={14} />
                          Resgatado
                        </p>
                      </div>
                    ) : (
                      <div className='flex-1 rounded-2xl border border-amber-100 bg-amber-50 py-3 text-center dark:border-amber-900/30 dark:bg-amber-900/10'>
                        <p className='flex items-center justify-center gap-1.5 font-bold text-amber-600 text-xs dark:text-amber-400'>
                          <Clock size={14} />
                          Aguardando Aprovação
                        </p>
                      </div>
                    )}

                    <button
                      className='flex w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-900/20'
                      onClick={() => deleteReward(reward.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
