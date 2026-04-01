'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getHomeRouteForRole, type UserRole } from '@/lib/auth/roles'
import { authClient } from '@/lib/auth-client'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

type AuthState = 'loading' | 'authorized' | 'unauthorized' | 'redirecting'

/**
 * Normaliza o role do usuário para um dos valores válidos.
 * Usa a sessão como fonte primária, fallback para patient.
 */
const normalizeUserRole = (roleValue?: string | null): UserRole => {
  if (!roleValue) return 'patient'

  const normalized = roleValue.toLowerCase()

  if (normalized === 'psychologist' || normalized === 'admin' || normalized === 'patient') {
    return normalized
  }

  return 'patient'
}

/**
 * RoleGuard - Componente de proteção de rotas por role.
 *
 * Usa a sessão do better-auth como fonte única de verdade para o role do usuário.
 * Evita problemas de cache e inconsistência ao não depender de cookies client-side.
 */
export function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const hasRedirected = useRef(false)

  // Extrai o role diretamente da sessão (fonte de verdade)
  const userRole = useMemo(() => {
    if (!session?.user) return null
    // O role está no user da sessão (additionalFields do better-auth)
    const sessionRole = (session.user as { role?: string }).role
    return normalizeUserRole(sessionRole)
  }, [session?.user])

  // Verifica autorização de forma estável
  const isRoleAllowed = useMemo(() => {
    if (!userRole) return false
    return allowedRoles.includes(userRole)
  }, [allowedRoles, userRole])

  useEffect(() => {
    // Ainda carregando a sessão
    if (isPending) {
      setAuthState('loading')
      return
    }

    // Sem sessão = não autenticado
    if (!session?.user) {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        setAuthState('redirecting')
        router.replace('/auth/signin')
      }
      return
    }

    // Usuário autenticado - verificar role
    if (isRoleAllowed) {
      setAuthState('authorized')
      hasRedirected.current = false
      return
    }

    // Role não permitida - redirecionar
    if (!hasRedirected.current && userRole) {
      hasRedirected.current = true
      setAuthState('redirecting')
      const redirectTo = fallbackPath ?? getHomeRouteForRole(userRole)
      router.replace(redirectTo)
    } else {
      setAuthState('unauthorized')
    }
  }, [isPending, session?.user, isRoleAllowed, userRole, fallbackPath, router])

  // Não renderiza nada durante loading ou redirecionamento
  if (authState === 'loading' || authState === 'redirecting' || authState === 'unauthorized') {
    return null
  }

  return <>{children}</>
}
