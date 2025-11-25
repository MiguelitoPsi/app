'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { getHomeRouteForRole, type UserRole } from '@/lib/auth/roles'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4'>
      <main className='w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl'>
        <div className='mb-8 text-center'>
          <h1 className='font-bold text-3xl text-gray-900'>App PSI</h1>
          <p className='mt-2 text-gray-600'>Entre para continuar sua jornada</p>
        </div>

        <form
          aria-describedby={error ? errorId : undefined}
          className='space-y-6'
          onSubmit={handleSubmit}
        >
          {/* Live region for error announcements */}
          <div aria-atomic='true' aria-live='assertive' className='sr-only'>
            {error && `Erro: ${error}`}
          </div>

          {error && (
            <div
              className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700'
              id={errorId}
              role='alert'
            >
              <span className='sr-only'>Erro: </span>
              {error}
            </div>
          )}

          <div>
            <label className='mb-2 block font-medium text-gray-700 text-sm' htmlFor={emailId}>
              Email
            </label>
            <input
              autoComplete='email'
              className='w-full rounded-lg border border-gray-300 px-4 py-3 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500'
              id={emailId}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='seu@email.com'
              required
              type='email'
              value={email}
            />
          </div>

          <div>
            <label className='mb-2 block font-medium text-gray-700 text-sm' htmlFor={passwordId}>
              Senha
            </label>
            <input
              autoComplete='current-password'
              className='w-full rounded-lg border border-gray-300 px-4 py-3 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500'
              id={passwordId}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              required
              type='password'
              value={password}
            />
          </div>

          <button
            aria-busy={loading}
            className='w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
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

        <div className='mt-6 text-center'>
          <p className='text-gray-600 text-sm'>
            Não tem uma conta?{' '}
            <Link
              className='font-medium text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded'
              href='/auth/signup'
            >
              Cadastre-se
            </Link>
          </p>
        </div>

        <div className='mt-8 border-gray-200 border-t pt-6'>
          <p className='text-center text-gray-500 text-xs'>
            <strong>Credenciais de teste:</strong>
            <br />
            Admin: admin@app-psi.com / admin123
            <br />
            Paciente: miguel@app-psi.com / miguel123
          </p>
        </div>
      </main>
    </div>
  )
}
