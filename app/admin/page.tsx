'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

export default function AdminPage() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery(undefined, {
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
    staleTime: 5 * 1000,
  })

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-white'>Dashboard Admin</h1>
        <p className='mt-1 text-slate-400'>Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {[...new Array(4)].map((_, i) => (
            <div className='h-32 animate-pulse rounded-xl bg-slate-800' key={i} />
          ))}
        </div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          <StatsCard
            color='violet'
            icon='👥'
            title='Total de Usuários'
            value={stats?.totalUsers ?? 0}
          />
          <StatsCard
            color='amber'
            icon='🛡️'
            title='Administradores'
            value={stats?.adminCount ?? 0}
          />
          <StatsCard
            color='emerald'
            icon='🧠'
            title='Psicólogos'
            value={stats?.psychologistCount ?? 0}
          />
          <StatsCard color='blue' icon='💜' title='Pacientes' value={stats?.patientCount ?? 0} />
        </div>
      )}

      {/* Quick Actions */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>Ações Rápidas</h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <Link
            className='flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-colors hover:border-violet-500 hover:bg-slate-800'
            href='/admin/users'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/20'>
              <span className='text-2xl'>👥</span>
            </div>
            <div>
              <h3 className='font-semibold text-white'>Gerenciar Usuários</h3>
              <p className='text-sm text-slate-400'>Ver, criar e editar usuários</p>
            </div>
          </Link>
          <Link
            className='flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-colors hover:border-emerald-500 hover:bg-slate-800'
            href='/admin/subscriptions'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600/20'>
              <span className='text-2xl'>💳</span>
            </div>
            <div>
              <h3 className='font-semibold text-white'>Assinaturas</h3>
              <p className='text-sm text-slate-400'>Gerenciar assinaturas dos psicólogos</p>
            </div>
          </Link>
          <Link
            className='flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-colors hover:border-amber-500 hover:bg-slate-800'
            href='/admin/terms'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-amber-600/20'>
              <span className='text-2xl'>📄</span>
            </div>
            <div>
              <h3 className='font-semibold text-white'>Termos e Consentimentos</h3>
              <p className='text-sm text-slate-400'>Verificar assinaturas de termos</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

type StatsCardProps = {
  title: string
  value: number
  icon: string
  color: 'violet' | 'amber' | 'emerald' | 'blue'
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    violet: 'bg-violet-600/20 text-violet-400',
    amber: 'bg-amber-600/20 text-amber-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    blue: 'bg-blue-600/20 text-blue-400',
  }

  return (
    <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm text-slate-400'>{title}</p>
          <p className='mt-2 text-3xl font-bold text-white'>{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}
        >
          <span className='text-2xl'>{icon}</span>
        </div>
      </div>
    </div>
  )
}
