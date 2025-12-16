'use client'

import { Award, Lock } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { getIconByKey } from '@/lib/utils/icon-map'
import {
  THERAPIST_BADGE_CATEGORIES,
  THERAPIST_BADGE_DEFINITIONS,
  type TherapistBadgeCategory,
} from '@/lib/constants/therapist'
import { trpc } from '@/lib/trpc/client'

export const AchievementsList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TherapistBadgeCategory | 'all'>('all')
  const { data: unlockedAchievements, isLoading } = trpc.therapistAchievements.getAll.useQuery()

  const unlockedIds = new Set(unlockedAchievements?.map((a) => a.achievementId) ?? [])

  const filteredBadges = THERAPIST_BADGE_DEFINITIONS.filter(
    (badge) => selectedCategory === 'all' || badge.category === selectedCategory
  )

  const categories: { id: TherapistBadgeCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todas' },
    ...Object.entries(THERAPIST_BADGE_CATEGORIES).map(([id, info]) => ({
      id: id as TherapistBadgeCategory,
      label: info.label,
    })),
  ]

  if (isLoading) {
    return (
      <div className='animate-pulse space-y-4'>
        <div className='flex gap-2 overflow-x-auto'>
          {[1, 2, 3, 4].map((i) => (
            <div className='h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-700' key={i} />
          ))}
        </div>
        <div className='grid grid-cols-2 gap-3'>
          {[1, 2, 3, 4].map((i) => (
            <div className='h-32 rounded-xl bg-slate-100 dark:bg-slate-800' key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Category Filter */}
      <div className='flex gap-2 overflow-x-auto pb-2'>
        {categories.map((cat) => (
          <button
            className={`shrink-0 rounded-full px-4 py-2 font-medium text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            type='button'
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className='flex items-center gap-2 text-slate-600 dark:text-slate-400'>
        <Award className='h-5 w-5 text-amber-500' />
        <span className='text-sm'>
          {unlockedIds.size} de {THERAPIST_BADGE_DEFINITIONS.length} conquistas desbloqueadas
        </span>
      </div>

      {/* Achievements Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {filteredBadges.map((badge) => {
          const isUnlocked = unlockedIds.has(badge.id)
          const categoryInfo = THERAPIST_BADGE_CATEGORIES[badge.category]

          return (
            <div
              className={`relative rounded-xl p-4 transition-all ${
                isUnlocked
                  ? 'bg-white shadow-sm dark:bg-slate-900'
                  : 'bg-slate-100 opacity-60 dark:bg-slate-800/50'
              }`}
              key={badge.id}
            >
              {/* Lock Icon for Locked Badges */}
              {!isUnlocked && (
                <div className='absolute top-2 right-2'>
                  <Lock className='h-4 w-4 text-slate-400' />
                </div>
              )}

              {/* Badge Icon */}
              <div
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
                    : 'bg-slate-200 grayscale dark:bg-slate-700'
                }`}
              >
                {(() => {
                  const BadgeIcon = getIconByKey(badge.icon)
                  return <BadgeIcon />
                })()}
              </div>

              {/* Badge Info */}
              <h4
                className={`mb-1 font-semibold text-sm ${isUnlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}
              >
                {badge.name}
              </h4>
              <p className='mb-2 line-clamp-2 text-slate-500 text-xs'>{badge.description}</p>

              {/* Category & XP */}
              <div className='flex items-center justify-between'>
                <span className={`text-xs ${categoryInfo.color}`}>
                  {(() => {
                    const CatIcon = getIconByKey(categoryInfo.icon)
                    return <CatIcon size={14} />
                  })()}
                </span>
                <span
                  className={`font-medium text-xs ${isUnlocked ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                >
                  +{badge.xpReward} XP
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
