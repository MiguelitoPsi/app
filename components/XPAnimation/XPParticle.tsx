'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import type { Particle } from '@/hooks/useXPAnimation'

type XPParticleProps = {
  particle: Particle
}

export const XPParticle: React.FC<XPParticleProps> = ({ particle }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Start animation after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => setIsAnimating(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const { origin, target, amount, type } = particle

  // Calculate control point for bezier curve (creates arc effect)
  const _midX = (origin.x + target.x) / 2
  const _midY = Math.min(origin.y, target.y) - 100 // Arc upward

  return (
    <div
      className='pointer-events-none fixed z-[9999] transition-all duration-[1200ms] ease-out'
      style={{
        left: isAnimating ? target.x : origin.x,
        top: isAnimating ? target.y : origin.y,
        transform: 'translate(-50%, -50%)',
        opacity: isAnimating ? 0 : 1,
      }}
    >
      <div
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-bold text-sm shadow-lg ${
          type === 'xp'
            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
        }`}
        style={{
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {type === 'xp' ? (
          <>
            <span className='text-lg'>✨</span>
            <span>+{amount} XP</span>
          </>
        ) : (
          <>
            <span className='text-lg'>💎</span>
            <span>+{amount} Pts</span>
          </>
        )}
      </div>
    </div>
  )
}
