'use client'

import {
  RiAddLine,
  RiCheckDoubleLine,
  RiCupLine,
  RiDeleteBinLine,
  RiFilmLine,
  RiGamepadLine,
  RiGift2Line,
  RiGroupLine,
  RiHeartPulseLine,
  RiLeafLine,
  RiMoonLine,
  RiPaletteLine,
  RiRunLine,
  RiShoppingBagLine,
  RiTimeLine,
  RiTrophyLine,
} from '@remixicon/react'
import confetti from 'canvas-confetti'
import Image from 'next/image'
import type React from 'react'
import { useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useSound } from '@/hooks/useSound'
import type { RewardCategory } from '@/types'
import { RewardPopup } from './RewardPopup'

type StatusTab = 'approved' | 'pending' | 'redeemed'

type IconComponent = React.ComponentType<{
  className?: string
  size?: number | string
  [key: string]: any
}>

const categories: {
  id: RewardCategory
  label: string
  description: string
  hsl: string
  icon: IconComponent
}[] = [
  {
    id: 'lazer',
    label: 'Lazer',
    description: 'Diversão e jogos',
    hsl: 'hsl(200 30% 69%)',
    icon: RiGamepadLine,
  },
  {
    id: 'autocuidado',
    label: 'Autocuidado',
    description: 'Bem-estar pessoal',
    hsl: 'hsl(330 30% 69%)',
    icon: RiHeartPulseLine,
  },
  {
    id: 'descanso',
    label: 'Descanso',
    description: 'Relaxar e recarregar',
    hsl: 'hsl(230 30% 69%)',
    icon: RiMoonLine,
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Conexões e amizades',
    hsl: 'hsl(160 30% 69%)',
    icon: RiGroupLine,
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    description: 'Comidas e bebidas',
    hsl: 'hsl(30 30% 69%)',
    icon: RiCupLine,
  },
  {
    id: 'compras',
    label: 'Compras',
    description: 'Presentes e itens',
    hsl: 'hsl(290 30% 69%)',
    icon: RiShoppingBagLine,
  },
  {
    id: 'cultura',
    label: 'Cultura',
    description: 'Arte e entretenimento',
    hsl: 'hsl(50 30% 69%)',
    icon: RiFilmLine,
  },
  {
    id: 'esporte',
    label: 'Esporte',
    description: 'Atividades físicas',
    hsl: 'hsl(0 30% 69%)',
    icon: RiRunLine,
  },
  {
    id: 'criatividade',
    label: 'Criatividade',
    description: 'Expressão artística',
    hsl: 'hsl(264 30% 69%)',
    icon: RiPaletteLine,
  },
  {
    id: 'natureza',
    label: 'Natureza',
    description: 'Ar livre e aventura',
    hsl: 'hsl(120 30% 69%)',
    icon: RiLeafLine,
  },
]

const tabs: { id: StatusTab; label: string }[] = [
  { id: 'approved', label: 'Disponíveis' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'redeemed', label: 'Resgatados' },
]

