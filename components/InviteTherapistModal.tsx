import { Check, Copy, Loader2, X } from 'lucide-react'
import { useState } from 'react'

export function InviteTherapistModal({
  isOpen,
  onClose,
  inviteLink,
}: {
  isOpen: boolean
  onClose: () => void
  inviteLink: string
}) {
  const [isCopied, setIsCopied] = useState(false)
  const isLoading = !inviteLink

  if (!isOpen) return null

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

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
      <div className='w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-2xl border border-slate-700/50 relative animate-in zoom-in-95 fade-in duration-200'>
        {/* Close Button */}
        <button
          aria-label='Fechar modal'
          className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/50 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-white active:scale-95'
          onClick={onClose}
          type='button'
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className='flex justify-center mb-6'>
          <div className='flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/25'>
            <svg
              className='text-white'
              fill='none'
              height='40'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              width='40'
            >
              <circle cx='9' cy='7' r='4' />
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <line x1='19' x2='19' y1='8' y2='14' />
              <line x1='22' x2='16' y1='11' y2='11' />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className='text-center mb-6'>
          <h2 className='text-2xl font-bold text-white mb-2'>Convidar Terapeuta</h2>
          <p className='text-slate-400 text-sm'>
            Compartilhe este link para que o terapeuta possa se cadastrar na plataforma.
          </p>
        </div>

        {/* Link Box */}
        <div className='mb-6'>
          <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
            Link de Convite
          </label>
          <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-h-[52px] flex items-center'>
            {isLoading ? (
              <div className='flex items-center gap-2 text-slate-400'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm'>Gerando link...</span>
              </div>
            ) : (
              <p className='font-mono text-sm text-slate-300 break-all'>{inviteLink}</p>
            )}
          </div>
        </div>

        {/* Copy Button */}
        <button
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-sm shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            isCopied
              ? 'bg-emerald-500 text-white shadow-emerald-500/25'
              : 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-fuchsia-500/25 hover:from-fuchsia-500 hover:to-violet-500'
          }`}
          disabled={isLoading}
          onClick={handleCopy}
          type='button'
        >
          {isCopied ? (
            <>
              <Check className='h-5 w-5' />
              Link Copiado!
            </>
          ) : (
            <>
              <Copy className='h-5 w-5' />
              Copiar Link de Convite
            </>
          )}
        </button>

        {/* Info */}
        <div className='mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4'>
          <p className='text-center text-amber-300 text-xs'>
            <strong className='text-amber-400'>Dica:</strong> O terapeuta poderá criar uma conta ou
            fazer login através deste link e será automaticamente cadastrado como psicólogo.
          </p>
        </div>
      </div>
    </div>
  )
}
