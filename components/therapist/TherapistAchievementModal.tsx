'use client'

import { Award, Star, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  THERAPIST_BADGE_CATEGORIES,
  type TherapistBadgeDefinition,
} from '@/lib/constants/therapist'

type TherapistAchievementModalProps = {
  achievement: TherapistBadgeDefinition | null
  onClose: () => void
}

export const TherapistAchievementModal: React.FC<TherapistAchievementModalProps> = ({
  achievement,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
    }
  }, [achievement])

  const handleClose = (): void => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!achievement) return null

  const categoryInfo = THERAPIST_BADGE_CATEGORIES[achievement.category]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      role='presentation'
    >
      <div
        className={`relative mx-4 max-w-sm transform overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl transition-all duration-300 dark:bg-slate-900 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='dialog'
        tabIndex={-1}
      >
        {/* Close Button */}
        <button
          className='absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800'
          onClick={handleClose}
          type='button'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Confetti Animation Placeholder */}
        <div className='absolute inset-0 overflow-hidden'>
          <div
            className='absolute top-0 left-1/4 h-2 w-2 animate-bounce rounded-full bg-amber-400'
            style={{ animationDelay: '0ms' }}
          />
          <div
            className='absolute top-0 left-1/2 h-2 w-2 animate-bounce rounded-full bg-emerald-400'
            style={{ animationDelay: '100ms' }}
          />
          <div
            className='absolute top-0 left-3/4 h-2 w-2 animate-bounce rounded-full bg-purple-400'
            style={{ animationDelay: '200ms' }}
          />
        </div>

        {/* Badge Icon */}
        <div className='relative mx-auto mb-6 flex h-24 w-24 items-center justify-center'>
          <div className='absolute inset-0 animate-ping rounded-full bg-amber-400/20' />
          <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-4xl shadow-lg'>
            {achievement.icon}
          </div>
        </div>

        {/* Title */}
        <div className='mb-2 flex items-center justify-center gap-2'>
          <Award className='h-5 w-5 text-amber-500' />
          <span className='font-medium text-amber-600 text-sm uppercase tracking-wide dark:text-amber-400'>
            Nova Conquista!
          </span>
        </div>

        <h2 className='mb-2 font-bold text-2xl text-slate-800 dark:text-slate-100'>
          {achievement.name}
        </h2>

        <p className='mb-4 text-slate-600 dark:text-slate-400'>{achievement.description}</p>

        {/* Category Badge */}
        <div className='mb-6 flex items-center justify-center gap-2'>
          <span
            className={`rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800 ${categoryInfo.color}`}
          >
            {categoryInfo.icon} {categoryInfo.label}
          </span>
        </div>

        {/* XP Reward */}
        <div className='mb-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 p-4 dark:from-purple-900/30 dark:to-indigo-900/30'>
          <Star className='h-6 w-6 text-purple-600 dark:text-purple-400' />
          <span className='font-bold text-2xl text-purple-700 dark:text-purple-300'>
            +{achievement.xpReward} XP
          </span>
        </div>

        {/* Close Button */}
        <button
          className='w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition-opacity hover:opacity-90'
          onClick={handleClose}
          type='button'
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
