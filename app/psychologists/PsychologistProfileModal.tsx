'use client'

import { Brain, Calendar, GraduationCap, MapPin, Phone, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type AttendanceType = 'all' | 'online' | 'presential' | 'both'

interface Psychologist {
  id: string
  fullName: string
  crp: string
  education: string
  city: string
  attendanceType: AttendanceType
  clinicAddress: string | null
  phone: string
  bio: string | null
  image: string | null
}

interface PsychologistProfileModalProps {
  isOpen: boolean
  onClose: () => void
  therapist: Psychologist | null
}

const attendanceLabels: Record<AttendanceType, string> = {
  all: 'Todos',
  online: 'Online',
  presential: 'Presencial',
  both: 'Híbrido (Online + Presencial)',
}

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('55')) {
    return cleaned
  }
  return `55${cleaned}`
}

export function PsychologistProfileModal({
  isOpen,
  onClose,
  therapist,
}: PsychologistProfileModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => setIsVisible(false), 300)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isVisible && !isOpen) return null

  if (!therapist) return null

  const handleContact = () => {
    const phone = formatPhoneForWhatsApp(therapist.phone)
    const message = encodeURIComponent(
      `Olá ${therapist.fullName}, encontrei seu perfil no Nepsis e gostaria de conversar sobre a possibilidade de iniciar um tratamento.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'bg-slate-950/80 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Content with Gradient Background */}
        <div className='relative h-32 bg-gradient-to-br from-violet-600/20 to-emerald-600/20'>
          <button
            className='absolute right-4 top-4 rounded-full bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white'
            onClick={onClose}
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Profile Info */}
        <div className='relative px-6 pb-8 -mt-12'>
          <div className='flex flex-col sm:flex-row gap-4 items-start'>
            {/* Avatar */}
            <div className='h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-4 ring-slate-900 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl'>
              {therapist.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={therapist.fullName}
                  className='h-full w-full object-cover'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement?.classList.remove('bg-transparent')
                    e.currentTarget.parentElement?.classList.add(
                      'bg-gradient-to-br',
                      'from-emerald-500',
                      'to-teal-600'
                    )
                  }}
                  src={therapist.image}
                />
              ) : (
                <span className='text-3xl font-bold text-white'>
                  {therapist.fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </span>
              )}
            </div>

            <div className='flex-1 pt-14 sm:pt-12 space-y-1'>
              <h2 className='text-2xl font-bold text-white'>{therapist.fullName}</h2>
              <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400'>
                <span className='flex items-center gap-1.5'>
                  <Brain className='h-4 w-4 text-violet-400' />
                  CRP: {therapist.crp}
                </span>
                <span className='flex items-center gap-1.5'>
                  <MapPin className='h-4 w-4 text-emerald-400' />
                  {therapist.city}
                </span>
              </div>
            </div>
          </div>

          <div className='mt-8 grid gap-6 sm:grid-cols-2'>
            {/* Professional Info */}
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
                Formação e Atuação
              </h3>
              
              <div className='space-y-3'>
                <div className='flex items-start gap-3 text-slate-300'>
                  <GraduationCap className='h-5 w-5 text-violet-400 shrink-0 mt-0.5' />
                  <div>
                    <span className='block text-sm font-medium text-slate-400'>Formação</span>
                    <span>{therapist.education}</span>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-slate-300'>
                  <Video className='h-5 w-5 text-emerald-400 shrink-0 mt-0.5' />
                  <div>
                    <span className='block text-sm font-medium text-slate-400'>Modalidade</span>
                    <span>{attendanceLabels[therapist.attendanceType]}</span>
                  </div>
                </div>

                {therapist.clinicAddress && (
                  <div className='flex items-start gap-3 text-slate-300'>
                    <MapPin className='h-5 w-5 text-amber-400 shrink-0 mt-0.5' />
                    <div>
                      <span className='block text-sm font-medium text-slate-400'>Endereço Consultório</span>
                      <span>{therapist.clinicAddress}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div className='sm:col-span-2 space-y-3'>
              <h3 className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
                Sobre o Profissional
              </h3>
              <div className='rounded-xl bg-slate-950/50 p-4 border border-slate-800/50'>
                <p className='text-slate-300 text-sm leading-relaxed whitespace-pre-wrap'>
                  {therapist.bio || 'Este profissional ainda não adicionou uma biografia.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className='mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800'>
            <button
              className='rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors'
              onClick={onClose}
            >
              Fechar
            </button>
            <button
              className='flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:scale-105 active:scale-95'
              onClick={handleContact}
            >
              <Phone className='h-4 w-4' />
              Entrar em contato pelo WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
