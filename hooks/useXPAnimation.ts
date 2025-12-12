'use client'

import { useCallback, useEffect, useState } from 'react'

export type ParticleType = 'xp' | 'pts'

export type Particle = {
  id: string
  amount: number
  type: ParticleType
  origin: { x: number; y: number }
  target: { x: number; y: number }
}

export type UseXPAnimationReturn = {
  particles: Particle[]
  triggerAnimation: (amount: number, type: ParticleType, originX: number, originY: number) => void
  clearParticles: () => void
}

/**
 * Custom hook to manage XP and Points animations
 * Particles fly from origin to the XP bar at the top of the screen
 */
export function useXPAnimation(): UseXPAnimationReturn {
  const [particles, setParticles] = useState<Particle[]>([])
  const [xpBarPosition, setXpBarPosition] = useState({ x: 0, y: 0 })

  // Update XP bar position on mount and resize
  useEffect(() => {
    const updateXPBarPosition = () => {
      // Find the XP bar element - it's in the navigation bar
      // We'll target the center-top of the screen as a fallback
      const screenWidth = window.innerWidth
      const targetX = screenWidth / 2
      const targetY = 60 // Approximate position of XP bar

      setXpBarPosition({ x: targetX, y: targetY })
    }

    updateXPBarPosition()

    const debouncedUpdate = debounce(updateXPBarPosition, 200)
    window.addEventListener('resize', debouncedUpdate)

    return () => {
      window.removeEventListener('resize', debouncedUpdate)
    }
  }, [])

  const triggerAnimation = useCallback(
    (amount: number, type: ParticleType, originX: number, originY: number) => {
      const id = `${type}-${Date.now()}-${Math.random()}`

      const newParticle: Particle = {
        id,
        amount,
        type,
        origin: { x: originX, y: originY },
        target: xpBarPosition,
      }

      setParticles((prev) => [...prev, newParticle])

      // Auto-remove particle after animation completes
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id))
      }, 4000)
    },
    [xpBarPosition]
  )

  const clearParticles = useCallback(() => {
    setParticles([])
  }, [])

  return {
    particles,
    triggerAnimation,
    clearParticles,
  }
}

// Debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
