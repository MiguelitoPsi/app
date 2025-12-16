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

  const {
    data: profile,
    isLoading,
    error,
  } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes - role doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: false, // Não retry em caso de erro de autenticação
  })

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (isLoading) return

    // Se há erro (incluindo UNAUTHORIZED), redirecionar para login
    if (error) {
      console.log('[RoleGuard] Error:', error.message)
      router.push('/auth/signin')
      return
    }

    // Se não há profile, redirecionar para login
    if (!profile) {
      router.push('/auth/signin')
      return
    }

    // Normaliza a role para lowercase para comparação case-insensitive
    const userRole = (profile.role?.toLowerCase() || 'patient') as UserRole

    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      // Usa o fallbackPath fornecido ou redireciona para a home correta da role
      const redirectTo = fallbackPath ?? getHomeRouteForRole(userRole)
      router.push(redirectTo)
    }
  }, [profile, isLoading, error, allowedRoles, fallbackPath, router])

  // Se há erro, mostrar na tela para debug
  if (error) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 p-4 dark:bg-slate-950 text-slate-900 dark:text-slate-100'>
        <div className='text-red-500 font-bold text-xl'>Erro de Autenticação</div>
        <div className='text-sm font-mono bg-slate-200 dark:bg-slate-900 p-4 rounded'>
          {error.message}
        </div>
        <p className='text-sm text-slate-500'>Tente fazer login novamente.</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className='rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700'
        >
          Voltar para Login
        </button>
      </div>
    )
  }

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
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 p-4 dark:bg-slate-950 text-slate-900 dark:text-slate-100'>
        <div className='text-amber-500 font-bold text-xl'>Acesso Não Autorizado</div>
        <div className='flex flex-col gap-2 text-center'>
          <p className='text-sm text-slate-500'>Você não tem permissão para acessar esta página.</p>
          <div className='rounded bg-slate-200 p-2 font-mono text-xs dark:bg-slate-900'>
            Role atual: <span className='font-bold'>{profile?.role || 'Indefinido'}</span>
            <br />
            Rota esperada: {profile?.role ? getHomeRouteForRole(profile.role as UserRole) : 'N/A'}
          </div>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className='rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700'
          >
            Ir para Login
          </button>
           <button
            onClick={() => {
               // Tentar limpar dados se for logout
               localStorage.clear();
               window.location.href = '/auth/signin';
            }}
            className='rounded-lg bg-red-100 px-4 py-2 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
          >
            Sair e Limpar Cache
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
