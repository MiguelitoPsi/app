'use client'

import {
  ArrowLeft,
  Brain,
  ChevronRight,
  MapPin,
  Phone,
  Search,
  User,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

type AttendanceType = 'all' | 'online' | 'presential' | 'both'

const attendanceLabels: Record<AttendanceType, string> = {
  all: 'Todos',
  online: 'Online',
  presential: 'Presencial',
  both: 'Híbrido',
}

const attendanceIcons: Record<Exclude<AttendanceType, 'all'>, React.ReactNode> = {
  online: <Video className="h-4 w-4" />,
  presential: <MapPin className="h-4 w-4" />,
  both: (
    <>
      <Video className="h-4 w-4" />
      <MapPin className="h-4 w-4" />
    </>
  ),
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  // Add country code if not present
  if (cleaned.startsWith('55')) {
    return cleaned
  }
  return `55${cleaned}`
}

export default function PsychologistsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<AttendanceType>('all')

  const { data: therapists, isLoading } = trpc.therapistProfile.getPublicTherapists.useQuery()

  const filteredTherapists = therapists?.filter((therapist) => {
    const matchesSearch =
      searchTerm === '' ||
      therapist.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.education.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterType === 'all' || therapist.attendanceType === filterType

    return matchesSearch && matchesFilter
  })

  const handleContactTherapist = (therapist: (typeof therapists)[number]) => {
    const phone = formatPhoneForWhatsApp(therapist.phone)
    const message = encodeURIComponent(
      `Olá ${therapist.fullName}, encontrei seu perfil no Nepsis e gostaria de conversar sobre a possibilidade de iniciar um tratamento.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Nepsis</span>
            </div>
          </div>

          <Link
            className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-sm text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
            href="/auth/signin"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-6xl px-3 sm:px-4 pt-20 sm:pt-24 pb-12 sm:pb-20">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 h-48 w-48 sm:h-96 sm:w-96 rounded-full bg-emerald-600/10 blur-[80px] sm:blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 sm:h-96 sm:w-96 rounded-full bg-violet-600/10 blur-[80px] sm:blur-[120px]" />
        </div>

        <div className="relative">
          {/* Page Header */}
          <div className="mb-6 sm:mb-10 text-center">
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-emerald-400">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Profissionais Cadastrados
            </div>
            <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Encontre seu Psicólogo
            </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 px-2">
              Explore nossa lista de profissionais qualificados e encontre o terapeuta ideal para
              sua jornada de autoconhecimento.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nome, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 sm:py-3 pl-10 pr-4 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Filter by Attendance Type */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
              {(['all', 'online', 'presential', 'both'] as AttendanceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`shrink-0 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                    filterType === type
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {attendanceLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-800" />
                      <div className="h-3 w-1/2 rounded bg-slate-800" />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-slate-800" />
                    <div className="h-3 w-2/3 rounded bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTherapists && filteredTherapists.length === 0 && (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 sm:p-12 text-center">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-800">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-slate-500" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-semibold text-white">
                Nenhum terapeuta encontrado
              </h3>
              <p className="text-sm sm:text-base text-slate-400">
                {searchTerm || filterType !== 'all'
                  ? 'Tente ajustar os filtros para encontrar mais resultados.'
                  : 'Ainda não há terapeutas cadastrados na plataforma.'}
              </p>
            </div>
          )}

          {/* Therapist Cards */}
          {!isLoading && filteredTherapists && filteredTherapists.length > 0 && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="group rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 transition-all hover:border-emerald-500/50 hover:bg-slate-800/50"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-base sm:text-xl font-bold text-white">
                      {therapist.fullName
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-white truncate">{therapist.fullName}</h3>
                      <p className="text-xs sm:text-sm text-emerald-400">CRP: {therapist.crp}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{therapist.education}</p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{therapist.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                          therapist.attendanceType === 'online'
                            ? 'bg-blue-500/10 text-blue-400'
                            : therapist.attendanceType === 'presential'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-violet-500/10 text-violet-400'
                        }`}
                      >
                        {attendanceIcons[therapist.attendanceType]}
                        {attendanceLabels[therapist.attendanceType]}
                      </span>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => handleContactTherapist(therapist)}
                    className="mt-4 sm:mt-6 flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-emerald-500/50 bg-emerald-500/10 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 group-hover:border-emerald-500"
                  >
                    <Phone className="h-4 w-4" />
                    Entrar em contato
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Results count */}
          {!isLoading && filteredTherapists && filteredTherapists.length > 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">
              Mostrando {filteredTherapists.length}{' '}
              {filteredTherapists.length === 1 ? 'terapeuta' : 'terapeutas'}
              {(searchTerm || filterType !== 'all') && ' com os filtros aplicados'}
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-3 sm:px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-slate-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Nepsis. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-xs text-slate-600 px-2">
            Atenção: Em caso de crise ou emergência, ligue para o CVV (188) ou procure o hospital
            mais próximo.
          </p>
        </div>
      </footer>
    </div>
  )
}
