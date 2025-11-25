'use client'

import { Award, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AchievementsList } from '@/components/therapist'

export default function AchievementsPage() {
  const router = useRouter()

  return (
    <div className='flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='bg-gradient-to-br from-amber-500 to-orange-600 pt-safe text-white'>
        <div className='flex items-center gap-3 px-4 pt-4 pb-6'>
          <button
            className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'
            onClick={() => router.back()}
            type='button'
          >
            <ChevronLeft className='h-6 w-6' />
          </button>
          <div>
            <h1 className='font-bold text-2xl'>Conquistas</h1>
            <p className='text-amber-100'>Suas medalhas e progressos</p>
          </div>
          <Award className='ml-auto h-8 w-8 text-amber-200' />
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 p-4 pb-24'>
        <AchievementsList />
      </main>
    </div>
  )
}
