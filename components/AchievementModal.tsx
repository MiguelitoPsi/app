import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '@/hooks/useSound'

type AchievementModalProps = {
  badge: {
    name: string
    description: string
    icon: string
  }
  onClose: () => void
}

const AchievementModal = ({ badge, onClose }: AchievementModalProps) => {
  const [show, setShow] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { playAchievement, playClick } = useSound()

  const handleClose = useCallback(() => {
    playClick()
    setShow(false)
    setTimeout(onClose, 300) // Wait for exit animation
  }, [onClose, playClick])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    setShow(true)
    // Play achievement sound
    playAchievement()
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
  }, [handleClose, playAchievement])

  if (!badge) return null

  return (
    <div
      aria-describedby='achievement-description'
      aria-labelledby='achievement-title'
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
        ref={modalRef}
      >
        <div className='relative overflow-hidden rounded-2xl bg-slate-900 border border-violet-500/30 shadow-2xl shadow-violet-500/20 p-8 text-center'>
          {/* Background Effects */}
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none'
          />
          <div
            aria-hidden='true'
            className='absolute -top-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl animate-pulse'
          />
          <div
            aria-hidden='true'
            className='absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse'
          />

          {/* Icon */}
          <div className='relative mb-6 inline-block'>
            <div
              aria-hidden='true'
              className='absolute inset-0 bg-violet-500 blur-xl opacity-50 animate-pulse'
            />
            <div
              aria-label={`Ícone da conquista: ${badge.name}`}
              className='relative bg-gradient-to-br from-violet-400 to-violet-600 p-4 rounded-full shadow-lg animate-float flex items-center justify-center w-20 h-20 text-4xl'
              role='img'
            >
              {badge.icon}
            </div>
            <div aria-hidden='true' className='absolute -top-2 -right-2'>
              <Sparkles className='w-6 h-6 text-violet-200 animate-bounce' />
            </div>
          </div>

          {/* Text */}
          <h2
            className='text-2xl font-bold text-white mb-2 animate-scale-up'
            id='achievement-title'
          >
            Conquista Desbloqueada!
          </h2>
          <h3 className='text-xl font-bold text-violet-400 mb-4'>{badge.name}</h3>
          <p className='text-slate-300 mb-8 text-sm' id='achievement-description'>
            {badge.description}
          </p>

          {/* Button */}
          <button
            className='w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transform transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
            onClick={handleClose}
            ref={closeButtonRef}
            type='button'
          >
            Incrível!
          </button>
        </div>
      </div>
    </div>
  )
}

export default AchievementModal
