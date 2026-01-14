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
  Image as ImageIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { compressImage } from '@/lib/utils/image-compression'

type AttendanceType = 'online' | 'presential' | 'both'

type SettingsProfileFormProps = {
  activeTab: 'profile' | 'clinic'
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

const formatCRP = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 7)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
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

export function SettingsProfileForm({ activeTab }: SettingsProfileFormProps) {
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
    image: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Por favor, selecione uma imagem JPG, PNG ou WebP.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem é muito grande. Por favor, escolha uma imagem de até 10MB.')
      return
    }

    try {
      const base64String = await compressImage(file, 1500, 0.85)
      setFormData({ ...formData, image: base64String })
    } catch (error) {
      console.error('Error compressing image:', error)
      alert('Erro ao processar imagem. Tente novamente.')
    }
  }

  const utils = trpc.useUtils()

  const { data: existingProfile, isLoading } = trpc.therapistProfile.getProfile.useQuery()

  const updateProfile = trpc.therapistProfile.updateProfile.useMutation({
    onSuccess: () => {
      utils.therapistProfile.getProfile.invalidate()
      setSubmitSuccess(true)
      setIsSubmitting(false)
      setTimeout(() => setSubmitSuccess(false), 3000)
    },
    onError: (error) => {
      setErrors({ submit: error.message })
      setIsSubmitting(false)
    },
  })

  useEffect(() => {
    if (existingProfile) {
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
        image: existingProfile.image || '',
      })
    }
  }, [existingProfile])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (activeTab === 'profile') {
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
    }

    if (activeTab === 'clinic') {
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    const birthDate = parseDateString(formData.birthDate)
    if (!birthDate && activeTab === 'profile') { 
      setErrors({ birthDate: 'Data inválida' })
      setIsSubmitting(false)
      return
    }

    const validBirthDate = parseDateString(formData.birthDate)
    if (!validBirthDate) {
         setErrors({ submit: 'Erro nos dados do perfil (Data). Verifique a aba Perfil.' })
         setIsSubmitting(false)
         return
    }

    const generatedUsername = formData.cpf.replace(/\D/g, '')

    const profileData = {
      fullName: formData.fullName.trim(),
      username: existingProfile?.username || generatedUsername,
      cpf: formData.cpf,
      birthDate: validBirthDate,
      crp: formData.crp.trim(),
      education: formData.education.trim(),
      city: formData.city.trim(),
      attendanceType: formData.attendanceType,
      clinicAddress: formData.clinicAddress.trim() || undefined,
      phone: formData.phone,
      bio: formData.bio.trim() || undefined,
      image: formData.image.trim() || undefined,
    }

    await updateProfile.mutateAsync(profileData)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent' />
      </div>
    )
  }

  const showClinicAddress =
    formData.attendanceType === 'presential' || formData.attendanceType === 'both'

  return (
    <div className='space-y-4'>
      {/* Error/Success messages */}
      {errors.submit && (
        <div className='rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400'>
          {errors.submit}
        </div>
      )}
      {submitSuccess && (
        <div className='rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400'>
          Alterações salvas com sucesso!
        </div>
      )}

      {activeTab === 'profile' && (
        <div className='flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300'>
            {/* Image Upload */}
            <div className='flex flex-col gap-2 shrink-0'>
                <div 
                onClick={() => document.getElementById('profile-image-upload')?.click()}
                className='relative h-32 w-32 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800'
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                    document.getElementById('profile-image-upload')?.click()
                    }
                }}
                >
                {formData.image ? (
                    <div className="relative h-full w-full group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt='Preview'
                        className='h-full w-full object-cover transition-opacity group-hover:opacity-75'
                        src={formData.image}
                    />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full bg-black/50 p-1.5 text-white">
                            <ImageIcon className="h-4 w-4" />
                        </span>
                    </div>
                    </div>
                ) : (
                    <div className="flex h-full w-full cursor-pointer items-center justify-center text-slate-300 dark:text-slate-600">
                    <ImageIcon className="h-8 w-8" />
                    </div>
                )}
                </div>
                <input
                id="profile-image-upload"
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleImageUpload}
                className="hidden"
                />
            </div>

            <div className='flex-1 grid grid-cols-12 gap-3'>
                {/* Full Name */}
                <div className="col-span-12">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <User className='h-3 w-3' />
                        Nome Completo *
                    </label>
                    <input
                        className={`w-full rounded-lg border ${errors.fullName ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                        onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                        }
                        placeholder='Seu nome completo'
                        type='text'
                        value={formData.fullName}
                    />
                    {errors.fullName && (
                        <p className='mt-1 text-xs text-red-500'>{errors.fullName}</p>
                    )}
                </div>

                {/* CPF */}
                <div className="col-span-12 sm:col-span-4">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <CreditCard className='h-3 w-3' />
                        CPF *
                    </label>
                    <input
                        className={`w-full rounded-lg border ${errors.cpf ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                        onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                        placeholder='000.000.000-00'
                        type='text'
                        value={formData.cpf}
                    />
                    {errors.cpf && <p className='mt-1 text-xs text-red-500'>{errors.cpf}</p>}
                </div>

                {/* Birth Date */}
                <div className="col-span-12 sm:col-span-4">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <Calendar className='h-3 w-3' />
                        Nascimento *
                    </label>
                    <input
                        className={`w-full rounded-lg border ${errors.birthDate ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                        onChange={(e) =>
                            setFormData({ ...formData, birthDate: formatDate(e.target.value) })
                        }
                        placeholder='DD/MM/AAAA'
                        type='text'
                        value={formData.birthDate}
                    />
                    {errors.birthDate && (
                    <p className='mt-1 text-xs text-red-500'>{errors.birthDate}</p>
                    )}
                </div>

                {/* CRP */}
                <div className="col-span-12 sm:col-span-4">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <CreditCard className='h-3 w-3' />
                        CRP *
                    </label>
                    <input
                        className={`w-full rounded-lg border ${errors.crp ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                        onChange={(e) => setFormData({ ...formData, crp: formatCRP(e.target.value) })}
                        placeholder='00/00000'
                        type='text'
                        value={formData.crp}
                    />
                    {errors.crp && <p className='mt-1 text-xs text-red-500'>{errors.crp}</p>}
                </div>

                {/* Education */}
                <div className="col-span-12">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <BookOpen className='h-3 w-3' />
                        Formação *
                    </label>
                    <input
                        className={`w-full rounded-lg border ${errors.education ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        placeholder='Ex: Psicologia - PUC-SP'
                        type='text'
                        value={formData.education}
                    />
                    {errors.education && (
                    <p className='mt-1 text-xs text-red-500'>{errors.education}</p>
                    )}
                </div>

                {/* Bio */}
                <div className="col-span-12">
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                        <BookOpen className='h-3 w-3' />
                        Biografia
                    </label>
                    <textarea
                        className={`w-full rounded-lg border ${errors.bio ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200 resize-none`}
                        maxLength={500}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder='Conte um pouco sobre você...'
                        rows={2}
                        value={formData.bio}
                    />
                    <div className='flex items-center justify-between'>
                        {errors.bio && <p className='text-xs text-red-500'>{errors.bio}</p>}
                        <p className='ml-auto text-[10px] text-slate-400'>
                            {formData.bio.length}/500
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'clinic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
             {/* City */}
            <div>
                <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    <MapPin className='h-3 w-3' />
                    Cidade *
                </label>
                <input
                    className={`w-full rounded-lg border ${errors.city ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder='São Paulo, SP'
                    type='text'
                    value={formData.city}
                />
                {errors.city && <p className='mt-1 text-xs text-red-500'>{errors.city}</p>}
            </div>

            {/* Attendance Type */}
            <div>
                <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    <Building2 className='h-3 w-3' />
                    Tipo *
                </label>
                <div className='grid grid-cols-3 gap-2'>
                    {[
                    { value: 'online', label: 'Online' },
                    { value: 'presential', label: 'Presencial' },
                    { value: 'both', label: 'Ambos' },
                    ].map((option) => (
                    <button
                        className={`rounded-lg border py-2 font-medium text-xs transition-all ${
                        formData.attendanceType === option.value
                            ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-900/30 dark:text-sky-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-sky-700'
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
                <div className='md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-200'>
                    <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    <Building2 className='h-3 w-3' />
                    Endereço da Clínica *
                    </label>
                    <input
                    className={`w-full rounded-lg border ${errors.clinicAddress ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                    onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                    placeholder='Rua, número, bairro, cidade - UF'
                    type='text'
                    value={formData.clinicAddress}
                    />
                    {errors.clinicAddress && (
                    <p className='mt-1 text-xs text-red-500'>{errors.clinicAddress}</p>
                    )}
                </div>
            )}

            {/* Phone */}
            <div className='md:col-span-2'>
                <label className='mb-1 flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    <Phone className='h-3 w-3' />
                    Telefone *
                </label>
                <input
                    className={`w-full rounded-lg border ${errors.phone ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:bg-slate-800 dark:text-slate-200`}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder='(00) 00000-0000'
                    type='text'
                    value={formData.phone}
                />
                {errors.phone && <p className='mt-1 text-xs text-red-500'>{errors.phone}</p>}
            </div>
        </div>
      )}

      {/* Save Button */}
      <div className='flex justify-end pt-2'>
        <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${
            isSubmitting
                ? 'cursor-not-allowed bg-slate-400 dark:bg-slate-600'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-[0.98]'
            }`}
            disabled={isSubmitting}
            onClick={handleSubmit}
            type='button'
        >
            {isSubmitting ? (
            <span className='flex items-center justify-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                Salvando...
            </span>
            ) : (
            <span className='flex items-center justify-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                Salvar
            </span>
            )}
        </button>
      </div>
    </div>
  )
}
