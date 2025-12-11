'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type TermsStatus = 'accepted' | 'pending' | 'all'
type RoleFilter = 'all' | 'psychologist' | 'patient'

const roleLabels: Record<string, string> = {
  psychologist: 'Psicólogo',
  patient: 'Paciente',
}

const roleColors: Record<string, string> = {
  psychologist: 'bg-emerald-500/20 text-emerald-400',
  patient: 'bg-blue-500/20 text-blue-400',
}

function formatDate(date: Date | null) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TermsStatus>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const { data: users, isLoading } = trpc.admin.getTermsAcceptances.useQuery()
  const { data: stats } = trpc.admin.getTermsStats.useQuery()

  const filteredUsers = users?.filter((user) => {
    // Filtrar usuários deletados
    if (user.deletedAt) return false

    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'accepted' && user.termsAcceptedAt) ||
      (statusFilter === 'pending' && !user.termsAcceptedAt)

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-white'>Termos e Consentimentos</h1>
        <p className='mt-1 text-slate-400'>
          Visualize as assinaturas de termos de responsabilidade e consentimento
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatsCard
          color='emerald'
          icon='🧠'
          subtitle={`${stats?.psychologistsAccepted ?? 0} aceitos / ${stats?.psychologistsPending ?? 0} pendentes`}
          title='Psicólogos'
          value={stats?.totalPsychologists ?? 0}
        />
        <StatsCard
          color='blue'
          icon='💜'
          subtitle={`${stats?.patientsAccepted ?? 0} aceitos / ${stats?.patientsPending ?? 0} pendentes`}
          title='Pacientes'
          value={stats?.totalPatients ?? 0}
        />
        <StatsCard
          color='green'
          icon='✅'
          title='Total Aceitos'
          value={(stats?.psychologistsAccepted ?? 0) + (stats?.patientsAccepted ?? 0)}
        />
        <StatsCard
          color='amber'
          icon='⏳'
          title='Pendentes'
          value={(stats?.psychologistsPending ?? 0) + (stats?.patientsPending ?? 0)}
        />
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='relative flex-1'>
          <SearchIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
          <input
            className='w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar por nome ou email...'
            type='text'
            value={searchQuery}
          />
        </div>
        <select
          className='rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          value={roleFilter}
        >
          <option value='all'>Todos os Tipos</option>
          <option value='psychologist'>Psicólogos</option>
          <option value='patient'>Pacientes</option>
        </select>
        <select
          className='rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
          onChange={(e) => setStatusFilter(e.target.value as TermsStatus)}
          value={statusFilter}
        >
          <option value='all'>Todos os Status</option>
          <option value='accepted'>Termos Aceitos</option>
          <option value='pending'>Pendentes</option>
        </select>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-700 bg-slate-800'>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Usuário
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Tipo
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Status do Termo
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Data de Aceite
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Cadastro
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Status da Conta
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {isLoading ? (
                [...new Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className='px-6 py-4' colSpan={6}>
                      <div className='h-10 animate-pulse rounded bg-slate-700' />
                    </td>
                  </tr>
                ))
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td className='px-6 py-12 text-center text-slate-400' colSpan={6}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr className='transition-colors hover:bg-slate-800/50' key={user.id}>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-white'>{user.name}</p>
                        <p className='text-sm text-slate-400'>{user.email}</p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role] ?? 'bg-slate-500/20 text-slate-400'}`}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {user.termsAcceptedAt ? (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400'>
                          <CheckIcon className='h-3.5 w-3.5' />
                          Aceito
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400'>
                          <ClockIcon className='h-3.5 w-3.5' />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-slate-300'>
                      {formatDate(user.termsAcceptedAt)}
                    </td>
                    <td className='px-6 py-4 text-sm text-slate-300'>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className='px-6 py-4'>
                      {user.bannedAt ? (
                        <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                          Suspenso
                        </span>
                      ) : (
                        <span className='inline-flex rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400'>
                          Ativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className='text-sm text-slate-400'>
          Exibindo {filteredUsers.length} de {users?.filter((u) => !u.deletedAt).length ?? 0}{' '}
          usuários
        </div>
      )}
    </div>
  )
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Search</title>
      <path
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Check</title>
      <path d='M5 13l4 4L19 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Clock</title>
      <path
        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

// Stats Card Component
type StatsCardProps = {
  title: string
  value: number | string
  icon: string
  color: 'violet' | 'amber' | 'emerald' | 'blue' | 'green' | 'red'
  subtitle?: string
}

function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    violet: 'bg-violet-600/20 text-violet-400',
    amber: 'bg-amber-600/20 text-amber-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    blue: 'bg-blue-600/20 text-blue-400',
    green: 'bg-green-600/20 text-green-400',
    red: 'bg-red-600/20 text-red-400',
  }

  return (
    <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-6'>
      <div className='flex items-center gap-4'>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}
        >
          <span className='text-2xl'>{icon}</span>
        </div>
        <div>
          <p className='text-sm text-slate-400'>{title}</p>
          <p className='text-2xl font-bold text-white'>{value}</p>
          {subtitle && <p className='text-xs text-slate-500'>{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
