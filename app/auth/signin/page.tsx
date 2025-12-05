'use client'

import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useId, useState } from 'react'
import { getHomeRouteForRole, type UserRole } from '@/lib/auth/roles'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const therapistId = searchParams.get('therapistId')
  const inviteToken = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Fazer login
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Falha no login'
        try {
          const data = JSON.parse(text)
          errorMessage = data.error?.message || data.message || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Definir cookie de role e obter a role do usuário
      const roleResponse = await fetch('/api/auth/set-role-cookie', {
        method: 'POST',
      })

      let redirectPath = '/home'

      if (roleResponse.ok) {
        const roleData = await roleResponse.json()
        const role = roleData.role as UserRole
        redirectPath = getHomeRouteForRole(role)
      }

      // Se therapistId está presente, criar o vínculo
      if (therapistId) {
        try {
          await fetch('/api/link-therapist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ therapistId }),
          })
        } catch (linkError) {
          console.error('Failed to link therapist:', linkError)
          // Não falhar o login se o vínculo falhar
        }
      }

      // Se invite token está presente, aceitar o convite
      if (inviteToken) {
        try {
          await fetch('/api/accept-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken }),
          })
        } catch (linkError) {
          console.error('Failed to accept invite:', linkError)
          // Não falhar o login se aceitar o convite falhar
        }
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Subtle gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <motion.div 
          className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl'
          animate={{ 
            x: [0, 80, 0, -60, 0],
            y: [0, -50, 40, 0, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl'
          animate={{ 
            x: [0, -70, 40, 0],
            y: [0, 60, -40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl'
          animate={{ 
            x: [0, 60, -50, 0],
            y: [0, -70, 50, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Login Form Card */}
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Title */}
            <div className='mb-8 text-center'>
              <h1 className='font-bold text-3xl text-white'>Nepsis</h1>
              <p className='mt-2 text-violet-400'>
                {therapistId || inviteToken
                  ? 'Entre para vincular-se ao seu terapeuta'
                  : 'Entre para continuar sua jornada'}
              </p>
              {(therapistId || inviteToken) && (
                <div className='mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-violet-400 text-sm'>
                  ✓ Você será vinculado ao seu terapeuta após o login
                </div>
              )}
            </div>

            <form
              aria-describedby={error ? errorId : undefined}
              className='space-y-5'
              onSubmit={handleSubmit}
            >
              {/* Live region for error announcements */}
              <div aria-atomic='true' aria-live='assertive' className='sr-only'>
                {error && `Erro: ${error}`}
              </div>

              {error && (
                <div
                  className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400'
                  id={errorId}
                  role='alert'
                >
                  <span className='sr-only'>Erro: </span>
                  {error}
                </div>
              )}

              <div>
                <label className='mb-2 block font-medium text-slate-300 text-sm' htmlFor={emailId}>
                  Email
                </label>
                <input
                  autoComplete='email'
                  className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                  id={emailId}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='seu@email.com'
                  required
                  type='email'
                  value={email}
                />
              </div>

              <div>
                <label
                  className='mb-2 block font-medium text-slate-300 text-sm'
                  htmlFor={passwordId}
                >
                  Senha
                </label>
                <div className='relative'>
                  <input
                    autoComplete='current-password'
                    className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                    id={passwordId}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded'
                    onClick={() => setShowPassword(!showPassword)}
                    type='button'
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
              </div>

              <button
                aria-busy={loading}
                className='w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                disabled={loading}
                type='submit'
              >
                {loading ? (
                  <>
                    <span className='sr-only'>Carregando...</span>
                    <span aria-hidden='true'>Entrando...</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className='mt-6 text-center'>
              <p className='text-slate-400 text-sm'>
                Não tem uma conta?{' '}
                <Link
                  className='rounded font-semibold text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                  href='/'
                >
                  Voltar ao início
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500' />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
