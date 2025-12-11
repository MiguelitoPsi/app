'use client'

import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  User,
  UserCircle,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type AttendanceType = 'online' | 'presential' | 'both'

type TherapistProfileModalProps = {
  isOpen: boolean
  onComplete?: () => void
  onClose?: () => void
  mode?: 'create' | 'edit'
}

const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const formatDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const parseDateString = (dateStr: string): Date | null => {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const day = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10) - 1
  const year = Number.parseInt(parts[2], 10)
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null
  if (year < 1900 || year > new Date().getFullYear() - 18) return null
  const date = new Date(year, month, day)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year)
    return null
  return date
}

const formatDateFromTimestamp = (date: Date | null): string => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function TherapistProfileModal({
  isOpen,
  onComplete,
  onClose,
  mode = 'create',
}: TherapistProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    crp: '',
    education: '',
    city: '',
    attendanceType: 'online' as AttendanceType,
    clinicAddress: '',
    phone: '',
    bio: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const utils = trpc.useUtils()

  const { data: existingProfile, isLoading: isLoadingProfile } =
    trpc.therapistProfile.getProfile.useQuery(undefined, {
      enabled: mode === 'edit',
    })

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const createProfile = trpc.therapistProfile.createProfile.useMutation({
    onSuccess: () => {
      utils.therapistProfile.checkProfileComplete.invalidate()
      utils.therapistProfile.getProfile.invalidate()
      onComplete?.()
    },
    onError: (error) => {
      setErrors({ submit: error.message })
      setIsSubmitting(false)
    },
  })

  const updateProfile = trpc.therapistProfile.updateProfile.useMutation({
    onSuccess: () => {
      utils.therapistProfile.getProfile.invalidate()
      onComplete?.()
    },
    onError: (error) => {
      setErrors({ submit: error.message })
      setIsSubmitting(false)
    },
  })

  // Load existing profile data in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingProfile) {
      setFormData({
        fullName: existingProfile.fullName,
        cpf: existingProfile.cpf,
        birthDate: formatDateFromTimestamp(existingProfile.birthDate),
        crp: existingProfile.crp,
        education: existingProfile.education,
        city: existingProfile.city,
        attendanceType: existingProfile.attendanceType,
        clinicAddress: existingProfile.clinicAddress || '',
        phone: existingProfile.phone,
        bio: existingProfile.bio || '',
      })
    }
  }, [existingProfile, mode])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim() || formData.fullName.length < 3) {
      newErrors.fullName = 'Nome completo deve ter pelo menos 3 caracteres'
    }

    if (!CPF_REGEX.test(formData.cpf)) {
      newErrors.cpf = 'CPF inválido (formato: 000.000.000-00)'
    }

    const birthDate = parseDateString(formData.birthDate)
    if (!birthDate) {
      newErrors.birthDate = 'Data de nascimento inválida (formato: DD/MM/AAAA)'
    }

    if (!formData.crp.trim() || formData.crp.length < 4) {
      newErrors.crp = 'CRP deve ter pelo menos 4 caracteres'
    }

    if (!formData.education.trim() || formData.education.length < 3) {
      newErrors.education = 'Formação deve ter pelo menos 3 caracteres'
    }

    if (!formData.city.trim() || formData.city.length < 2) {
      newErrors.city = 'Cidade deve ter pelo menos 2 caracteres'
    }

    if (
      (formData.attendanceType === 'presential' || formData.attendanceType === 'both') &&
      !formData.clinicAddress.trim()
    ) {
      newErrors.clinicAddress = 'Endereço da clínica é obrigatório para atendimento presencial'
    }

    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    const birthDate = parseDateString(formData.birthDate)
    if (!birthDate) {
      setErrors({ birthDate: 'Data inválida' })
      setIsSubmitting(false)
      return
    }

    // Generate username from CPF (unique identifier)
    const generatedUsername = formData.cpf.replace(/\D/g, '')

    const profileData = {
      fullName: formData.fullName.trim(),
      username: existingProfile?.username || generatedUsername,
      cpf: formData.cpf,
      birthDate,
      crp: formData.crp.trim(),
      education: formData.education.trim(),
      city: formData.city.trim(),
      attendanceType: formData.attendanceType,
      clinicAddress: formData.clinicAddress.trim() || undefined,
      phone: formData.phone,
      bio: formData.bio.trim() || undefined,
    }

    if (mode === 'edit') {
      await updateProfile.mutateAsync(profileData)
    } else {
      await createProfile.mutateAsync(profileData)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  if (!isOpen) return null

  const isEditMode = mode === 'edit'
  const isLoading = isLoadingProfile && isEditMode
  const showClinicAddress =
    formData.attendanceType === 'presential' || formData.attendanceType === 'both'

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm'>
      <div className='relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 dark:border-slate-700'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'>
              <UserCircle className='h-5 w-5 text-white' />
            </div>
            <div>
              <h2 className='font-bold text-lg text-white'>
                {isEditMode ? 'Editar Perfil' : 'Criar Perfil Profissional'}
              </h2>
              <p className='text-sm text-violet-200'>
                {isEditMode ? 'Atualize suas informações' : 'Complete seu cadastro'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button
              aria-label='Fechar modal'
              className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30'
              onClick={handleClose}
              type='button'
            >
              <X className='h-5 w-5' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent' />
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Error message */}
              {errors.submit && (
                <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400'>
                  {errors.submit}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <User className='h-4 w-4 text-violet-500' />
                  Nome Completo *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.fullName ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder='Seu nome completo'
                  type='text'
                  value={formData.fullName}
                />
                {errors.fullName && <p className='mt-1 text-sm text-red-500'>{errors.fullName}</p>}
              </div>

              {/* CPF */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <CreditCard className='h-4 w-4 text-violet-500' />
                  CPF *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.cpf ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder='000.000.000-00'
                  type='text'
                  value={formData.cpf}
                />
                {errors.cpf && <p className='mt-1 text-sm text-red-500'>{errors.cpf}</p>}
              </div>

              {/* Birth Date */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <Calendar className='h-4 w-4 text-violet-500' />
                  Data de Nascimento *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.birthDate ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: formatDate(e.target.value) })
                  }
                  placeholder='DD/MM/AAAA'
                  type='text'
                  value={formData.birthDate}
                />
                {errors.birthDate && (
                  <p className='mt-1 text-sm text-red-500'>{errors.birthDate}</p>
                )}
              </div>

              {/* CRP */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <CreditCard className='h-4 w-4 text-violet-500' />
                  CRP *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.crp ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, crp: e.target.value })}
                  placeholder='00/00000'
                  type='text'
                  value={formData.crp}
                />
                {errors.crp && <p className='mt-1 text-sm text-red-500'>{errors.crp}</p>}
              </div>

              {/* Education */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <BookOpen className='h-4 w-4 text-violet-500' />
                  Formação *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.education ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder='Ex: Psicologia - PUC-SP'
                  type='text'
                  value={formData.education}
                />
                {errors.education && (
                  <p className='mt-1 text-sm text-red-500'>{errors.education}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <MapPin className='h-4 w-4 text-violet-500' />
                  Cidade *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.city ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder='São Paulo, SP'
                  type='text'
                  value={formData.city}
                />
                {errors.city && <p className='mt-1 text-sm text-red-500'>{errors.city}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <BookOpen className='h-4 w-4 text-violet-500' />
                  Biografia
                </label>
                <textarea
                  className={`w-full rounded-xl border ${errors.bio ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200 resize-none`}
                  maxLength={500}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder='Conte um pouco sobre você, sua experiência e abordagem terapêutica...'
                  rows={4}
                  value={formData.bio}
                />
                <div className='mt-1 flex items-center justify-between'>
                  {errors.bio && <p className='text-sm text-red-500'>{errors.bio}</p>}
                  <p className='ml-auto text-xs text-slate-400'>
                    {formData.bio.length}/500 caracteres
                  </p>
                </div>
              </div>

              {/* Attendance Type */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <Building2 className='h-4 w-4 text-violet-500' />
                  Tipo de Atendimento *
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {[
                    { value: 'online', label: 'Online' },
                    { value: 'presential', label: 'Presencial' },
                    { value: 'both', label: 'Ambos' },
                  ].map((option) => (
                    <button
                      className={`rounded-xl border py-3 font-medium text-sm transition-all ${
                        formData.attendanceType === option.value
                          ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-violet-700'
                      }`}
                      key={option.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          attendanceType: option.value as AttendanceType,
                        })
                      }
                      type='button'
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinic Address (conditional) */}
              {showClinicAddress && (
                <div className='animate-in fade-in slide-in-from-top-2 duration-200'>
                  <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                    <Building2 className='h-4 w-4 text-violet-500' />
                    Endereço da Clínica *
                  </label>
                  <input
                    className={`w-full rounded-xl border ${errors.clinicAddress ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                    onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                    placeholder='Rua, número, bairro, cidade - UF'
                    type='text'
                    value={formData.clinicAddress}
                  />
                  {errors.clinicAddress && (
                    <p className='mt-1 text-sm text-red-500'>{errors.clinicAddress}</p>
                  )}
                </div>
              )}

              {/* Phone */}
              <div>
                <label className='mb-1.5 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300'>
                  <Phone className='h-4 w-4 text-violet-500' />
                  Telefone *
                </label>
                <input
                  className={`w-full rounded-xl border ${errors.phone ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:bg-slate-800 dark:text-slate-200`}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder='(00) 00000-0000'
                  type='text'
                  value={formData.phone}
                />
                {errors.phone && <p className='mt-1 text-sm text-red-500'>{errors.phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50'>
          <div className='flex gap-3'>
            {isEditMode && (
              <button
                className='flex-1 rounded-xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                disabled={isSubmitting}
                onClick={handleClose}
                type='button'
              >
                Cancelar
              </button>
            )}
            <button
              className={`flex-1 rounded-xl py-3.5 font-semibold text-white transition-all duration-200 ${
                isSubmitting
                  ? 'cursor-not-allowed bg-slate-400 dark:bg-slate-600'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98]'
              }`}
              disabled={isSubmitting}
              onClick={handleSubmit}
              type='button'
            >
              {isSubmitting ? (
                <span className='flex items-center justify-center gap-2'>
                  <svg
                    aria-hidden='true'
                    className='h-5 w-5 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <title>Carregando</title>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      fill='currentColor'
                    />
                  </svg>
                  Salvando...
                </span>
              ) : (
                <span className='flex items-center justify-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  {isEditMode ? 'Salvar Alterações' : 'Criar Perfil'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
