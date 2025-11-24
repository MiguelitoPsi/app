import { ArrowRight, Brain, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4'>
      <div className='w-full max-w-2xl space-y-8 text-center text-white'>
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <div className='rounded-3xl bg-white/10 p-6 backdrop-blur-sm'>
              <Brain className='h-20 w-20' />
            </div>
          </div>
          <h1 className='font-bold text-5xl md:text-6xl'>Guerreiro da Mente</h1>
          <p className='text-white/90 text-xl md:text-2xl'>
            Sua jornada gamificada de bem-estar psicológico
          </p>
        </div>

        <div className='grid gap-6 py-8 md:grid-cols-3'>
          <div className='space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm'>
            <div className='flex justify-center'>
              <div className='rounded-2xl bg-white/20 p-4'>
                <Heart className='h-8 w-8' />
              </div>
            </div>
            <h3 className='font-semibold text-lg'>Diário Emocional</h3>
            <p className='text-sm text-white/80'>
              Registre seus pensamentos e receba análises com IA
            </p>
          </div>

          <div className='space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm'>
            <div className='flex justify-center'>
              <div className='rounded-2xl bg-white/20 p-4'>
                <Sparkles className='h-8 w-8' />
              </div>
            </div>
            <h3 className='font-semibold text-lg'>Gamificação</h3>
            <p className='text-sm text-white/80'>
              Evolua, ganhe recompensas e desbloqueie conquistas
            </p>
          </div>

          <div className='space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm'>
            <div className='flex justify-center'>
              <div className='rounded-2xl bg-white/20 p-4'>
                <Brain className='h-8 w-8' />
              </div>
            </div>
            <h3 className='font-semibold text-lg'>Assistente de Reflexão</h3>
            <p className='text-sm text-white/80'>
              Organize seus pensamentos com apoio de IA, sem substituir profissionais
            </p>
          </div>
        </div>

        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
          <Link
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-lg text-purple-600 shadow-xl transition-all hover:scale-105 hover:bg-white/90 hover:shadow-2xl'
            href='/auth/signup'
          >
            Começar Agora <ArrowRight className='h-5 w-5' />
          </Link>
          <Link
            className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-8 py-4 font-semibold text-lg text-white backdrop-blur-sm transition-all hover:bg-white/20'
            href='/auth/signin'
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}
