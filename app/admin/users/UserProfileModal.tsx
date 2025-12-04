'use client'

import { trpc } from '@/lib/trpc/client'

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { data: user, isLoading } = trpc.admin.getUserDetails.useQuery(
    { userId },
    { enabled: isOpen && !!userId }
  )

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-6 py-4'>
          <h2 className='text-lg font-semibold text-white'>Perfil do Usuário</h2>
          <button
            className='rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white'
            onClick={onClose}
            type='button'
          >
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                d='M6 18L18 6M6 6l12 12'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent' />
            </div>
          ) : user ? (
            <div className='space-y-6'>
              {/* Header Info */}
              <div className='flex items-start gap-4'>
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                    user.bannedAt
                      ? 'bg-red-600/20 text-red-400'
                      : user.role === 'psychologist'
                        ? 'bg-violet-600/20 text-violet-400'
                        : 'bg-blue-600/20 text-blue-400'
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className='flex-1'>
                  <h3 className='text-xl font-bold text-white'>{user.name}</h3>
                  <p className='text-slate-400'>{user.email}</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : user.role === 'psychologist'
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {user.role === 'admin'
                        ? 'Administrador'
                        : user.role === 'psychologist'
                          ? 'Psicólogo'
                          : 'Paciente'}
                    </span>
                    {user.bannedAt ? (
                      <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                        Suspenso
                      </span>
                    ) : (
                      <span className='inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400'>
                        Ativo
                      </span>
                    )}
                    <span className='inline-flex rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300'>
                      Nível {user.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div className='rounded-xl bg-slate-800/50 p-4'>
                  <p className='text-xs text-slate-400'>Moedas</p>
                  <p className='text-lg font-bold text-amber-400'>{user.coins}</p>
                </div>
                <div className='rounded-xl bg-slate-800/50 p-4'>
                  <p className='text-xs text-slate-400'>XP</p>
                  <p className='text-lg font-bold text-blue-400'>{user.experience}</p>
                </div>
                <div className='rounded-xl bg-slate-800/50 p-4'>
                  <p className='text-xs text-slate-400'>Ofensiva</p>
                  <p className='text-lg font-bold text-orange-400'>{user.streak} dias</p>
                </div>
                <div className='rounded-xl bg-slate-800/50 p-4'>
                  <p className='text-xs text-slate-400'>Criado em</p>
                  <p className='text-lg font-bold text-white'>
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Psychologist Specific Info */}
              {user.role === 'psychologist' && (
                <div className='space-y-4 rounded-xl border border-slate-700 bg-slate-800/30 p-4'>
                  <h4 className='font-medium text-white'>Informações do Psicólogo</h4>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <p className='text-sm text-slate-400'>Pacientes Vinculados</p>
                      <p className='text-lg font-semibold text-white'>{user.patientCount}</p>
                    </div>
                    <div>
                      <p className='text-sm text-slate-400'>Assinatura</p>
                      {user.subscription ? (
                        <div>
                          <p className='font-medium text-white capitalize'>
                            {user.subscription.plan} ({user.subscription.status})
                          </p>
                          <p className='text-xs text-slate-500'>
                            Expira em:{' '}
                            {new Date(user.subscription.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ) : (
                        <p className='text-slate-500'>Nenhuma assinatura ativa</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Specific Info */}
              {user.role === 'patient' && (
                <div className='space-y-4 rounded-xl border border-slate-700 bg-slate-800/30 p-4'>
                  <h4 className='font-medium text-white'>Informações do Paciente</h4>
                  <div>
                    <p className='text-sm text-slate-400'>Psicólogo Vinculado</p>
                    {user.linkedPsychologist ? (
                      <div className='mt-2 flex items-center gap-3 rounded-lg bg-slate-800 p-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/20 text-violet-400'>
                          {user.linkedPsychologist.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='font-medium text-white'>{user.linkedPsychologist.name}</p>
                          <p className='text-xs text-slate-400'>{user.linkedPsychologist.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className='mt-1 text-slate-500'>Nenhum psicólogo vinculado</p>
                    )}
                  </div>
                </div>
              )}

              {/* Ban Info */}
              {user.bannedAt && (
                <div className='rounded-xl border border-red-900/50 bg-red-900/20 p-4'>
                  <h4 className='font-medium text-red-400'>Conta Suspensa</h4>
                  <p className='mt-1 text-sm text-red-300'>
                    Suspensa em: {new Date(user.bannedAt).toLocaleDateString('pt-BR')}
                  </p>
                  {user.banReason && (
                    <p className='mt-1 text-sm text-red-300'>Motivo: {user.banReason}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className='text-center text-slate-400'>Usuário não encontrado</div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-slate-700 bg-slate-800/50 p-4'>
          <div className='flex justify-end'>
            <button
              className='rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600'
              onClick={onClose}
              type='button'
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
