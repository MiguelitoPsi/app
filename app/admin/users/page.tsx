'use client'

import { Check, Copy } from 'lucide-react'
import React, { useState } from 'react'
import { InviteTherapistModal } from '@/components/InviteTherapistModal'
import { trpc } from '@/lib/trpc/client'
import { broadcastDeletion, broadcastSuspension } from '@/lib/utils/suspension-broadcast'
import { UserProfileModal } from './UserProfileModal'

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
  const [forceInviteRole, setForceInviteRole] = useState<'psychologist' | 'admin' | null>(null)
  const [isInviteTherapistModalOpen, setIsInviteTherapistModalOpen] = useState(false)
  const [therapistInviteLink, setTherapistInviteLink] = useState('')
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPsychologistIds, setExpandedPsychologistIds] = useState<Set<string>>(new Set())
  const [selectedPsychologist, setSelectedPsychologist] = useState<{
    id: string
    name: string
    action: 'suspend' | 'delete' | 'reactivate'
  } | null>(null)
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string
    role: 'patient' | 'psychologist' | 'admin'
    action: 'suspend' | 'delete' | 'reactivate'
  } | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const {
    data: psychologists,
    isLoading,
    refetch,
  } = trpc.admin.getTherapistsWithPatients.useQuery(undefined, {
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
    staleTime: 5 * 1000,
  })

  const toggleExpand = (psychologistId: string) => {
    const newExpanded = new Set(expandedPsychologistIds)
    if (newExpanded.has(psychologistId)) {
      newExpanded.delete(psychologistId)
    } else {
      newExpanded.add(psychologistId)
    }
    setExpandedPsychologistIds(newExpanded)
  }

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
      broadcastDeletion()
      alert(`Psicólogo excluído com sucesso. ${data.deletedPatients} pacientes foram excluídos.`)
      setSelectedPsychologist(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao excluir: ${err.message}`)
    },
  })

  const suspendUser = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      broadcastSuspension()
      alert('Usuário suspenso com sucesso.')
      setSelectedUser(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao suspender: ${err.message}`)
    },
  })

  const reactivateUser = trpc.admin.reactivateUser.useMutation({
    onSuccess: () => {
      alert('Usuário reativado com sucesso.')
      setSelectedUser(null)
      refetch()
    },
    onError: (err) => {
      alert(`Erro ao reativar: ${err.message}`)
    },
  })

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      broadcastDeletion()
      alert('Usuário excluído com sucesso.')
      setSelectedUser(null)
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

  const handleUserAction = (reason?: string) => {
    if (!selectedUser) return

    if (selectedUser.action === 'suspend') {
      if (!reason) {
        alert('Motivo da suspensão é obrigatório')
        return
      }
      suspendUser.mutate({ userId: selectedUser.id, reason })
    } else if (selectedUser.action === 'reactivate') {
      reactivateUser.mutate({ userId: selectedUser.id })
    } else if (selectedUser.action === 'delete') {
      deleteUser.mutate({ userId: selectedUser.id })
    }
  }

  const handleOpenProfile = (userId: string) => {
    setSelectedUserId(userId)
    setIsProfileModalOpen(true)
  }

  const filteredPsychologists = psychologists?.filter(
    (psychologist) =>
      psychologist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      psychologist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      psychologist.patients.some(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Usuários</h1>
          <p className='mt-1 text-slate-400'>Gerencie psicólogos e seus pacientes</p>
        </div>
        <div className='flex items-center gap-3'>
          <button
            className='touch-target group flex items-center justify-center rounded-full bg-fuchsia-600 p-3 text-white shadow-lg shadow-fuchsia-500/25 transition-all active:scale-95 hover:bg-fuchsia-700 sm:p-4 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isGeneratingInvite}
            onClick={async () => {
              // Abre o modal imediatamente para feedback rápido
              setTherapistInviteLink('')
              setIsInviteTherapistModalOpen(true)
              setIsGeneratingInvite(true)

              // Gera o token em background
              try {
                const res = await fetch('/api/admin/create-invite', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'psychologist' }),
                })
                const data = await res.json()
                if (data?.token) {
                  setTherapistInviteLink(`${window.location.origin}/admin-invite/${data.token}`)
                } else {
                  setIsInviteTherapistModalOpen(false)
                  alert('Erro ao gerar link de convite.')
                }
              } catch {
                setIsInviteTherapistModalOpen(false)
                alert('Erro ao gerar link de convite.')
              } finally {
                setIsGeneratingInvite(false)
              }
            }}
            title='Convidar Terapeuta'
            type='button'
          >
            <svg
              aria-hidden='true'
              className='lucide lucide-user-plus sm:hidden'
              fill='none'
              height='20'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              width='20'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <line x1='19' x2='19' y1='8' y2='14' />
              <line x1='22' x2='16' y1='11' y2='11' />
            </svg>
            <svg
              aria-hidden='true'
              className='lucide lucide-user-plus hidden sm:block'
              fill='none'
              height='24'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              width='24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <line x1='19' x2='19' y1='8' y2='14' />
              <line x1='22' x2='16' y1='11' y2='11' />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className='relative'>
        <SearchIcon className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
        <input
          className='w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Buscar por nome ou email (psicólogo ou paciente)...'
          type='text'
          value={searchQuery}
        />
      </div>

      {/* Desktop Table View */}
      <div className='hidden overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 md:block'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-700 bg-slate-800'>
                <th className='w-10 px-6 py-4' />
                <th className='px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Psicólogo / Paciente
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
                    <td className='px-6 py-4' colSpan={8}>
                      <div className='h-10 animate-pulse rounded bg-slate-700' />
                    </td>
                  </tr>
                ))
              ) : filteredPsychologists?.length === 0 ? (
                <tr>
                  <td className='px-6 py-12 text-center text-slate-400' colSpan={8}>
                    Nenhum psicólogo encontrado
                  </td>
                </tr>
              ) : (
                filteredPsychologists?.map((psychologist) => (
                  <React.Fragment key={psychologist.id}>
                    {/* Psychologist Row */}
                    <tr
                      className={`transition-colors hover:bg-slate-800/50 ${psychologist.bannedAt ? 'opacity-60' : ''}`}
                    >
                      <td className='px-6 py-4'>
                        <button
                          className='flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-white'
                          onClick={() => toggleExpand(psychologist.id)}
                          type='button'
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${expandedPsychologistIds.has(psychologist.id) ? 'rotate-90' : ''}`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <title>Expand details</title>
                            <path
                              d='M9 5l7 7-7 7'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                            />
                          </svg>
                        </button>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${psychologist.bannedAt ? 'bg-red-600/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                          >
                            {psychologist.name.charAt(0).toUpperCase()}
                          </div>
                          <button
                            className='font-medium text-white hover:underline'
                            onClick={() => handleOpenProfile(psychologist.id)}
                            type='button'
                          >
                            {psychologist.name}
                          </button>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-slate-300'>{psychologist.email}</td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors.psychologist}`}
                        >
                          {roleLabels.psychologist}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        {psychologist.bannedAt ? (
                          <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                            Suspenso
                          </span>
                        ) : (
                          <span className='inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400'>
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-slate-300'>{psychologist.level}</td>
                      <td className='px-6 py-4 text-slate-300'>
                        {new Date(psychologist.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          {psychologist.bannedAt ? (
                            <button
                              className='rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-600/30'
                              onClick={() =>
                                setSelectedPsychologist({
                                  id: psychologist.id,
                                  name: psychologist.name,
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
                                  id: psychologist.id,
                                  name: psychologist.name,
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
                                id: psychologist.id,
                                name: psychologist.name,
                                action: 'delete',
                              })
                            }
                            title='Excluir psicólogo e pacientes'
                            type='button'
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Patients Rows (Expanded) */}
                    {expandedPsychologistIds.has(psychologist.id) &&
                      (psychologist.patients.length === 0 ? (
                        <tr className='bg-slate-800/30'>
                          <td className='px-6 py-4 text-center text-sm text-slate-500' colSpan={8}>
                            Nenhum paciente vinculado
                          </td>
                        </tr>
                      ) : (
                        psychologist.patients.map((patient) => (
                          <tr
                            className={`bg-slate-800/30 transition-colors hover:bg-slate-800/50 ${patient.bannedAt ? 'opacity-60' : ''}`}
                            key={patient.id}
                          >
                            <td className='px-6 py-4' />
                            <td className='px-6 py-4 pl-12'>
                              <div className='flex items-center gap-3'>
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${patient.bannedAt ? 'bg-red-600/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}
                                >
                                  <span className='text-xs'>
                                    {patient.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <button
                                  className='text-sm font-medium text-slate-300 hover:text-white hover:underline'
                                  onClick={() => handleOpenProfile(patient.id)}
                                  type='button'
                                >
                                  {patient.name}
                                </button>
                              </div>
                            </td>
                            <td className='px-6 py-4 text-sm text-slate-400'>{patient.email}</td>
                            <td className='px-6 py-4'>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors.patient}`}
                              >
                                {roleLabels.patient}
                              </span>
                            </td>
                            <td className='px-6 py-4'>
                              {patient.bannedAt ? (
                                <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                                  Suspenso
                                </span>
                              ) : (
                                <span className='inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400'>
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className='px-6 py-4 text-sm text-slate-400'>{patient.level}</td>
                            <td className='px-6 py-4 text-sm text-slate-400'>
                              {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className='px-6 py-4'>
                              <div className='flex items-center gap-2'>
                                {patient.bannedAt ? (
                                  <button
                                    className='rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-600/30'
                                    onClick={() =>
                                      setSelectedUser({
                                        id: patient.id,
                                        name: patient.name,
                                        role: 'patient',
                                        action: 'reactivate',
                                      })
                                    }
                                    title='Reativar paciente'
                                    type='button'
                                  >
                                    <ReactivateIcon />
                                  </button>
                                ) : (
                                  <button
                                    className='rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-600/30'
                                    onClick={() =>
                                      setSelectedUser({
                                        id: patient.id,
                                        name: patient.name,
                                        role: 'patient',
                                        action: 'suspend',
                                      })
                                    }
                                    title='Suspender paciente'
                                    type='button'
                                  >
                                    <SuspendIcon />
                                  </button>
                                )}
                                <button
                                  className='rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30'
                                  onClick={() =>
                                    setSelectedUser({
                                      id: patient.id,
                                      name: patient.name,
                                      role: 'patient',
                                      action: 'delete',
                                    })
                                  }
                                  title='Excluir paciente'
                                  type='button'
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className='space-y-4 md:hidden'>
        {isLoading ? (
          [...new Array(3)].map((_, i) => (
            <div className='h-40 animate-pulse rounded-xl bg-slate-800/50' key={i} />
          ))
        ) : filteredPsychologists?.length === 0 ? (
          <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400'>
            Nenhum psicólogo encontrado
          </div>
        ) : (
          filteredPsychologists?.map((psychologist) => (
            <div
              className={`rounded-xl border border-slate-700 bg-slate-800/50 p-4 ${psychologist.bannedAt ? 'opacity-60' : ''}`}
              key={psychologist.id}
            >
              {/* Psychologist Header */}
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${psychologist.bannedAt ? 'bg-red-600/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                  >
                    {psychologist.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <button
                      className='font-medium text-white hover:underline'
                      onClick={() => handleOpenProfile(psychologist.id)}
                      type='button'
                    >
                      {psychologist.name}
                    </button>
                    <p className='text-sm text-slate-400'>{psychologist.email}</p>
                  </div>
                </div>
                <button
                  className='rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white'
                  onClick={() => toggleExpand(psychologist.id)}
                  type='button'
                >
                  <svg
                    className={`h-5 w-5 transition-transform ${expandedPsychologistIds.has(psychologist.id) ? 'rotate-90' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <title>Expand details</title>
                    <path
                      d='M9 5l7 7-7 7'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                  </svg>
                </button>
              </div>

              {/* Psychologist Details */}
              <div className='mt-4 flex flex-wrap gap-2'>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors.psychologist}`}
                >
                  {roleLabels.psychologist}
                </span>
                {psychologist.bannedAt ? (
                  <span className='inline-flex rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400'>
                    Suspenso
                  </span>
                ) : (
                  <span className='inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400'>
                    Ativo
                  </span>
                )}
                <span className='inline-flex rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300'>
                  Nível {psychologist.level}
                </span>
              </div>

              {/* Psychologist Actions */}
              <div className='mt-4 flex gap-2 border-t border-slate-700 pt-4'>
                {psychologist.bannedAt ? (
                  <button
                    className='flex-1 rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30'
                    onClick={() =>
                      setSelectedPsychologist({
                        id: psychologist.id,
                        name: psychologist.name,
                        action: 'reactivate',
                      })
                    }
                    type='button'
                  >
                    Reativar
                  </button>
                ) : (
                  <button
                    className='flex-1 rounded-lg bg-amber-600/20 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-600/30'
                    onClick={() =>
                      setSelectedPsychologist({
                        id: psychologist.id,
                        name: psychologist.name,
                        action: 'suspend',
                      })
                    }
                    type='button'
                  >
                    Suspender
                  </button>
                )}
                <button
                  className='flex-1 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30'
                  onClick={() =>
                    setSelectedPsychologist({
                      id: psychologist.id,
                      name: psychologist.name,
                      action: 'delete',
                    })
                  }
                  type='button'
                >
                  Excluir
                </button>
              </div>

              {/* Expanded Patients List */}
              {expandedPsychologistIds.has(psychologist.id) && (
                <div className='mt-4 space-y-3 border-t border-slate-700 pt-4'>
                  <h4 className='text-sm font-medium text-slate-400'>Pacientes Vinculados</h4>
                  {psychologist.patients.length === 0 ? (
                    <p className='text-sm text-slate-500'>Nenhum paciente vinculado</p>
                  ) : (
                    psychologist.patients.map((patient) => (
                      <div
                        className={`rounded-lg bg-slate-900/50 p-3 ${patient.bannedAt ? 'opacity-60' : ''}`}
                        key={patient.id}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${patient.bannedAt ? 'bg-red-600/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}
                            >
                              <span className='text-xs'>
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <button
                                className='text-sm font-medium text-white hover:underline'
                                onClick={() => handleOpenProfile(patient.id)}
                                type='button'
                              >
                                {patient.name}
                              </button>
                              <p className='text-xs text-slate-400'>{patient.email}</p>
                            </div>
                          </div>
                          <div className='flex gap-1'>
                            {patient.bannedAt ? (
                              <button
                                className='rounded p-1.5 text-green-400 hover:bg-green-600/20'
                                onClick={() =>
                                  setSelectedUser({
                                    id: patient.id,
                                    name: patient.name,
                                    role: 'patient',
                                    action: 'reactivate',
                                  })
                                }
                                title='Reativar'
                                type='button'
                              >
                                <ReactivateIcon />
                              </button>
                            ) : (
                              <button
                                className='rounded p-1.5 text-amber-400 hover:bg-amber-600/20'
                                onClick={() =>
                                  setSelectedUser({
                                    id: patient.id,
                                    name: patient.name,
                                    role: 'patient',
                                    action: 'suspend',
                                  })
                                }
                                title='Suspender'
                                type='button'
                              >
                                <SuspendIcon />
                              </button>
                            )}
                            <button
                              className='rounded p-1.5 text-red-400 hover:bg-red-600/20'
                              onClick={() =>
                                setSelectedUser({
                                  id: patient.id,
                                  name: patient.name,
                                  role: 'patient',
                                  action: 'delete',
                                })
                              }
                              title='Excluir'
                              type='button'
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de convite de terapeuta */}
      {isInviteTherapistModalOpen && (
        <InviteTherapistModal
          inviteLink={therapistInviteLink}
          isOpen={isInviteTherapistModalOpen}
          onClose={() => setIsInviteTherapistModalOpen(false)}
        />
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          forceRole={forceInviteRole}
          onClose={() => {
            setIsCreateModalOpen(false)
            setForceInviteRole(null)
          }}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            setForceInviteRole(null)
            refetch()
          }}
        />
      )}

      {/* Confirmation Modal for Psychologists */}
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

      {/* Confirmation Modal for Users (Patients) */}
      {selectedUser && (
        <UserConfirmationModal
          action={selectedUser.action}
          isLoading={suspendUser.isPending || reactivateUser.isPending || deleteUser.isPending}
          onClose={() => setSelectedUser(null)}
          onConfirm={handleUserAction}
          userName={selectedUser.name}
          userRole={selectedUser.role as 'patient' | 'psychologist'}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userId={selectedUserId}
        />
      )}
    </div>
  )
}

function CreateUserModal({
  onClose,
  onSuccess,
  forceRole,
}: {
  onClose: () => void
  onSuccess: () => void
  forceRole?: 'psychologist' | 'admin' | null
}) {
  // Invitation State
  const [inviteRole, setInviteRole] = useState<'admin' | 'psychologist'>(
    forceRole ?? 'psychologist'
  )
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState('')

  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      console.log('✅ Invite created successfully:', data)
      alert(`Convite criado com sucesso! Token: ${data.token}`)
      const link = `${window.location.origin}/admin-invite/${data.token}`
      setInviteLink(link)
      onSuccess()
    },
    onError: (err) => {
      console.error('❌ Invite creation error:', err)
      alert(`Erro ao criar convite: ${err.message}`)
      setError(err.message)
    },
  })

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (inviteEmail === '') {
      setError('Preencha o email')
      return
    }

    alert(`Tentando criar convite para ${inviteEmail} como ${inviteRole}`)
    createInvite.mutate({ role: inviteRole, email: inviteEmail })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Atualiza o inviteRole se o forceRole mudar
  React.useEffect(() => {
    if (forceRole) setInviteRole(forceRole)
  }, [forceRole])

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-white'>Adicionar Usuário</h2>
          <button
            aria-label='Fechar modal'
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:scale-110 active:scale-95'
            onClick={onClose}
            type='button'
          >
            <CloseIcon />
          </button>
        </div>

        <form className='space-y-4' onSubmit={handleInviteSubmit}>
          {error && (
            <div className='rounded-lg bg-red-500/10 p-3 text-sm text-red-500'>{error}</div>
          )}

          {inviteLink ? (
            <div className='space-y-4 animate-in fade-in zoom-in duration-300'>
              <div className='rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20 text-center'>
                <div className='mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20'>
                  <Check className='h-5 w-5 text-emerald-500' />
                </div>
                <h3 className='font-medium text-white'>Link Gerado com Sucesso!</h3>
                <p className='text-sm text-slate-400 mt-1'>
                  Envie este link para o novo{' '}
                  {inviteRole === 'admin' ? 'administrador' : 'psicólogo'}.
                </p>
              </div>

              <div>
                <label className='mb-1.5 block text-sm font-medium text-slate-300'>
                  Link de Convite
                </label>
                <div className='flex gap-2'>
                  <code className='flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 overflow-x-auto whitespace-nowrap scrollbar-hide'>
                    {inviteLink}
                  </code>
                  <button
                    className={`flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    onClick={copyToClipboard}
                    title='Copiar Link'
                    type='button'
                  >
                    {isCopied ? <Check className='h-5 w-5' /> : <Copy className='h-5 w-5' />}
                  </button>
                </div>
              </div>

              <button
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700'
                onClick={() => {
                  setInviteLink('')
                  setIsCopied(false)
                  setInviteEmail('')
                }}
                type='button'
              >
                Gerar Outro Convite
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  className='mb-1.5 block text-sm font-medium text-slate-300'
                  htmlFor='invite-role'
                >
                  Função do Convidado
                </label>
                <select
                  className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                  disabled={!!forceRole}
                  id='invite-role'
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'psychologist')}
                  value={inviteRole}
                >
                  <option value='psychologist'>Psicólogo</option>
                  <option value='admin'>Administrador</option>
                </select>
              </div>

              <div>
                <label
                  className='mb-1.5 block text-sm font-medium text-slate-300'
                  htmlFor='invite-email'
                >
                  Email
                </label>
                <input
                  className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
                  id='invite-email'
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder='email@exemplo.com'
                  required
                  type='email'
                  value={inviteEmail}
                />
                <p className='mt-1 text-xs text-slate-500'>
                  Usado para registrar quem foi convidado.
                </p>
              </div>

              <button
                className='mt-6 w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={createInvite.isPending}
                type='submit'
              >
                {createInvite.isPending ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />{' '}
                    Gerando...
                  </span>
                ) : (
                  'Gerar Link de Convite'
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
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

function UserConfirmationModal({
  userName,
  userRole,
  action,
  onClose,
  onConfirm,
  isLoading,
}: {
  userName: string
  userRole: 'patient' | 'psychologist'
  action: 'suspend' | 'delete' | 'reactivate'
  onClose: () => void
  onConfirm: (reason?: string) => void
  isLoading: boolean
}) {
  const [suspendReason, setSuspendReason] = useState('')

  const userRoleLabels = {
    patient: 'Paciente',
    psychologist: 'Psicólogo',
  }

  const actionLabels = {
    suspend: {
      title: `Suspender ${userRoleLabels[userRole]}`,
      description: 'suspender',
      warning: `Ao suspender este ${userRoleLabels[userRole].toLowerCase()}, ele não poderá acessar o sistema.`,
      buttonText: 'Suspender',
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
    reactivate: {
      title: `Reativar ${userRoleLabels[userRole]}`,
      description: 'reativar',
      warning: `Ao reativar este ${userRoleLabels[userRole].toLowerCase()}, ele poderá acessar o sistema novamente.`,
      buttonText: 'Reativar',
      buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    delete: {
      title: `Excluir ${userRoleLabels[userRole]}`,
      description: 'excluir permanentemente',
      warning: `ATENÇÃO: Esta ação é irreversível! Ao excluir este ${userRoleLabels[userRole].toLowerCase()}, TODOS os seus dados serão perdidos permanentemente.`,
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
            Você está prestes a {labels.description} o {userRoleLabels[userRole].toLowerCase()}{' '}
            <strong className='text-white'>{userName}</strong>.
          </p>

          <div
            className={`rounded-lg p-4 ${action === 'delete' ? 'bg-red-500/20 text-red-300' : action === 'reactivate' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}
          >
            <p className='text-sm'>{labels.warning}</p>
          </div>

          {action === 'suspend' && (
            <div className='space-y-2'>
              <label
                className='block text-sm font-medium text-slate-300'
                htmlFor='suspend-reason-user'
              >
                Motivo da suspensão <span className='text-red-400'>*</span>
              </label>
              <textarea
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500'
                id='suspend-reason-user'
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
