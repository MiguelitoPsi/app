'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { broadcastSuspension } from '@/lib/utils/suspension-broadcast'

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
  const [selectedPsychologist, setSelectedPsychologist] = useState<{
    id: string
    name: string
    action: 'suspend' | 'delete' | 'reactivate'
  } | null>(null)

  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery()

  const suspendPsychologist = trpc.admin.suspendPsychologist.useMutation({
    onSuccess: (data) => {
      // Notificar todas as abas/janelas sobre a suspensão para mostrar o modal imediatamente
      broadcastSuspension()
      alert(`Psicólogo suspenso com sucesso. ${data.affectedPatients} pacientes foram suspensos.`)
      setSelectedPsychologist(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao suspender: ${err.message}`)
    },
  })

  const reactivatePsychologist = trpc.admin.reactivatePsychologist.useMutation({
    onSuccess: (data) => {
      alert(`Psicólogo reativado com sucesso. ${data.affectedPatients} pacientes foram reativados.`)
      setSelectedPsychologist(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao reativar: ${err.message}`)
    },
  })

  const deletePsychologist = trpc.admin.deletePsychologistWithPatients.useMutation({
    onSuccess: (data) => {
      alert(`Psicólogo excluído com sucesso. ${data.deletedPatients} pacientes foram excluídos.`)
      setSelectedPsychologist(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao excluir: ${err.message}`)
    },
  })

  const handleConfirmAction = (reason?: string) => {
    if (!selectedPsychologist) return

    if (selectedPsychologist.action === 'suspend') {
      if (!reason) {
        alert('Motivo da suspensão é obrigatório')
        return
      }
      suspendPsychologist.mutate({ psychologistId: selectedPsychologist.id, reason })
    } else if (selectedPsychologist.action === 'reactivate') {
      reactivatePsychologist.mutate({ psychologistId: selectedPsychologist.id })
    } else if (selectedPsychologist.action === 'delete') {
      deletePsychologist.mutate({ psychologistId: selectedPsychologist.id })
    }
  }

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
                  Status
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Nível
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Criado em
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Ações
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
                  <tr
                    className={`transition-colors hover:bg-slate-800/50 ${user.bannedAt ? 'opacity-60' : ''}`}
                    key={user.id}
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${user.bannedAt ? 'bg-red-600/20 text-red-400' : 'bg-violet-600/20 text-violet-400'}`}
                        >
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
                    <td className='px-6 py-4'>
                      {user.bannedAt ? (
                        <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                          Suspenso
                        </span>
                      ) : (
                        <span className='inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400'>
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-slate-300'>{user.level}</td>
                    <td className='px-6 py-4 text-slate-300'>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className='px-6 py-4'>
                      {user.role === 'psychologist' && (
                        <div className='flex items-center gap-2'>
                          {user.bannedAt ? (
                            <button
                              className='rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-600/30'
                              onClick={() =>
                                setSelectedPsychologist({
                                  id: user.id,
                                  name: user.name,
                                  action: 'reactivate',
                                })
                              }
                              title='Reativar psicólogo e pacientes'
                              type='button'
                            >
                              <ReactivateIcon />
                            </button>
                          ) : (
                            <button
                              className='rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-600/30'
                              onClick={() =>
                                setSelectedPsychologist({
                                  id: user.id,
                                  name: user.name,
                                  action: 'suspend',
                                })
                              }
                              title='Suspender psicólogo e pacientes'
                              type='button'
                            >
                              <SuspendIcon />
                            </button>
                          )}
                          <button
                            className='rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30'
                            onClick={() =>
                              setSelectedPsychologist({
                                id: user.id,
                                name: user.name,
                                action: 'delete',
                              })
                            }
                            title='Excluir psicólogo e pacientes'
                            type='button'
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
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

      {/* Confirmation Modal */}
      {selectedPsychologist && (
        <ConfirmationModal
          action={selectedPsychologist.action}
          isLoading={
            suspendPsychologist.isPending ||
            reactivatePsychologist.isPending ||
            deletePsychologist.isPending
          }
          onClose={() => setSelectedPsychologist(null)}
          onConfirm={handleConfirmAction}
          psychologistId={selectedPsychologist.id}
          psychologistName={selectedPsychologist.name}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    if (email === '' || password === '') {
      setError('Preencha todos os campos')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    createUser.mutate({ email, password, role })
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-white'>Criar Novo Usuário</h2>
          <button
            aria-label='Fechar modal'
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:scale-110 active:scale-95'
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
            <div className='relative'>
              <input
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 pr-12 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                id='password'
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Mínimo 8 caracteres'
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors'
                onClick={() => setShowPassword(!showPassword)}
                type='button'
              >
                {showPassword ? (
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                  </svg>
                ) : (
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                    <path
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                  </svg>
                )}
              </button>
            </div>
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
    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Fechar</title>
      <path d='M6 18L18 6M6 6l12 12' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}

function SuspendIcon() {
  return (
    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Suspender</title>
      <path
        d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function ReactivateIcon() {
  return (
    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Reativar</title>
      <path
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <title>Excluir</title>
      <path
        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
      />
    </svg>
  )
}

function ConfirmationModal({
  psychologistId,
  psychologistName,
  action,
  onClose,
  onConfirm,
  isLoading,
}: {
  psychologistId: string
  psychologistName: string
  action: 'suspend' | 'delete' | 'reactivate'
  onClose: () => void
  onConfirm: (reason?: string) => void
  isLoading: boolean
}) {
  const [suspendReason, setSuspendReason] = useState('')
  const { data: patients, isLoading: isLoadingPatients } =
    trpc.admin.getPsychologistPatients.useQuery({ psychologistId })

  const actionLabels = {
    suspend: {
      title: 'Suspender Psicólogo',
      description: 'suspender',
      warning:
        'Ao suspender este psicólogo, todos os pacientes vinculados a ele também serão suspensos e não poderão acessar o sistema.',
      buttonText: 'Suspender',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    reactivate: {
      title: 'Reativar Psicólogo',
      description: 'reativar',
      warning:
        'Ao reativar este psicólogo, todos os pacientes vinculados a ele também serão reativados e poderão acessar o sistema novamente.',
      buttonText: 'Reativar',
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    delete: {
      title: 'Excluir Psicólogo',
      description: 'excluir permanentemente',
      warning:
        'ATENÇÃO: Esta ação é irreversível! Ao excluir este psicólogo, TODOS os pacientes vinculados a ele também serão EXCLUÍDOS PERMANENTEMENTE, junto com todos os seus dados.',
      buttonText: 'Excluir Permanentemente',
      buttonClass: 'bg-red-600 hover:bg-red-700',
    },
  }

  const labels = actionLabels[action]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-white'>{labels.title}</h2>
          <button
            aria-label='Fechar modal'
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:scale-110 active:scale-95'
            onClick={onClose}
            type='button'
          >
            <CloseIcon />
          </button>
        </div>

        <div className='space-y-4'>
          <p className='text-slate-300'>
            Você está prestes a {labels.description} o psicólogo{' '}
            <strong className='text-white'>{psychologistName}</strong>.
          </p>

          <div
            className={`rounded-lg p-4 ${action === 'delete' ? 'bg-red-500/20 text-red-300' : action === 'reactivate' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}
          >
            <p className='text-sm'>{labels.warning}</p>
          </div>

          <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
            <h3 className='mb-3 font-medium text-white'>
              Pacientes vinculados ({patients?.length ?? 0}):
            </h3>
            {isLoadingPatients ? (
              <div className='animate-pulse'>
                <div className='h-4 w-48 rounded bg-slate-700' />
              </div>
            ) : patients?.length === 0 ? (
              <p className='text-sm text-slate-400'>Nenhum paciente vinculado</p>
            ) : (
              <ul className='max-h-32 space-y-1 overflow-y-auto'>
                {patients?.map((patient) => (
                  <li className='flex items-center gap-2 text-sm text-slate-300' key={patient.id}>
                    <span className='h-1.5 w-1.5 rounded-full bg-slate-500' />
                    {patient.name} ({patient.email})
                    {patient.bannedAt && <span className='text-xs text-red-400'>(suspenso)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {action === 'suspend' && (
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-slate-300' htmlFor='suspend-reason'>
                Motivo da suspensão <span className='text-red-400'>*</span>
              </label>
              <textarea
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500'
                id='suspend-reason'
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder='Descreva o motivo da suspensão...'
                rows={3}
                value={suspendReason}
              />
            </div>
          )}

          <div className='flex gap-3 pt-4'>
            <button
              className='flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800'
              onClick={onClose}
              type='button'
            >
              Cancelar
            </button>
            <button
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${labels.buttonClass}`}
              disabled={isLoading || (action === 'suspend' && !suspendReason.trim())}
              onClick={() => onConfirm(action === 'suspend' ? suspendReason : undefined)}
              type='button'
            >
              {isLoading ? 'Processando...' : labels.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
