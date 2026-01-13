import { Check, Copy, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

interface InvitePatientModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InvitePatientModal({ isOpen, onClose }: InvitePatientModalProps) {
  const [inviteLink, setInviteLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState('')

  // Mutation to create invite link
  const createInviteMutation = trpc.patient.createGenericInvite.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.link)
    },
    onError: (err) => {
      setError('Erro ao gerar link de convite. Tente novamente.')
    },
  })

  // Generate link on open
  useEffect(() => {
    if (isOpen && !inviteLink) {
      createInviteMutation.mutate()
    }
  }, [isOpen])

  // Reset state on close
  const handleClose = () => {
    setInviteLink('')
    setError('')
    setIsCopied(false)
    onClose()
  }

  const handleCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      setIsCopied(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200'>
      <div className='w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-800 relative animate-in zoom-in-95 duration-200'>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className='absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors'
        >
          <X size={20} />
        </button>

        <div className='mb-6 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30'>
            <svg
              className='h-8 w-8 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Link de Convite</h2>
          <p className='text-slate-500 dark:text-slate-400 text-sm mt-2'>
            Envie este link para seu paciente se cadastrar.
          </p>
        </div>

        {error ? (
          <div className='mb-6 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400'>
            {error}
            <button
              onClick={() => createInviteMutation.mutate()}
              className='mt-2 block w-full rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className='mb-6'>
            <div className='relative'>
              <div className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50'>
                {createInviteMutation.isPending ? (
                  <div className='flex w-full items-center justify-center gap-2 py-1 text-slate-500'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span className='text-sm'>Gerando link...</span>
                  </div>
                ) : (
                  <code className='block w-full overflow-hidden text-ellipsis font-mono text-sm text-slate-600 dark:text-slate-300'>
                    {inviteLink}
                  </code>
                )}
              </div>
            </div>
            
            <div className='mt-4'>
              <button
                onClick={handleCopy}
                disabled={!inviteLink || createInviteMutation.isPending}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
                  isCopied
                    ? 'bg-emerald-500 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className='h-5 w-5' />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className='h-5 w-5' />
                    Copiar Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className='rounded-xl bg-amber-50 border border-amber-100 p-4 dark:bg-amber-900/10 dark:border-amber-900/20'>
          <p className='text-center text-xs text-amber-700 dark:text-amber-400'>
            <strong>Nota:</strong> O paciente deverá criar uma conta com nome e email ao acessar o link.
          </p>
        </div>
      </div>
    </div>
  )
}
