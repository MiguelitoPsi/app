'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { getHomeRouteForRole, type UserRole } from '@/lib/auth/roles'
import { trpc } from '@/lib/trpc/client'

export function useAuth() {
  const router = useRouter()
  const { data: profile, isLoading, error } = trpc.user.getProfile.useQuery()

  const role = (profile?.role as UserRole) || 'patient'
  const isAuthenticated = !!profile && !error

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' })
      await fetch('/api/auth/clear-role-cookie', { method: 'POST' })
      router.push('/auth/signin')
      router.refresh()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }, [router])

  const redirectToHome = useCallback(() => {
    const homeRoute = getHomeRouteForRole(role)
    router.push(homeRoute)
  }, [role, router])

  return {
    user: profile,
    role,
    isLoading,
    isAuthenticated,
    logout,
    redirectToHome,
    homeRoute: getHomeRouteForRole(role),
  }
}
