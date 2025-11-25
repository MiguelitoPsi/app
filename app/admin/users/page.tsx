'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type UserRole = 'admin' | 'psychologist' | 'patient'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  psychologist: 'Psicólogo',
  patient: 'Paciente',
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-amber-500/20 text-amber-400',
  psychologist: 'bg-emerald-500/20 text-emerald-400',
  patient: 'bg-blue-500/20 text-blue-400',
}

export default function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery()

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Usuários</h1>
          <p className='mt-1 text-slate-400'>Gerencie todos os usuários do sistema</p>
        </div>
        <button
          className='flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700'
          onClick={() => setIsCreateModalOpen(true)}
          type='button'
        >
          <PlusIcon />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className='relative'>
        <SearchIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
        <input
          className='w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Buscar por nome ou email...'
          type='text'
          value={searchQuery}
        />
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
                  Email
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Role
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Nível
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  XP
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Moedas
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Criado em
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {isLoading ? (
                [...new Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className='px-6 py-4' colSpan={7}>
                      <div className='h-10 animate-pulse rounded bg-slate-700' />
                    </td>
                  </tr>
                ))
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td className='px-6 py-12 text-center text-slate-400' colSpan={7}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr className='transition-colors hover:bg-slate-800/50' key={user.id}>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 text-violet-400'>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className='font-medium text-white'>{user.name}</span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-slate-300'>{user.email}</td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          roleColors[user.role as UserRole]
                        }`}
                      >
                        {roleLabels[user.role as UserRole]}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-slate-300'>{user.level}</td>
                    <td className='px-6 py-4 text-slate-300'>{user.experience}</td>
                    <td className='px-6 py-4 text-slate-300'>{user.coins}</td>
                    <td className='px-6 py-4 text-slate-300'>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [error, setError] = useState('')

  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name === '' || email === '' || password === '') {
      setError('Preencha todos os campos')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    createUser.mutate({ name, email, password, role })
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-white'>Criar Novo Usuário</h2>
          <button
            className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white'
            onClick={onClose}
            type='button'
          >
            <CloseIcon />
          </button>
        </div>

        <form className='space-y-4' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400'>{error}</div>
          )}

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='name'>
              Nome
            </label>
            <input
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='name'
              onChange={(e) => setName(e.target.value)}
              placeholder='Nome do usuário'
              type='text'
              value={name}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='email'>
              Email
            </label>
            <input
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='email'
              onChange={(e) => setEmail(e.target.value)}
              placeholder='email@exemplo.com'
              type='email'
              value={email}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='password'>
              Senha
            </label>
            <input
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='password'
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Mínimo 8 caracteres'
              type='password'
              value={password}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300' htmlFor='role'>
              Tipo de Usuário
            </label>
            <select
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
              id='role'
              onChange={(e) => setRole(e.target.value as UserRole)}
              value={role}
            >
              <option value='patient'>Paciente</option>
              <option value='psychologist'>Psicólogo</option>
              <option value='admin'>Administrador</option>
            </select>
          </div>

          <div className='flex gap-3 pt-4'>
            <button
              className='flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800'
              onClick={onClose}
              type='button'
            >
              Cancelar
            </button>
            <button
              className='flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={createUser.isPending}
              type='submit'
            >
              {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Adicionar</title>
      <path d='M12 4v16m8-8H4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Buscar</title>
      <path
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Fechar</title>
      <path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}
