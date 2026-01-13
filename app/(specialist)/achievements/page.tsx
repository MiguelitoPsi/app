'use client'

import { Award } from 'lucide-react'
import { AchievementsList } from '@/components/therapist/AchievementsList'

export default function AchievementsPage() {
  return (
    <div className='h-full overflow-y-auto px-4 py-6 pb-28 pt-safe sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Conquistas</h2>
        <p className='text-slate-500 dark:text-slate-400'>
          Suas medalhas e progressos
        </p>
      </div>

      <AchievementsList />
    </div>
  )
}
