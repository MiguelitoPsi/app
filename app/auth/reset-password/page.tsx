'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useId, useState } from 'react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const passwordId = useId()
  const confirmPasswordId = useId()
  const errorId = useId()

  // Validar token ao carregar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false)
        setTokenValid(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()
        setTokenValid(data.valid)
      } catch {
        setTokenValid(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha')
      }

      setSuccess(true)

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  // Estado de carregamento
  if (validating) {
    return (
      <div className='relative flex min-h-screen flex-col items-center justify-center bg-slate-950'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500' />
        <p className='mt-4 text-slate-400'>Verificando link...</p>
      </div>
    )
  }

  // Token inválido ou ausente
  if (!tokenValid) {
    return (
      <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl' />
        </div>

        <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
          <div className='w-full max-w-md'>
            <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20'>
                <AlertCircle className='h-8 w-8 text-red-400' />
              </div>
              <h1 className='mb-2 font-bold text-xl text-white'>Link Inválido ou Expirado</h1>
              <p className='mb-6 text-slate-400'>
                Este link de recuperação de senha não é mais válido. Os links expiram após 1 hora
                por segurança.
              </p>
              <Link
                className='inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-500'
                href='/auth/forgot-password'
              >
                Solicitar novo link
              </Link>
              <div className='mt-4'>
                <Link className='text-slate-400 text-sm hover:text-violet-400' href='/auth/signin'>
                  Voltar ao login
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Sucesso
  if (success) {
    return (
      <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-600/20 blur-3xl' />
        </div>

        <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
          <div className='w-full max-w-md'>
            <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm text-center'>
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20'
                initial={{ scale: 0.5, opacity: 0 }}
              >
                <CheckCircle className='h-8 w-8 text-green-400' />
              </motion.div>
              <h1 className='mb-2 font-bold text-xl text-white'>Senha Redefinida!</h1>
              <p className='mb-6 text-slate-400'>
                Sua senha foi alterada com sucesso. Você será redirecionado para o login...
              </p>
              <div className='flex items-center justify-center gap-2'>
                <div className='h-2 w-2 animate-bounce rounded-full bg-violet-500' />
                <div
                  className='h-2 w-2 animate-bounce rounded-full bg-violet-500'
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className='h-2 w-2 animate-bounce rounded-full bg-violet-500'
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Formulário de redefinição
  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Subtle gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <motion.div
          animate={{
            x: [0, 80, 0, -60, 0],
            y: [0, -50, 40, 0, 0],
          }}
          className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl'
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{
            x: [0, -70, 40, 0],
            y: [0, 60, -40, 0],
          }}
          className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl'
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Back Link */}
            <Link
              className='mb-6 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-violet-400'
              href='/auth/signin'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='text-sm'>Voltar ao login</span>
            </Link>

            {/* Title */}
            <div className='mb-8 text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20'>
                <Lock className='h-7 w-7 text-violet-400' />
              </div>
              <h1 className='font-bold text-2xl text-white'>Nova Senha</h1>
              <p className='mt-2 text-slate-400 text-sm'>
                Crie uma nova senha segura para sua conta
              </p>
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
                <label
                  className='mb-2 block font-medium text-slate-300 text-sm'
                  htmlFor={passwordId}
                >
                  Nova Senha
                </label>
                <div className='relative'>
                  <input
                    autoComplete='new-password'
                    className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                    id={passwordId}
                    minLength={8}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Mínimo 8 caracteres'
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

              <div>
                <label
                  className='mb-2 block font-medium text-slate-300 text-sm'
                  htmlFor={confirmPasswordId}
                >
                  Confirmar Senha
                </label>
                <div className='relative'>
                  <input
                    autoComplete='new-password'
                    className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                    id={confirmPasswordId}
                    minLength={8}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Repita a senha'
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type='button'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className='rounded-xl border border-slate-700/50 bg-slate-800/30 p-4'>
                <p className='mb-2 font-medium text-slate-300 text-sm'>Requisitos da senha:</p>
                <ul className='space-y-1 text-xs'>
                  <li className={password.length >= 8 ? 'text-green-400' : 'text-slate-500'}>
                    {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                  </li>
                  <li
                    className={
                      password === confirmPassword && confirmPassword.length > 0
                        ? 'text-green-400'
                        : 'text-slate-500'
                    }
                  >
                    {password === confirmPassword && confirmPassword.length > 0 ? '✓' : '○'} Senhas
                    coincidem
                  </li>
                </ul>
              </div>

              <button
                aria-busy={loading}
                className='w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                disabled={loading || password.length < 8 || password !== confirmPassword}
                type='submit'
              >
                {loading ? (
                  <>
                    <span className='sr-only'>Salvando...</span>
                    <span aria-hidden='true'>Salvando...</span>
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </button>
            </form>

            {/* Privacy Notice (LGPD) */}
            <div className='mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4'>
              <p className='text-center text-slate-500 text-xs'>
                🔒 Por segurança, você será desconectado de todos os dispositivos após alterar sua
                senha.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500' />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
