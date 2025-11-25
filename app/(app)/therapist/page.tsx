'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TherapistPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new specialist dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
        <p className='text-sm text-slate-500'>Redirecionando...</p>
      </div>
    </div>
  )
}
