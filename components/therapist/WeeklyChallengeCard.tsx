'use client'

import { CheckCircle2, Clock, Target, Trophy } from 'lucide-react'
import type React from 'react'
import { trpc } from '@/lib/trpc/client'

export const WeeklyChallengeCard: React.FC = () => {
  const { data: challenges, isLoading } = trpc.therapistChallenges.getCurrentWeek.useQuery()

  if (isLoading) {
    return (
      <div className='animate-pulse rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
        <div className='mb-4 h-6 w-40 rounded bg-slate-200 dark:bg-slate-700' />
        <div className='space-y-3'>
          <div className='h-20 rounded-xl bg-slate-100 dark:bg-slate-800' />
          <div className='h-20 rounded-xl bg-slate-100 dark:bg-slate-800' />
        </div>
      </div>
    )
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className='rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
        <div className='flex items-center gap-2 text-slate-800 dark:text-slate-200'>
          <Trophy className='h-5 w-5 text-amber-500' />
          <h3 className='font-semibold'>Desafios da Semana</h3>
        </div>
        <p className='mt-4 text-center text-slate-500'>Nenhum desafio ativo esta semana</p>
      </div>
    )
  }

  const completedCount = challenges.filter((c) => c.status === 'completed').length

  return (
    <div className='rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900'>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2 text-slate-800 dark:text-slate-200'>
          <Trophy className='h-5 w-5 text-amber-500' />
          <h3 className='font-semibold'>Desafios da Semana</h3>
        </div>
        <span className='rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 text-sm dark:bg-amber-900/30 dark:text-amber-400'>
          {completedCount}/{challenges.length}
        </span>
      </div>

      {/* Challenges List */}
      <div className='space-y-3'>
        {challenges.map((challenge) => {
          const isCompleted = challenge.status === 'completed'
          const progressValue =
            challenge.progress ??
            Math.min((challenge.currentCount / challenge.targetCount) * 100, 100)

          return (
            <div
              className={`rounded-xl p-4 transition-colors ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-slate-50 dark:bg-slate-800'
              }`}
              key={challenge.id}
            >
              <div className='mb-2 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  {isCompleted ? (
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                  ) : (
                    <Target className='h-5 w-5 text-slate-400' />
                  )}
                  <div>
                    <p
                      className={`font-medium ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      {challenge.title}
                    </p>
                    <p className='text-slate-500 text-sm'>{challenge.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 font-semibold text-xs ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  +{challenge.xpReward} XP
                </span>
              </div>

              {/* Progress Bar */}
              {!isCompleted && (
                <div className='mt-3'>
                  <div className='mb-1 flex justify-between text-xs text-slate-500'>
                    <span>
                      {challenge.currentCount} / {challenge.targetCount}
                    </span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all'
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Deadline */}
              {!isCompleted && challenge.weekEnd && (
                <div className='mt-2 flex items-center gap-1 text-slate-400 text-xs'>
                  <Clock className='h-3 w-3' />
                  <span>
                    Termina em{' '}
                    {new Date(challenge.weekEnd).toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
