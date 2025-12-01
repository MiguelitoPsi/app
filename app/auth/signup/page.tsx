'use client'

import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useId, useState } from 'react'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const therapistId = searchParams.get('therapistId')
  const inviteToken = searchParams.get('invite')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const errorId = useId()

  // Require invitation link
  if (!(therapistId || inviteToken)) {
    return (
      <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
        {/* Subtle gradient orbs */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl' />
          <div className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl' />
          <div className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl' />
        </div>

        <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
          <div className='w-full max-w-md'>
            <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
              <div className='text-center'>
                <h1 className='font-bold text-3xl text-white'>Nepsis</h1>
                <p className='mt-2 text-red-400'>Cadastro requer um link de convite</p>
                <Link
                  className='mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 font-semibold text-sm text-white transition-all hover:bg-violet-500'
                  href='/'
                >
                  Voltar ao início
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Falha no cadastro'
        try {
          const data = JSON.parse(text)
          errorMessage = data.error?.message || data.message || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      // If therapistId is present, create the relationship directly
      if (therapistId) {
        try {
          await fetch('/api/link-therapist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ therapistId }),
          })
        } catch (linkError) {
          console.error('Failed to link therapist:', linkError)
          // Don't fail the signup if linking fails
        }
      }

      // If invite token is present, accept the invite
      if (inviteToken) {
        try {
          await fetch('/api/accept-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken }),
          })
        } catch (linkError) {
          console.error('Failed to accept invite:', linkError)
          // Don't fail the signup if accepting invite fails
        }
      }

      router.push('/home')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Subtle gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl' />
        <div className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl' />
        <div className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl' />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Sign Up Form Card */}
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Title */}
            <div className='mb-8 text-center'>
              <h1 className='font-bold text-3xl text-white'>Nepsis</h1>
              <p className='mt-2 text-violet-400'>
                {therapistId || inviteToken
                  ? 'Complete seu cadastro para vincular-se ao seu terapeuta'
                  : 'Comece sua jornada de bem-estar'}
              </p>
              {(therapistId || inviteToken) && (
                <div className='mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-violet-400 text-sm'>
                  ✓ Você será vinculado ao seu terapeuta após o cadastro
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
                <label className='mb-2 block font-medium text-slate-300 text-sm' htmlFor={nameId}>
                  Nome
                </label>
                <input
                  autoComplete='name'
                  className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                  id={nameId}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Seu nome'
                  required
                  type='text'
                  value={formData.name}
                />
              </div>

              <div>
                <label className='mb-2 block font-medium text-slate-300 text-sm' htmlFor={emailId}>
                  Email
                </label>
                <input
                  autoComplete='email'
                  className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                  id={emailId}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder='seu@email.com'
                  required
                  type='email'
                  value={formData.email}
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
                    autoComplete='new-password'
                    className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                    id={passwordId}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder='••••••••'
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
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
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder='••••••••'
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
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

              <button
                aria-busy={loading}
                className='w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                disabled={loading}
                type='submit'
              >
                {loading ? (
                  <>
                    <span className='sr-only'>Carregando...</span>
                    <span aria-hidden='true'>Criando conta...</span>
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className='mt-6 text-center'>
              <p className='text-slate-400 text-sm'>
                Já tem uma conta?{' '}
                <Link
                  className='rounded font-semibold text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                  href='/auth/signin'
                >
                  Entrar
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function SignUpLoading() {
  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Subtle gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl' />
        <div className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl' />
        <div className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl' />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          <div className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            <div className='animate-pulse'>
              <div className='mx-auto mb-4 h-8 w-40 rounded bg-slate-700' />
              <div className='mx-auto mb-8 h-4 w-60 rounded bg-slate-700' />
              <div className='space-y-5'>
                <div className='h-14 rounded-xl bg-slate-700' />
                <div className='h-14 rounded-xl bg-slate-700' />
                <div className='h-14 rounded-xl bg-slate-700' />
                <div className='h-14 rounded-xl bg-slate-700' />
                <div className='h-14 rounded-xl bg-slate-700' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpForm />
    </Suspense>
  )
}
