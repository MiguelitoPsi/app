'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import type { Particle } from '@/hooks/useXPAnimation'

type XPParticleProps = {
  particle: Particle
}

/**
 * XPParticle - Partícula animada de ganho de XP/Pontos
 * 
 * Usa Framer Motion para criar uma animação suave e gamificada:
 * - Aparece com scale-up + fade-in
 * - Voa em arco suave até o destino (XP bar)
 * - Pulsa e brilha durante o voo
 * - Desaparece com scale-down + fade-out
 */
export const XPParticle: React.FC<XPParticleProps> = ({ particle }) => {
  const { origin, target, amount, type } = particle

  const isXP = type === 'xp'

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: 0,
        top: 0,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ 
        x: origin.x, 
        y: origin.y, 
        opacity: 0, 
        scale: 0.3,
      }}
      animate={{ 
        x: target.x,
        y: target.y,
        opacity: [0, 1, 1, 0],
        scale: [0.3, 1.1, 1, 0.8],
      }}
      transition={{
        duration: 3.5,
        times: [0, 0.1, 0.85, 1],
        x: {
          duration: 3.5,
          ease: [0.25, 0.1, 0.25, 1], // Smooth cubic bezier
        },
        y: {
          duration: 3.5,
          ease: [0.25, 0.1, 0.25, 1], // Smooth cubic bezier - continuous motion
        },
      }}
    >
      {/* Glow effect behind */}
      <motion.div 
        className={`absolute inset-0 rounded-full blur-md ${
          isXP 
            ? 'bg-violet-400' 
            : 'bg-amber-400'
        }`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* Main particle */}
      <motion.div
        className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 font-bold text-sm shadow-xl ${
          isXP
            ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 text-white shadow-violet-500/40'
            : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-white shadow-amber-500/40'
        }`}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: '200% 100%',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Sparkle icons */}
        <motion.span 
          className="text-lg"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {isXP ? '✨' : '💎'}
        </motion.span>
        
        <span className="font-extrabold tracking-tight">
          +{amount} {isXP ? 'XP' : 'Pts'}
        </span>
        
        {/* Extra sparkle for visual interest */}
        <motion.span
          className="absolute -right-1 -top-1 text-xs"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.1, 0.5],
            y: [-2, -10, -2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.4,
            ease: "easeInOut",
          }}
        >
          ⭐
        </motion.span>
      </motion.div>
      
      {/* Trail particles */}
      <motion.div
        className={`absolute -z-10 h-2 w-2 rounded-full ${
          isXP ? 'bg-violet-300' : 'bg-amber-300'
        }`}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          opacity: [0.7, 0],
          scale: [0.8, 0.2],
          y: [0, 25],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.2,
          ease: "easeOut",
        }}
      />
      <motion.div
        className={`absolute -z-10 h-1.5 w-1.5 rounded-full ${
          isXP ? 'bg-fuchsia-300' : 'bg-orange-300'
        }`}
        style={{
          left: '30%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          opacity: [0.5, 0],
          scale: [0.6, 0.1],
          y: [0, 18],
          x: [-5, -12],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: 0.4,
          ease: "easeOut",
        }}
      />
    </motion.div>
  )
}
