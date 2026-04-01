'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Suspense } from 'react'

const HeroCanvas = dynamic(
  () => import('./HeroCanvas').then((mod) => ({ default: mod.HeroCanvas })),
  { ssr: false }
)

function CanvasFallback() {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#a1c797] border-t-transparent' />
    </div>
  )
}

function scrollToWhitelist() {
  document.getElementById('whitelist')?.scrollIntoView({ behavior: 'smooth' })
}

export function HeroSection() {
  return (
    <div className='relative h-screen bg-gradient-to-b from-[#f8faf7] to-white overflow-hidden flex flex-col'>
      {/* Header */}
      <header className='absolute top-0 z-30 w-full'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5'>
          <div className='flex items-center gap-2'>
            <div className='overflow-hidden rounded-lg bg-white p-0.5 shadow-sm'>
              <Image
                alt='Logo Nepsis'
                className='rounded-md'
                height={28}
                src='/logo.jpg'
                width={28}
              />
            </div>
            <span className='font-black text-lg tracking-tight text-slate-900 sm:text-xl'>
              Nepsis
            </span>
          </div>

          <button
            className='rounded-full bg-[#a1c797] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#a1c797]/20 transition-all hover:bg-[#8fb885] hover:shadow-[#a1c797]/30 active:scale-95 sm:px-6 sm:py-2.5'
            onClick={scrollToWhitelist}
            type='button'
          >
            Garantir vaga
          </button>
        </div>
      </header>

      {/* Badge de acesso limitado */}
      <div className='relative z-20 flex flex-col items-center px-4 pt-[72px] -mb-28 sm:-mb-20 md:pt-24 lg:pt-28'>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='text-center font-black text-[26px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[56px]'
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Seus pacientes merecem
          <br />
          100% da sua atenção.
          <br />
          <span className='text-[#a1c797]'>A burocracia, não.</span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='mt-3 max-w-[300px] text-center text-xs leading-relaxed text-slate-500 sm:mt-4 sm:max-w-md sm:text-sm md:max-w-xl md:text-base lg:text-lg'
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Agentes de IA que transcrevem sessões, geram relatórios clínicos, controlam seu financeiro
          e mantêm seus pacientes engajados entre as consultas — automaticamente.
        </motion.p>
      </div>

      {/* 3D Canvas */}
      <div className='relative z-10 flex-1'>
        <Suspense fallback={<CanvasFallback />}>
          <HeroCanvas />
        </Suspense>
      </div>

      {/* Bottom gradient */}
      <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-28 bg-gradient-to-t from-white to-transparent' />

      {/* CTA */}
      <div className='relative z-30 flex justify-center pb-6 pt-1 sm:pb-8 sm:pt-2'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button
            className='group inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 font-bold text-sm text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-base lg:px-8 lg:py-4 lg:text-lg'
            onClick={scrollToWhitelist}
            type='button'
          >
            Quero acesso antecipado
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
          </button>
        </motion.div>
      </div>
    </div>
  )
}
