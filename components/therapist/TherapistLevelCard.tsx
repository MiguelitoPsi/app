'use client'

import { Star, TrendingUp, Zap } from 'lucide-react'
import type React from 'react'
import { THERAPIST_RANKS } from '@/lib/constants/therapist'
import { trpc } from '@/lib/trpc/client'

export const TherapistLevelCard: React.FC = () => {
  const { data, isLoading } = trpc.therapistXp.getStats.useQuery()

  if (isLoading) {
    return (
      <div className='animate-pulse rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6'>
        <div className='h-24 rounded-xl bg-white/20' />
      </div>
    )
  }

  if (!data) return null

  const { stats, xpInfo, rank } = data
  const progressPercent = xpInfo.progressPercent

  return (
    <div className='overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl'>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-3xl backdrop-blur-sm'>
            {rank.icon}
          </div>
          <div>
            <p className='text-emerald-100 text-sm'>Rank Atual</p>
            <h3 className='font-bold text-xl'>{rank.name}</h3>
          </div>
        </div>
        <div className='text-right'>
          <div className='flex items-center gap-1 text-emerald-100'>
            <Star className='h-4 w-4' />
            <span className='text-sm'>Nível</span>
          </div>
          <p className='font-bold text-3xl'>{xpInfo.currentLevel}</p>
        </div>
      </div>

      {/* XP Progress */}
      <div className='mb-4'>
        <div className='mb-2 flex items-center justify-between text-sm'>
          <span className='flex items-center gap-1 text-emerald-100'>
            <Zap className='h-4 w-4' />
            {xpInfo.currentXP.toLocaleString()} XP total
          </span>
          <span className='text-emerald-100'>
            {xpInfo.xpInCurrentLevel} / {xpInfo.xpForNextLevel} XP
          </span>
        </div>
        <div className='h-3 overflow-hidden rounded-full bg-white/20'>
          <div
            className='h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm'>
          <p className='font-bold text-lg'>{xpInfo.currentStreak}</p>
          <p className='text-emerald-100 text-xs'>Dias seguidos</p>
        </div>
        <div className='rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm'>
          <p className='font-bold text-lg'>{stats.totalReportsViewed}</p>
          <p className='text-emerald-100 text-xs'>Relatórios</p>
        </div>
        <div className='rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm'>
          <p className='font-bold text-lg'>{stats.totalTasksCreated}</p>
          <p className='text-emerald-100 text-xs'>Tarefas</p>
        </div>
      </div>

      {/* Next Rank Preview */}
      {xpInfo.currentLevel < THERAPIST_RANKS.length * 5 && (
        <div className='mt-4 flex items-center gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-sm'>
          <TrendingUp className='h-5 w-5 text-emerald-200' />
          <p className='text-emerald-100 text-sm'>
            Próximo rank em{' '}
            <span className='font-semibold text-white'>{xpInfo.xpToNextLevel} XP</span>
          </p>
        </div>
      )}
    </div>
  )
}
