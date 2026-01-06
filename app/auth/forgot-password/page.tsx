'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const emailId = useId()
  const errorId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      if (!response.ok) {
        throw new Error('Erro ao processar solicitação')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950'>
      {/* Subtle gradient orbs */}
      <div className='pointer-events-none absolute inset-0'>
        <motion.div
          animate={{
            x: [0, 80, 0, -60, 0],
            y: [0, -50, 40, 0, 0],
          }}
          className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl'
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{
            x: [0, -70, 40, 0],
            y: [0, 60, -40, 0],
          }}
          className='absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl'
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{
            x: [0, 60, -50, 0],
            y: [0, -70, 50, 0],
          }}
          className='absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl'
          transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md'>
          {/* Card */}
          <main className='rounded-3xl border border-slate-800/50 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm'>
            {/* Back Link */}
            <Link
              className='mb-6 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-sky-400'
              href='/auth/signin'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='text-sm'>Voltar ao login</span>
            </Link>

            {/* Title */}
            <div className='mb-8 text-center'>
              <h1 className='font-bold text-3xl text-white'>Nepsis</h1>
              <p className='mt-2 text-sky-400'>Recuperação de Senha</p>
            </div>

            {submitted ? (
              /* Success Message */
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className='text-center'
                initial={{ opacity: 0, y: 20 }}
              >
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20'>
                  <Mail className='h-8 w-8 text-green-400' />
                </div>
                <h2 className='mb-2 font-semibold text-lg text-white'>Verifique seu e-mail</h2>
                <p className='mb-6 text-slate-400 text-sm'>
                  Se o e-mail <strong className='text-white'>{email}</strong> estiver cadastrado,
                  você receberá instruções para redefinir sua senha.
                </p>
                <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400 text-sm'>
                  <p className='font-medium'>⚠️ Não recebeu o e-mail?</p>
                  <ul className='mt-2 text-left text-xs'>
                    <li>• Verifique sua caixa de spam</li>
                    <li>• Aguarde alguns minutos</li>
                    <li>• Confira se o e-mail está correto</li>
                  </ul>
                </div>
                <button
                  className='mt-6 text-sky-400 text-sm underline-offset-2 hover:text-sky-300 hover:underline'
                  onClick={() => {
                    setSubmitted(false)
                    setEmail('')
                  }}
                  type='button'
                >
                  Tentar outro e-mail
                </button>
              </motion.div>
            ) : (
              /* Form */
              <form
                aria-describedby={error ? errorId : undefined}
                className='space-y-5'
                onSubmit={handleSubmit}
              >
                <p className='text-slate-400 text-sm'>
                  Digite o e-mail associado à sua conta. Enviaremos um link para você criar uma nova
                  senha.
                </p>

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
                    htmlFor={emailId}
                  >
                    E-mail
                  </label>
                  <input
                    autoComplete='email'
                    className='w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'
                    id={emailId}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='seu@email.com'
                    required
                    type='email'
                    value={email}
                  />
                </div>

                <button
                  aria-busy={loading}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 font-semibold text-white transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                  disabled={loading}
                  type='submit'
                >
                  {loading ? (
                    <>
                      <span className='sr-only'>Enviando...</span>
                      <span aria-hidden='true'>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className='h-5 w-5' />
                      Enviar link de recuperação
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Privacy Notice (LGPD) */}
            <div className='mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4'>
              <p className='text-center text-slate-500 text-xs'>
                🔒 Seus dados são protegidos conforme a LGPD.{' '}
                <Link className='text-sky-400 hover:underline' href='/privacy'>
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
