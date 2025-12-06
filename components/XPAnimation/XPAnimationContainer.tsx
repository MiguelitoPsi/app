'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Particle } from '@/hooks/useXPAnimation'
import { XPParticle } from './XPParticle'

interface XPAnimationContainerProps {
  particles: Particle[]
}

export const XPAnimationContainer: React.FC<XPAnimationContainerProps> = ({ particles }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <div aria-hidden='true' className='pointer-events-none fixed inset-0 z-[9999]'>
      {particles.map((particle) => (
        <XPParticle key={particle.id} particle={particle} />
      ))}
    </div>,
    document.body
  )
}
