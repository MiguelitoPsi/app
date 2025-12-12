'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Star, Zap } from 'lucide-react'
import { useTherapistGame } from '@/context/TherapistGameContext'

/**
 * TherapistXPGainToast - Toast flutuante de XP ganho para terapeutas
 *
 * Exibe notificações animadas e gamificadas quando o terapeuta ganha XP,
 * proporcionando feedback visual dopaminérgico imediato com:
 * - Entrada suave com spring physics
 * - Glow pulsante
 * - Ícones animados
 * - Saída elegante
 */
export function TherapistXPGainToast() {
  const { xpGains } = useTherapistGame()

  return (
    <div className='pointer-events-none fixed right-4 top-20 z-50 flex flex-col items-end gap-3'>
      <AnimatePresence>
        {xpGains.map((gain, index) => (
          <motion.div
            key={gain.id}
            initial={{ 
              opacity: 0, 
              x: 100, 
              scale: 0.5,
              rotate: 10,
            }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              rotate: 0,
            }}
            exit={{
              opacity: 0,
              x: 50,
              scale: 0.8,
              y: -20,
              transition: { duration: 0.3, ease: 'easeOut' },
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 20,
              delay: index * 0.1, // Stagger effect
            }}
            className='relative'
          >
            {/* Glow effect */}
            <motion.div
              className='absolute inset-0 rounded-full bg-emerald-400 blur-xl'
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Main toast */}
            <motion.div
              className='relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 px-5 py-2.5 text-white shadow-xl shadow-emerald-500/30'
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              {/* Animated icon */}
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                }}
              >
                <Sparkles className='h-5 w-5' />
              </motion.div>
              
              {/* XP amount with counter effect would be nice but keeping it simple */}
              <span className='font-bold text-base tracking-tight'>
                +{gain.amount} XP
              </span>
              
              {/* Floating stars */}
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.3,
                }}
              >
                <Star className='h-3 w-3 fill-yellow-300 text-yellow-300' />
              </motion.div>
              
              <motion.div
                className='absolute -left-2 top-0'
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  y: [0, -6, 0],
                  x: [0, -4, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: 0.5,
                }}
              >
                <Zap className='h-2.5 w-2.5 fill-yellow-200 text-yellow-200' />
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default TherapistXPGainToast
