import { ArrowRight, Brain, Heart, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className='flex min-h-screen flex-col bg-slate-950'>
      {/* Hero Section */}
      <div className='flex flex-1 flex-col items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md space-y-8'>
          {/* Logo & Title */}
          <div className='space-y-6 text-center'>
            <div className='flex justify-center'>
              <div className='rounded-2xl border border-slate-800 bg-slate-900/50 p-5'>
                <Brain className='h-14 w-14 text-violet-400' />
              </div>
            </div>
            <div className='space-y-2'>
              <h1 className='font-bold text-3xl text-white tracking-tight'>Nepsis</h1>
              <p className='text-slate-400 text-base'>
                Sua jornada gamificada de bem-estar psicológico
              </p>
            </div>
          </div>

          {/* Features */}
          <div className='space-y-3 pt-4'>
            <FeatureCard
              description='Registre seus pensamentos e receba análises com IA'
              icon={<Heart className='h-5 w-5 text-rose-400' />}
              title='Diário Emocional'
            />
            <FeatureCard
              description='Evolua, ganhe recompensas e desbloqueie conquistas'
              icon={<Sparkles className='h-5 w-5 text-amber-400' />}
              title='Gamificação'
            />
            <FeatureCard
              description='Organize seus pensamentos com apoio de IA'
              icon={<Shield className='h-5 w-5 text-emerald-400' />}
              title='Assistente de Reflexão'
            />
          </div>

          {/* CTA Buttons */}
          <div className='space-y-3 pt-6'>
            <Link
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]'
              href='/auth/signup'
            >
              Começar Agora
              <ArrowRight className='h-5 w-5' />
            </Link>
            <Link
              className='flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-4 font-medium text-slate-300 transition-all hover:bg-slate-800 active:scale-[0.98]'
              href='/auth/signin'
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='border-slate-800 border-t px-6 py-4'>
        <p className='text-center text-slate-500 text-xs'>
          Feito com 💜 para o seu bem-estar mental
        </p>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className='flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:bg-slate-900/50'>
      <div className='rounded-lg bg-slate-800/50 p-2.5'>{icon}</div>
      <div className='flex-1'>
        <h3 className='font-medium text-sm text-white'>{title}</h3>
        <p className='mt-0.5 text-slate-400 text-sm'>{description}</p>
      </div>
    </div>
  )
}
