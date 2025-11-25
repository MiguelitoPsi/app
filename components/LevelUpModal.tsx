import { Sparkles, Star, Trophy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type LevelUpModalProps = {
  newLevel: number
  onClose: () => void
}

const LevelUpModal = ({ newLevel, onClose }: LevelUpModalProps) => {
  const [show, setShow] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleClose = useCallback(() => {
    setShow(false)
    setTimeout(onClose, 300) // Wait for exit animation
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    setShow(true)
    // Focus the close button when modal opens
    setTimeout(() => closeButtonRef.current?.focus(), 100)

    // Add escape key listener
    document.addEventListener('keydown', handleKeyDown)

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleClose])

  if (!(show || newLevel)) return null

  return (
    <div
      aria-describedby='levelup-description'
      aria-labelledby='levelup-title'
      aria-modal='true'
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role='dialog'
    >
      {/* Backdrop */}
      <div
        aria-hidden='true'
        className='absolute inset-0 bg-black/80 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-500 ${
          show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'
        }`}
      >
        <div className='relative overflow-hidden rounded-2xl bg-slate-900 border border-yellow-500/30 shadow-2xl shadow-yellow-500/20 p-8 text-center'>
          {/* Background Effects */}
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none'
          />
          <div
            aria-hidden='true'
            className='absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl animate-pulse'
          />
          <div
            aria-hidden='true'
            className='absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse'
          />

          {/* Icon */}
          <div className='relative mb-6 inline-block'>
            <div
              aria-hidden='true'
              className='absolute inset-0 bg-yellow-500 blur-xl opacity-50 animate-pulse'
            />
            <div className='relative bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-full shadow-lg animate-float'>
              <Trophy aria-hidden='true' className='w-12 h-12 text-white' />
            </div>
            <div aria-hidden='true' className='absolute -top-2 -right-2'>
              <Sparkles className='w-6 h-6 text-yellow-200 animate-bounce' />
            </div>
            <div aria-hidden='true' className='absolute -bottom-2 -left-2'>
              <Star className='w-6 h-6 text-yellow-200 animate-spin-slow' />
            </div>
          </div>

          {/* Text */}
          <h2 className='text-3xl font-bold text-white mb-2 animate-scale-up' id='levelup-title'>
            Level Up!
          </h2>
          <p className='text-slate-300 mb-6' id='levelup-description'>
            Você alcançou o nível{' '}
            <span className='text-yellow-400 font-bold text-xl'>{newLevel}</span>
          </p>

          {/* Level Badge */}
          <div aria-hidden='true' className='flex justify-center items-center gap-4 mb-8'>
            <div className='text-slate-500 text-sm font-medium'>Nível {newLevel - 1}</div>
            <div className='h-1 w-12 bg-slate-700 rounded-full overflow-hidden'>
              <div className='h-full bg-yellow-500 w-full animate-shine' />
            </div>
            <div className='text-yellow-400 text-lg font-bold'>Nível {newLevel}</div>
          </div>

          {/* Button */}
          <button
            className='w-full py-3 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/25 transform transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
            onClick={handleClose}
            ref={closeButtonRef}
            type='button'
          >
            Continuar Jornada
          </button>
        </div>
      </div>
    </div>
  )
}

export default LevelUpModal
