'use client'

import { motion, useInView } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'

type FormState = 'idle' | 'loading' | 'success' | 'error'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function WhitelistSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setState('loading')
      setErrorMsg('')

      const form = e.currentTarget
      const formData = new FormData(form)
      const name = (formData.get('name') as string).trim()
      const email = (formData.get('email') as string).trim()
      const phoneRaw = phone.replace(/\D/g, '')

      if (!(name && email && phoneRaw)) {
        setState('error')
        setErrorMsg('Preencha todos os campos.')
        return
      }

      try {
        const res = await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: phoneRaw }),
        })

        if (res.ok) {
          setState('success')
        } else {
          const data = await res.json()
          setState('error')
          setErrorMsg(data.error || 'Algo deu errado. Tente novamente.')
        }
      } catch {
        setState('error')
        setErrorMsg('Erro de conexão. Tente novamente.')
      }
    },
    [phone]
  )

  return (
    <section
      className='relative overflow-hidden bg-[#f8faf7] py-24 sm:py-32 lg:py-40'
      id='whitelist'
      ref={ref}
    >
      {/* Decorative */}
      <div className='pointer-events-none absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a1c797]/8 blur-[100px]' />

      <div className='relative mx-auto max-w-xl px-6 sm:px-8'>
        <motion.h2
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className='text-center font-black text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Garanta seu acesso
          <br />
          <span className='text-[#a1c797]'>antes de todo mundo</span>
        </motion.h2>

        <motion.p
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className='mx-auto mt-5 max-w-md text-center text-sm text-slate-500 sm:text-base'
          initial={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Psicólogos selecionados terão acesso a conteúdo exclusivo + preço promocional. Sem cartão.
          Sem compromisso.
        </motion.p>

        {state === 'success' ? (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className='mt-10 rounded-2xl border border-[#a1c797]/30 bg-white p-8 text-center shadow-lg sm:mt-12 sm:p-10'
            initial={{ opacity: 0, scale: 0.95 }}
          >
            <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#a1c797]/10'>
              <svg
                className='h-7 w-7 text-[#a1c797]'
                fill='none'
                stroke='currentColor'
                strokeWidth={2.5}
                viewBox='0 0 24 24'
              >
                <path d='M5 13l4 4L19 7' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </div>
            <h3 className='font-bold text-xl text-slate-900'>Você está na lista!</h3>
            <p className='mt-2 text-sm text-slate-500'>
              Em breve você receberá um email com as instruções de acesso antecipado. Fique de olho
              na caixa de entrada.
            </p>
          </motion.div>
        ) : (
          <motion.form
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className='mt-10 space-y-4 sm:mt-12'
            initial={{ opacity: 0, y: 20 }}
            onSubmit={handleSubmit}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div>
              <label className='sr-only' htmlFor='wl-name'>
                Nome completo
              </label>
              <input
                autoComplete='name'
                className='w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20 sm:py-4 sm:text-lg'
                id='wl-name'
                name='name'
                placeholder='Seu nome completo'
                required
                type='text'
              />
            </div>

            <div>
              <label className='sr-only' htmlFor='wl-email'>
                Email profissional
              </label>
              <input
                autoComplete='email'
                className='w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20 sm:py-4 sm:text-lg'
                id='wl-email'
                name='email'
                placeholder='Seu email profissional'
                required
                type='email'
              />
            </div>

            <div>
              <label className='sr-only' htmlFor='wl-phone'>
                WhatsApp
              </label>
              <input
                autoComplete='tel'
                className='w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#a1c797] focus:outline-none focus:ring-2 focus:ring-[#a1c797]/20 sm:py-4 sm:text-lg'
                id='wl-phone'
                name='phone'
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder='Seu WhatsApp (DDD + número)'
                required
                type='tel'
                value={phone}
              />
            </div>

            {state === 'error' && errorMsg && (
              <p className='text-center text-sm font-medium text-red-500'>{errorMsg}</p>
            )}

            <button
              className='group w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed sm:py-4.5 sm:text-lg'
              disabled={state === 'loading'}
              type='submit'
            >
              {state === 'loading' ? (
                <span className='inline-flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  Garantindo sua vaga...
                </span>
              ) : (
                <span className='inline-flex items-center justify-center gap-2'>
                  Garantir meu acesso antecipado
                  <svg
                    className='h-4 w-4 text-[#a1c797] transition-transform group-hover:translate-x-0.5'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2.5}
                    viewBox='0 0 24 24'
                  >
                    <path
                      d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </span>
              )}
            </button>

            <p className='text-center text-xs text-slate-400'>
              Seus dados estão protegidos pela LGPD. Nenhum spam. Só acesso antecipado.
            </p>
          </motion.form>
        )}

        {/* Urgency elements */}
      </div>
    </section>
  )
}
