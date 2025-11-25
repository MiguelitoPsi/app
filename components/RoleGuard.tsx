'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { getHomeRouteForRole, type UserRole } from '@/lib/auth/roles'
import { trpc } from '@/lib/trpc/client'

type RoleGuardProps = {
  children: ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const { data: profile, isLoading, error } = trpc.user.getProfile.useQuery()

  useEffect(() => {
    // Debug log
    console.log('[RoleGuard] State:', {
      isLoading,
      hasProfile: !!profile,
      role: profile?.role,
      roleType: typeof profile?.role,
      allowedRoles,
      error: error?.message,
    })

    if (isLoading) return

    if (error || !profile) {
      console.log('[RoleGuard] No profile or error, redirecting to signin')
      router.push('/auth/signin')
      return
    }

    // Normaliza a role para lowercase para comparação case-insensitive
    const userRole = (profile.role?.toLowerCase() || 'patient') as UserRole
    console.log('[RoleGuard] Checking role:', userRole, 'allowed:', allowedRoles)

    if (allowedRoles.includes(userRole)) {
      console.log('[RoleGuard] Role authorized')
      setIsAuthorized(true)
    } else {
      console.log('[RoleGuard] Role NOT authorized, redirecting...')
      setIsAuthorized(false)
      // Usa o fallbackPath fornecido ou redireciona para a home correta da role
      const redirectTo = fallbackPath ?? getHomeRouteForRole(userRole)
      console.log('[RoleGuard] Redirecting to:', redirectTo)
      router.push(redirectTo)
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
