'use client'

import { MessageCircle, PartyPopper, Search, Sparkles, UserMinus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'

// Mensagens encorajadoras para alta
const DISCHARGE_MESSAGES = [
  'Você conseguiu! Cada passo que você deu até aqui foi uma vitória. Continue cuidando de si mesmo.',
  'Parabéns pela sua jornada! Você provou que é capaz de superar desafios e crescer.',
  'Este é um momento de celebração! Você trabalhou duro e merece reconhecer suas conquistas.',
  'Que orgulho do seu progresso! Lembre-se: você sempre pode voltar quando precisar.',
  'Você chegou longe! Continue aplicando tudo o que aprendeu e confie em si mesmo.',
]

// Constante para o canal de broadcast de suspensão
const SUSPENSION_CHANNEL = 'nepsis-suspension-channel'

type Therapist = {
  id: string
  fullName: string
  crp: string
  education: string
  city: string
  attendanceType: 'online' | 'presential' | 'both'
  clinicAddress: string | null
  phone: string
}

export function UnlinkedPatientModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTherapistList, setShowTherapistList] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'online' | 'presential' | 'both'>('all')

  const utils = trpc.useUtils()

  const {
    data: suspensionData,
    isLoading,
    refetch,
  } = trpc.user.checkSuspension.useQuery(undefined, {
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  })

  const { data: therapists, isLoading: isLoadingTherapists } =
    trpc.therapistProfile.getAvailableTherapists.useQuery(undefined, {
      enabled: showTherapistList,
    })

  // Filtrar terapeutas
  const filteredTherapists = therapists?.filter((therapist) => {
    const matchesSearch =
      therapist.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.crp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.education.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || therapist.attendanceType === filterType

    return matchesSearch && matchesType
  })

  // Função para forçar verificação imediata
  const forceCheck = useCallback(() => {
    utils.user.checkSuspension.invalidate()
    refetch()
  }, [utils.user.checkSuspension, refetch])

  // Escutar mensagens do BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel(SUSPENSION_CHANNEL)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'USER_SUSPENDED' || event.data?.type === 'PATIENT_UNLINKED') {
        forceCheck()
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [forceCheck])

  // Verificar visibilidade
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceCheck()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [forceCheck])

  // Abrir modal se paciente foi desvinculado
  useEffect(() => {
    if (suspensionData?.isSuspended && suspensionData?.unlinkReason) {
      setIsOpen(true)
    }
  }, [suspensionData])

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

  const handleCloseApp = async () => {
    try {
      await authClient.signOut()
      // Tentar fechar a janela (funciona apenas se foi aberta por script)
      window.close()
      // Fallback: redirecionar para login
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Erro ao fechar:', error)
      window.location.href = '/auth/signin'
    }
  }

  const handleFindNewTherapist = () => {
    setShowTherapistList(true)
  }

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    // Adiciona código do Brasil se não tiver
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      return `55${cleanPhone}`
    }
    return cleanPhone
  }

  const handleContactTherapist = (therapist: Therapist) => {
    const phone = formatPhoneForWhatsApp(therapist.phone)
    const message = encodeURIComponent(
      `Olá ${therapist.fullName}, estou procurando um novo terapeuta e gostaria de conversar sobre a possibilidade de iniciar um tratamento.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const getAttendanceTypeLabel = (type: 'online' | 'presential' | 'both') => {
    switch (type) {
      case 'online':
        return 'Online'
      case 'presential':
        return 'Presencial'
      case 'both':
        return 'Online e Presencial'
    }
  }

  // Não mostrar se carregando, não está aberto, ou não foi desvinculado por terapeuta
  if (isLoading || !isOpen || !suspensionData?.isSuspended || !suspensionData?.unlinkReason) {
    return null
  }

  const isDischarged = suspensionData.unlinkReason === 'discharged'

  // Selecionar mensagem encorajadora aleatória (mas consistente por sessão)
  const encouragingMessage =
    DISCHARGE_MESSAGES[
      Math.abs(suspensionData.unlinkedByTherapistName?.length ?? 0) % DISCHARGE_MESSAGES.length
    ]

  if (showTherapistList) {
    return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm'>
        <div className='mx-4 flex h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-violet-500/50 bg-slate-900 shadow-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-slate-700 p-4'>
            <h2 className='font-semibold text-lg text-white'>Encontrar Novo Terapeuta</h2>
            <button
              className='rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white'
              onClick={() => setShowTherapistList(false)}
              type='button'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Search and Filter */}
          <div className='space-y-3 border-b border-slate-700 p-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
              <input
                className='w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pr-4 pl-10 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Pesquisar por nome, CRP, formação ou cidade...'
                type='text'
                value={searchTerm}
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['all', 'online', 'presential', 'both'] as const).map((type) => (
                <button
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    filterType === type
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  key={type}
                  onClick={() => setFilterType(type)}
                  type='button'
                >
                  {type === 'all'
                    ? 'Todos'
                    : type === 'online'
                      ? 'Online'
                      : type === 'presential'
                        ? 'Presencial'
                        : 'Online e Presencial'}
                </button>
              ))}
            </div>
          </div>

          {/* Therapist List */}
          <div className='flex-1 overflow-y-auto p-4'>
            {isLoadingTherapists ? (
              <div className='flex h-40 items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600' />
              </div>
            ) : filteredTherapists && filteredTherapists.length > 0 ? (
              <div className='space-y-3'>
                {filteredTherapists.map((therapist) => (
                  <div
                    className='rounded-xl border border-slate-700 bg-slate-800 p-4'
                    key={therapist.id}
                  >
                    <div className='mb-3 flex items-start justify-between'>
                      <div>
                        <h3 className='font-semibold text-white'>{therapist.fullName}</h3>
                        <p className='text-slate-400 text-sm'>CRP: {therapist.crp}</p>
                      </div>
                      <span className='rounded-full bg-violet-900/30 px-2 py-1 text-violet-300 text-xs'>
                        {getAttendanceTypeLabel(therapist.attendanceType)}
                      </span>
                    </div>

                    <div className='mb-3 space-y-1 text-slate-300 text-sm'>
                      <p>
                        <span className='text-slate-400'>Formação:</span> {therapist.education}
                      </p>
                      {therapist.bio && (
                        <p className='line-clamp-2'>
                          <span className='text-slate-400'>Sobre:</span> {therapist.bio}
                        </p>
                      )}
                      <p>
                        <span className='text-slate-400'>Cidade:</span> {therapist.city}
                      </p>
                      {(therapist.attendanceType === 'presential' ||
                        therapist.attendanceType === 'both') &&
                        therapist.clinicAddress && (
                          <p>
                            <span className='text-slate-400'>Endereço:</span>{' '}
                            {therapist.clinicAddress}
                          </p>
                        )}
                    </div>

                    <button
                      className='flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-medium text-white transition-colors hover:bg-green-700'
                      onClick={() => handleContactTherapist(therapist)}
                      type='button'
                    >
                      <MessageCircle className='h-5 w-5' />
                      Contatar via WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-40 flex-col items-center justify-center text-center'>
                <UserMinus className='mb-3 h-12 w-12 text-slate-500' />
                <p className='text-slate-400'>Nenhum terapeuta encontrado</p>
                <p className='text-slate-500 text-sm'>Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className='border-t border-slate-700 p-4'>
            <p className='text-center text-slate-400 text-sm'>
              Após entrar em contato, o terapeuta enviará um link de convite para vincular você ao
              perfil dele.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Modal de comemoração para ALTA
  if (isDischarged) {
    return (
      <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm'>
        <div className='mx-4 w-full max-w-md rounded-xl border border-emerald-500/50 bg-gradient-to-b from-slate-900 to-emerald-950/30 p-6 shadow-2xl'>
          {/* Confetes decorativos */}
          <div className='pointer-events-none absolute inset-0 overflow-hidden'>
            <div
              className='absolute top-4 left-8 text-2xl animate-bounce'
              style={{ animationDelay: '0ms' }}
            >
              🎉
            </div>
            <div
              className='absolute top-8 right-12 text-xl animate-bounce'
              style={{ animationDelay: '200ms' }}
            >
              ✨
            </div>
            <div
              className='absolute top-16 left-16 text-lg animate-bounce'
              style={{ animationDelay: '400ms' }}
            >
              🌟
            </div>
            <div
              className='absolute top-6 right-6 text-2xl animate-bounce'
              style={{ animationDelay: '100ms' }}
            >
              🎊
            </div>
          </div>

          <div className='mb-4 flex items-center justify-center'>
            <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30'>
              <PartyPopper className='h-10 w-10 text-white' />
              <div className='absolute -right-1 -top-1'>
                <Sparkles className='h-6 w-6 text-yellow-400' />
              </div>
            </div>
          </div>

          <h2 className='mb-2 text-center font-bold text-2xl text-white'>
            Parabéns pela sua Alta! 🎉
          </h2>

          <p className='mb-4 text-center text-emerald-200'>
            Você completou seu tratamento com{' '}
            <span className='font-semibold'>
              {suspensionData.unlinkedByTherapistName || 'seu terapeuta'}
            </span>
            !
          </p>

          <div className='mb-6 rounded-lg bg-emerald-900/30 border border-emerald-500/30 p-4'>
            <p className='text-center text-emerald-100 italic'>"{encouragingMessage}"</p>
          </div>

          <div className='space-y-3'>
            <button
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700'
              onClick={handleCloseApp}
              type='button'
            >
              Fechar App
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Modal para EXPULSÃO/DESVINCULAÇÃO
  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm'>
      <div className='mx-4 w-full max-w-md rounded-xl border border-red-500/50 bg-slate-900 p-6 shadow-2xl'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20'>
            <UserMinus className='h-8 w-8 text-red-400' />
          </div>
        </div>

        <h2 className='mb-2 text-center font-semibold text-xl text-white'>Você foi desvinculado</h2>

        <p className='mb-4 text-center text-slate-300'>
          Você foi desvinculado do terapeuta{' '}
          <span className='font-semibold'>
            {suspensionData.unlinkedByTherapistName || 'seu terapeuta'}
          </span>
          .
        </p>

        <div className='mb-4 rounded-lg bg-red-900/20 border border-red-500/30 p-4'>
          <p className='text-red-200 text-sm font-medium mb-1'>Motivo da desvinculação:</p>
          <p className='text-slate-300 text-sm'>
            {suspensionData.banReason || 'O terapeuta optou por encerrar o acompanhamento.'}
          </p>
        </div>

        <div className='mb-6 rounded-lg bg-slate-800/50 p-4'>
          <p className='text-slate-300 text-sm'>
            Sua conta está temporariamente suspensa. Para continuar usando o app, você pode:
          </p>
          <ul className='mt-2 list-inside list-disc text-slate-400 text-sm'>
            <li>Buscar um novo terapeuta e aceitar um convite de vinculação</li>
            <li>Aguardar contato do suporte</li>
          </ul>
        </div>

        <div className='space-y-3'>
          <button
            className='w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white transition-colors hover:bg-violet-700'
            onClick={handleFindNewTherapist}
            type='button'
          >
            Buscar Novo Terapeuta
          </button>

          <button
            className='w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700'
            onClick={handleCloseApp}
            type='button'
          >
            Fechar App
          </button>
        </div>
      </div>
    </div>
  )
}