export const RewardsView: React.FC = () => {
  const { stats, redeemReward, deleteReward } = useGame()
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusTab>('approved')

  const { playReward } = useSound()

  const filteredRewards = stats.rewards
    .filter((r) => r.status === activeTab)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className='flex h-full flex-col '>
      {/* Header */}
      <header className='px-4 pt-6 pb-2'>
        <div className='flex items-center justify-between'>
          <h1 className='font-black text-xl  tracking-tight'>Loja de Prêmios</h1>
          <div className='flex items-center gap-3 '>
            <div className='flex items-center gap-1.5 rounded-full bg-[#a1c797] px-3 py-1.5'>
              <Image alt='Moeda' height={24} quality={99} src='/coin.png' width={24} />
              <span className='font-bold text-white'>{stats.points}</span>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className='mt-4 flex gap-6 border-b border-[#a1c797]'>
          {tabs.map((tab) => (
            <button
              className={`relative pb-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.id ? 'text-[#a1c797]' : 'text-black/40 hover:text-black/60'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type='button'
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#a1c797]' />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      <main className='flex-1 overflow-y-auto px-4 pt-4 pb-28' id='main-content'>
        <div className='absolute right-4 bottom-24'>
          <div className=' group relative '>
            <div
              aria-hidden='true'
              className='absolute inset-0 rounded-full bg-[#a1c797] opacity-25 blur-xl transition-opacity duration-300 group-hover:opacity-40'
            />
            <button
              aria-label='Adicionar recompensa'
              className=' relative flex h-12 px-2 items-center justify-center rounded-full  shadow-[#7f9c77]  bg-[#a1c797] text-white transition-all ring-4 ring-[#a1c797]/40 duration-300 hover:scale-105 active:scale-95  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a1c797] focus-visible:ring-offset-4'
              onClick={() => setIsAdding(true)}
              type='button'
            >
              <RiAddLine aria-hidden='true' className='sm:hidden' size={26} />
              <RiAddLine aria-hidden='true' className='hidden sm:block' size={24} />
              <span className='font-bold text-sm text-white ml-1'>Recompensa</span>
            </button>
          </div>
        </div>

        {filteredRewards.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#a1c797]/25'>
              <RiTrophyLine className='text-[#a1c797]/75' size={32} />
            </div>
            <h3 className='mb-1 font-bold text-[#a1c797] text-sm'>Lista Vazia</h3>
            <p className='max-w-[200px] text-[#a1c797]/50 text-xs'>
              {activeTab === 'approved'
                ? 'Nenhum prêmio disponível.'
                : activeTab === 'pending'
                  ? 'Nenhum prêmio pendente.'
                  : 'Nenhum prêmio resgatado.'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-3'>
            {filteredRewards.map((reward) => {
              const categoryInfo = categories.find((c) => c.id === reward.category)
              const canAfford = stats.points >= reward.cost
              const isRedeemed = reward.status === 'redeemed'
              const isApproved = reward.status === 'approved'
              const isPending = reward.status === 'pending'
              const IconComponent = categoryInfo?.icon || RiGift2Line

              return (
                <div
                  className={`group relative overflow-hidden rounded-2xl bg-[#C4A484]/15 p-2 pb-1 transition-all ${
                    isRedeemed ? 'opacity-50' : ''
                  }`}
                  key={reward.id}
                >
                  {/* Icon Area */}
                  <div
                    className='flex aspect-video items-center justify-center rounded-2xl'
                    style={{
                      backgroundColor: categoryInfo?.hsl || 'hsl(264 30% 69%)',
                    }}
                  >
                    <IconComponent className='h-12 w-12 text-white/80' />
                  </div>

                  {/* Info */}
                  <div className='p-2.5'>
                    <h3 className='truncate font-bold text-sm text-black leading-tight'>
                      {reward.title}
                    </h3>
                    <p className='mt-0.5 text-[11px] text-black/40'>
                      {categoryInfo?.description || categoryInfo?.label}
                    </p>

                    {/* Bottom Row */}
                    <div className='mt-3 flex items-center justify-between'>
                      <div className='flex items-center gap-1'>
                        <Image alt='Moeda' height={24} quality={99} src='/coin.png' width={24} />
                        <span className='font-bold text-sm text-black'>{reward.cost || '—'}</span>
                      </div>
                      {isApproved ? (
                        <button
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 ${
                            canAfford
                              ? 'bg-[#a1c797] text-white hover:bg-[#a1c797]/90'
                              : 'cursor-not-allowed bg-[#a1c797]/10 text-white/30'
                          }`}
                          disabled={!canAfford}
                          onClick={(e) => {
                            if (canAfford) {
                              playReward()
                              const rect = e.currentTarget.getBoundingClientRect()
                              confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: {
                                  x: (rect.left + rect.width / 2) / window.innerWidth,
                                  y: (rect.top + rect.height / 2) / window.innerHeight,
                                },
                                colors: ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b'],
                                zIndex: 9999,
                              })
                              redeemReward(reward.id)
                            }
                          }}
                          type='button'
                        >
                          Resgatar
                        </button>
                      ) : isPending ? (
                        <span className='flex items-center gap-1 text-[11px] font-medium text-amber-700/70'>
                          <RiTimeLine size={12} />
                          Pendente
                        </span>
                      ) : (
                        <span className='flex items-center gap-1 text-[11px] font-medium text-emerald-700/70'>
                          <RiCheckDoubleLine size={12} />
                          Resgatado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    aria-label={`Excluir ${reward.title}`}
                    className='absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/40 transition-all active:scale-95 hover:bg-red-500/80 hover:text-white'
                    onClick={() => deleteReward(reward.id)}
                    type='button'
                  >
                    <RiDeleteBinLine size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <RewardPopup isVisible={isAdding} onClose={() => setIsAdding(false)} />
    </div>
  )
}
