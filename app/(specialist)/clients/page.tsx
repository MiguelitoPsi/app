'use client'

import {
  Calendar,
  CheckCircle,
  FileText,
  LogOut,
  Mail,
  Search,
  User,
  UserPlus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { InvitePatientModal } from '@/components/InvitePatientModal'

type Patient = {
  id: string
  name: string | null
  email: string
  image: string | null
  isPrimary: boolean
  relationshipId: string
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false)
  const [unlinkReason, setUnlinkReason] = useState('')
  const [referralReason, setReferralReason] = useState('')
  const [selectedNewTherapistId, setSelectedNewTherapistId] = useState<string | null>(null)

  const [therapistSearchQuery, setTherapistSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: patients, isLoading, refetch: refetchPatients } = trpc.patient.getAll.useQuery()
  const { data: patientsData } = trpc.patient.getMyPatients.useQuery()
  const { data: allTherapists } = trpc.therapistProfile.getAvailableTherapists.useQuery(undefined, {
    enabled: showReferralModal,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Unlink patient mutation
  const unlinkPatientMutation = trpc.patient.unlinkPatient.useMutation({
    onSuccess: () => {
      refetchPatients()
      setSelectedPatientId(null)
      setSelectedPatient(null)
      setShowUnlinkConfirm(false)
      setUnlinkReason('')
      setOpenDropdownId(null)
    },
  })

  // Discharge patient mutation
  const dischargePatientMutation = trpc.patient.dischargePatient.useMutation({
    onSuccess: () => {
      setShowDischargeConfirm(false)
      setSelectedPatientId(null)
      setSelectedPatient(null)
      refetchPatients()
      setOpenDropdownId(null)
    },
  })

  // Transfer patient mutation
  const transferPatientMutation = trpc.patient.transferPatient.useMutation({
    onSuccess: () => {
      setShowReferralModal(false)
      setSelectedPatientId(null)
      setSelectedPatient(null)
      setSelectedNewTherapistId(null)
      setReferralReason('')
      refetchPatients()
      setOpenDropdownId(null)
    },
  })

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTherapists = allTherapists?.filter(
    (therapist) =>
      therapist.fullName?.toLowerCase().includes(therapistSearchQuery.toLowerCase()) ||
      therapist.phone?.toLowerCase().includes(therapistSearchQuery.toLowerCase())
  )

  const handleOpenActions = (patient: Patient) => {
    setSelectedPatientId(patient.id)
    setSelectedPatient(patient)
    setOpenDropdownId(patient.id)
  }

  const handleCloseDropdown = () => {
    setOpenDropdownId(null)
  }

  return (
    <div className='box-border h-full overflow-y-auto pb-10'>

      {/* Content */}
      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Meus Pacientes</h2>
            <p className='text-slate-500 dark:text-slate-400'>
              {patients?.length || 0} pacientes cadastrados
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className='flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-600 active:scale-95'
          >
            <UserPlus className='h-4 w-4' />
            Convidar Paciente
          </button>
        </div>

        <InvitePatientModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
        />

        {/* Stats */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <div className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
                <User className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Total</p>
                <p className='text-xl font-bold text-slate-800 dark:text-white'>
                  {patients?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'>
                <Calendar className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Ativos</p>
                <p className='text-xl font-bold text-slate-800 dark:text-white'>
                  {patientsData?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Com sessões</p>
                <p className='text-xl font-bold text-slate-800 dark:text-white'>
                  {patientsData?.filter((p) => (p as any).sessionCount > 0).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='mb-8 relative max-w-md'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input
              className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 shadow-sm transition-all'
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Buscar por nome ou email...'
              type='text'
              value={searchQuery}
            />
          </div>
        </div>

        {/* Patients List */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent' />
          </div>
        ) : filteredPatients && filteredPatients.length > 0 ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredPatients.map((patient) => (
              <div
                className='group relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-500'
                key={patient.id}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-lg font-bold text-white'>
                      {patient.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className='font-semibold text-slate-800 dark:text-white'>
                        {patient.name}
                      </h3>
                      <p className='text-sm text-slate-500 dark:text-slate-400'>{patient.email}</p>
                    </div>
                  </div>
                  <div className='relative'>
                    <button
                      className={`rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 ${
                        openDropdownId === patient.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                      }`}
                      onClick={() =>
                        openDropdownId === patient.id
                          ? handleCloseDropdown()
                          : handleOpenActions(patient)
                      }
                    >
                      <svg
                        className='h-5 w-5'
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
                        <circle cx='12' cy='12' r='1' />
                        <circle cx='19' cy='12' r='1' />
                        <circle cx='5' cy='12' r='1' />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === patient.id && (
                      <div
                        className='absolute right-0 top-8 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800'
                        ref={dropdownRef}
                      >
                        <div className='p-1.5'>
                          <button
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                            onClick={() => {
                              setShowUnlinkConfirm(true)
                              handleCloseDropdown()
                            }}
                          >
                            <LogOut className='h-4 w-4 text-red-500' />
                            Desvincular paciente
                          </button>
                          <button
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                            onClick={() => {
                              setShowReferralModal(true)
                              handleCloseDropdown()
                            }}
                          >
                            <UserPlus className='h-4 w-4 text-sky-500' />
                            Encaminhamento
                          </button>
                          <button
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                            onClick={() => {
                              setShowDischargeConfirm(true)
                              handleCloseDropdown()
                            }}
                          >
                            <CheckCircle className='h-4 w-4 text-emerald-500' />
                            Dar alta ao paciente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className='mt-4 space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
                    <Mail className='h-4 w-4' />
                    {patient.email}
                  </div>
                </div>

                <div className='mt-4 flex gap-2'>
                  <a
                    className='flex-1 rounded-lg bg-sky-50 py-2 text-center text-sm font-medium text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/30'
                    href={`/clients/${patient.id}`}
                  >
                    Ver perfil
                  </a>
                  <a
                    className='flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                    href={`/therapist-routine?patientId=${patient.id}`}
                  >
                    Agendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800'>
              <User className='h-8 w-8 text-slate-400' />
            </div>
            <h3 className='mb-1 font-semibold text-slate-800 dark:text-white'>
              Nenhum paciente encontrado
            </h3>
            <p className='text-slate-500 dark:text-slate-400'>
              {searchQuery
                ? 'Tente buscar com outro nome ou email'
                : 'Você ainda não tem pacientes cadastrados'}
            </p>
          </div>
        )}
      </div>

      {/* Unlink Confirmation Modal */}
      {showUnlinkConfirm && selectedPatient && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800'>
            <div className='mb-4'>
              <h3 className='font-semibold text-slate-800 dark:text-white'>Desvincular Paciente</h3>
            </div>
            <p className='mb-4 text-sm text-slate-500 dark:text-slate-400'>
              Tem certeza que deseja desvincular <strong>{selectedPatient.name}</strong>? A conta do
              paciente será suspensa.
            </p>
            <div className='mb-4'>
              <label className='mb-1 block text-sm text-slate-600 dark:text-slate-400'>
                Motivo (opcional)
              </label>
              <textarea
                className='w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500'
                onChange={(e) => setUnlinkReason(e.target.value)}
                placeholder='Descreva o motivo da desvinculação...'
                rows={3}
                value={unlinkReason}
              />
            </div>
            <p className='mb-4 text-xs text-slate-400 dark:text-slate-500'>
              Ao desvincular ou dar alta, a conta do paciente será suspensa até que ele se vincule a
              um novo terapeuta.
            </p>
            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                onClick={() => {
                  setShowUnlinkConfirm(false)
                  setUnlinkReason('')
                }}
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50'
                disabled={unlinkPatientMutation.isPending}
                onClick={() => {
                  if (selectedPatientId) {
                    unlinkPatientMutation.mutate({
                      patientId: selectedPatientId,
                      reason: unlinkReason || undefined,
                    })
                  }
                }}
              >
                {unlinkPatientMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Confirmation Modal */}
      {showDischargeConfirm && selectedPatient && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800'>
            <div className='mb-4'>
              <h3 className='font-semibold text-slate-800 dark:text-white'>Dar Alta ao Paciente</h3>
            </div>
            <p className='mb-8 text-center text-sm text-slate-500 dark:text-slate-400'>
              Tem certeza que deseja dar alta a <strong>{selectedPatient.name}</strong>? A conta do
              paciente será suspensa.
            </p>
            <div className='flex gap-3'>
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                onClick={() => setShowDischargeConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-xl bg-green-500 px-4 py-3 font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50'
                disabled={dischargePatientMutation.isPending}
                onClick={() => {
                  if (selectedPatientId) {
                    dischargePatientMutation.mutate({
                      patientId: selectedPatientId,
                    })
                  }
                }}
              >
                {dischargePatientMutation.isPending ? 'Processando...' : 'Dar Alta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && selectedPatient && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='mx-4 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 sm:p-8'>
            <div className='mb-6 border-b border-slate-100 pb-4 dark:border-slate-700'>
              <h3 className='font-semibold text-slate-800 dark:text-white'>Encaminhar Paciente</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                Selecione um novo terapeuta para encaminhar {selectedPatient.name}
              </p>
            </div>

            <div className='mb-4'>
              <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                Buscar terapeuta
              </label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <input
                  className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500'
                  onChange={(e) => setTherapistSearchQuery(e.target.value)}
                  placeholder='Buscar por nome ou telefone...'
                  type='text'
                  value={therapistSearchQuery}
                />
              </div>
            </div>

            <div className='mb-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700'>
              {filteredTherapists && filteredTherapists.length > 0 ? (
                <div className='divide-y divide-slate-100 dark:divide-slate-700'>
                  {filteredTherapists.map((therapist) => (
                    <button
                      className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                        selectedNewTherapistId === therapist.id
                          ? 'bg-sky-50 dark:bg-sky-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      key={therapist.id}
                      onClick={() => setSelectedNewTherapistId(therapist.id)}
                    >
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 font-semibold text-white'>
                        {therapist.fullName?.charAt(0) || 'T'}
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium text-slate-800 dark:text-white'>
                          {therapist.fullName}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>
                          {therapist.phone}
                        </p>
                      </div>
                      {selectedNewTherapistId === therapist.id && (
                        <CheckCircle className='h-5 w-5 text-sky-500' />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='p-4 text-center text-slate-500 dark:text-slate-400'>
                  Nenhum terapeuta encontrado
                </div>
              )}
            </div>

            <div className='mb-6'>
              <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                Motivo do encaminhamento (opcional)
              </label>
              <textarea
                className='w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500'
                onChange={(e) => setReferralReason(e.target.value)}
                placeholder='Ex: Especialidade mais adequada, mudança de cidade...'
                rows={2}
                value={referralReason}
              />
            </div>

            <div className='flex gap-3 border-t border-slate-100 pt-6 dark:border-slate-700'>
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                onClick={() => {
                  setShowReferralModal(false)
                  setReferralReason('')
                  setSelectedNewTherapistId(null)
                  setTherapistSearchQuery('')
                }}
              >
                Cancelar
              </button>
              <button
                className='flex-1 rounded-xl bg-sky-500 px-4 py-3 font-bold text-white transition-colors hover:bg-sky-600 disabled:opacity-50'
                disabled={!selectedNewTherapistId || transferPatientMutation.isPending}
                onClick={() => {
                  if (selectedPatientId && selectedNewTherapistId) {
                    transferPatientMutation.mutate({
                      patientId: selectedPatientId,
                      newTherapistId: selectedNewTherapistId,
                      reason: referralReason || undefined,
                    })
                  }
                }}
              >
                {transferPatientMutation.isPending ? 'Processando...' : 'Confirmar Encaminhamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
