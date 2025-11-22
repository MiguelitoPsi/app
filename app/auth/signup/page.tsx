'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      router.push('/home')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl'>
        <div className='mb-8 text-center'>
          <h1 className='font-bold text-3xl text-gray-900'>Criar Conta</h1>
          <p className='mt-2 text-gray-600'>Comece sua jornada de bem-estar</p>
        </div>

        <form className='space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
              {error}
            </div>
          )}

          <div>
            <label className='mb-2 block font-medium text-gray-700 text-sm' htmlFor='name'>
              Nome
            </label>
            <input
              className='w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500'
              id='name'
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='Seu nome'
              required
              type='text'
              value={formData.name}
            />
          </div>

          <div>
            <label className='mb-2 block font-medium text-gray-700 text-sm' htmlFor='email'>
              Email
            </label>
            <input
              className='w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500'
              id='email'
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='seu@email.com'
              required
              type='email'
              value={formData.email}
            />
          </div>

          <div>
            <label className='mb-2 block font-medium text-gray-700 text-sm' htmlFor='password'>
              Senha
            </label>
            <input
              className='w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500'
              id='password'
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder='••••••••'
              required
              type='password'
              value={formData.password}
            />
          </div>

          <div>
            <label
              className='mb-2 block font-medium text-gray-700 text-sm'
              htmlFor='confirmPassword'
            >
              Confirmar Senha
            </label>
            <input
              className='w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-indigo-500'
              id='confirmPassword'
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder='••••••••'
              required
              type='password'
              value={formData.confirmPassword}
            />
          </div>

          <button
            className='w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
            disabled={loading}
            type='submit'
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-gray-600 text-sm'>
            Já tem uma conta?{' '}
            <Link className='font-medium text-indigo-600 hover:text-indigo-700' href='/auth/signin'>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
