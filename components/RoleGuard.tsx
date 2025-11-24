'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type RoleGuardProps = {
  children: ReactNode
  allowedRoles: ('admin' | 'psychologist' | 'patient')[]
  fallbackPath?: string
}

export function RoleGuard({ children, allowedRoles, fallbackPath = '/home' }: RoleGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const { data: profile, isLoading, error } = trpc.user.getProfile.useQuery()

  useEffect(() => {
    if (isLoading) return

    if (error || !profile) {
      router.push('/auth/signin')
      return
    }

    const userRole = profile.role as 'admin' | 'psychologist' | 'patient'

    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      router.push(fallbackPath)
    }
  }, [profile, isLoading, error, allowedRoles, fallbackPath, router])

  if (isLoading || isAuthorized === null) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
          <p className='text-sm text-slate-500 dark:text-slate-400'>Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
