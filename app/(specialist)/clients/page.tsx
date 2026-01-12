'use client'

import {
  Mail,
  Phone,
  Search,
  User,
  Calendar,
  FileText,
  LogOut,
  UserPlus,
  CheckCircle,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'

type Patient = {
  id: string
  name: string | null
  email: string
  phone: string | null
  createdAt: Date
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

  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: patients, isLoading, refetch: refetchPatients } = trpc.patient.getAll.useQuery()
  const { data: patientsData } = trpc.patient.getMyPatients.useQuery()
  const { data: allTherapists } = trpc.therapist.getAll.useQuery(undefined, {
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

  const filteredPatients = patients?.filter((patient) =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTherapists = allTherapists?.filter(
    (therapist) =>
      therapist.name?.toLowerCase().includes(therapistSearchQuery.toLowerCase()) ||
      therapist.email?.toLowerCase().includes(therapistSearchQuery.toLowerCase())
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
    <div className='box-border h-full overflow-y-auto'>
      {/* Dashboard Header */}
      <header className='sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80'>
        <div className='flex h-16 items-center justify-between px-4'>
          <div className='relative flex-1 max-w-xl'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
              <input
                className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'
                placeholder='Buscar cliente...'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className='flex items-center gap-2 pl-4'>
            <a
              className='flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-md'
              href='/upgrade'
            >
              <svg
                className='h-4 w-4'
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' />
                <path d='M20 2v4' />
                <path d='M22 4h-4' />
                <circle cx='4' cy='20' r='2' />
              </svg>
              <span className='hidden sm:inline'>Assinar</span>
            </a>
            <a
              className='flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              href='/videos'
              title='Vídeos'
            >
              <svg
                className='h-5 w-5'
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' />
                <rect x='2' y='6' width='14' height='12' rx='2' />
              </svg>
            </a>
            <div className='relative'>
              <button
                className='flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                title='Notificações'
              >
                <svg
                  className='h-5 w-5'
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M10.268 21a2 2 0 0 0 3.464 0' />
                  <path d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' />
                </svg>
                <span className='absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500' />
              </button>
            </div>
            <div className='relative'>
              <button className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-sky-500 transition-all hover:ring-2 hover:ring-sky-500/30'>
                <img
                  alt='Perfil'
                  className='h-full w-full object-cover'
                  src='/avatar-default.png'
                  width={36}
                  height={36}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>
            Meus Pacientes
          </h2>
          <p className='text-slate-500 dark:text-slate-400'>
            {patients?.length || 0} pacientes cadastrados
          </p>
        </div>

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
                  {patientsData?.length || 0}
                </p>
              </div>
            </div>
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
                key={patient.id}
                className='group relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-500'
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
                      <p className='text-sm text-slate-500 dark:text-slate-400'>
                        {patient.email}
                      </p>
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
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='h-5 w-5'
                      >
                        <circle cx='12' cy='12' r='1' />
                        <circle cx='19' cy='12' r='1' />
                        <circle cx='5' cy='12' r='1' />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === patient.id && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-0 top-8 z-50 w-48 rounded-xl border border-slate-700 bg-[#161b22] shadow-xl'
                        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)' }}
                      >
                        <div className='py-1'>
                          <button
                            className='flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-[#1c2128]'
                            onClick={() => {
                              setShowUnlinkConfirm(true)
                              handleCloseDropdown()
                            }}
                          >
                            <LogOut className='h-4 w-4 text-red-400' />
                            Desvincular paciente
                          </button>
                          <button
                            className='flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-[#1c2128]'
                            onClick={() => {
                              setShowReferralModal(true)
                              handleCloseDropdown()
                            }}
                          >
                            <UserPlus className='h-4 w-4 text-sky-400' />
                            Encaminhamento
                          </button>
                          <button
                            className='flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-[#1c2128]'
                            onClick={() => {
                              setShowDischargeConfirm(true)
                              handleCloseDropdown()
                            }}
                          >
                            <CheckCircle className='h-4 w-4 text-emerald-400' />
                            Dar alta ao paciente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className='mt-4 space-y-2'>
                  {patient.phone && (
                    <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
                      <Phone className='h-4 w-4' />
                      {patient.phone}
                    </div>
                  )}
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
              <h3 className='font-semibold text-slate-800 dark:text-white'>
                Desvincular Paciente
              </h3>
            </div>
            <p className='mb-4 text-sm text-slate-500 dark:text-slate-400'>
              Tem certeza que deseja desvincular <strong>{selectedPatient.name}</strong>? A conta
              do paciente será suspensa.
            </p>
            <div className='mb-4'>
              <label className='mb-1 block text-sm text-slate-600 dark:text-slate-400'>
                Motivo (opcional)
              </label>
              <textarea
                className='w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500'
                placeholder='Descreva o motivo da desvinculação...'
                rows={3}
                value={unlinkReason}
                onChange={(e) => setUnlinkReason(e.target.value)}
              />
            </div>
            <p className='mb-4 text-xs text-slate-400 dark:text-slate-500'>
              Ao desvincular ou dar alta, a conta do paciente será suspensa até que ele se vincule
              a um novo terapeuta.
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
              <h3 className='font-semibold text-slate-800 dark:text-white'>
                Dar Alta ao Paciente
              </h3>
            </div>
            <p className='mb-8 text-center text-sm text-slate-500 dark:text-slate-400'>
              Tem certeza que deseja dar alta a <strong>{selectedPatient.name}</strong>? A conta
              do paciente será suspensa.
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
              <h3 className='font-semibold text-slate-800 dark:text-white'>
                Encaminhar Paciente
              </h3>
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
                  placeholder='Buscar por nome ou email...'
                  type='text'
                  value={therapistSearchQuery}
                  onChange={(e) => setTherapistSearchQuery(e.target.value)}
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
                        {therapist.name?.charAt(0) || 'T'}
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium text-slate-800 dark:text-white'>
                          {therapist.name}
                        </p>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>
                          {therapist.email}
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
                placeholder='Ex: Especialidade mais adequada, mudança de cidade...'
                rows={2}
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
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
                {transferPatientMutation.isPending
                  ? 'Processando...'
                  : 'Confirmar Encaminhamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
