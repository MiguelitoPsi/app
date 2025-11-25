'use client'

import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { XP_REWARDS } from '@/lib/xp'
import { useGame } from '../context/GameContext'

// Breathing timing configuration (in milliseconds)
const BREATH_CONFIG = {
  inhale: 4000, // 4 seconds inhale
  holdIn: 4000, // 4 seconds hold after inhale
  exhale: 6000, // 6 seconds exhale (longer for relaxation)
  holdOut: 2000, // 2 seconds hold after exhale
}

const TOTAL_CYCLE =
  BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn + BREATH_CONFIG.exhale + BREATH_CONFIG.holdOut

// Easing function for natural breathing curve (ease-in-out with custom bezier feel)
const easeBreathing = (t: number): number => {
  // Custom easing that mimics natural lung expansion
  // Slow start, faster middle, slow end - like real breathing
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

// Calculate breath progress (0 to 1 for expansion, 1 to 0 for contraction)
const getBreathValue = (elapsed: number): number => {
  const cyclePosition = elapsed % TOTAL_CYCLE

  if (cyclePosition < BREATH_CONFIG.inhale) {
    // Inhaling: 0 -> 1
    const progress = cyclePosition / BREATH_CONFIG.inhale
    return easeBreathing(progress)
  }

  if (cyclePosition < BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn) {
    // Holding after inhale: stay at 1
    return 1
  }

  if (cyclePosition < BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn + BREATH_CONFIG.exhale) {
    // Exhaling: 1 -> 0
    const exhaleStart = BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn
    const progress = (cyclePosition - exhaleStart) / BREATH_CONFIG.exhale
    return 1 - easeBreathing(progress)
  }

  // Holding after exhale: stay at 0
  return 0
}

type MeditationType = {
  id: string
  title: string
  description: string
  icon: React.ElementType
  colorFrom: string
  colorTo: string
  shadowColor: string
  ringColor: string
  textColor: string
  bgActive: string
}

const MEDITATION_TYPES: MeditationType[] = [
  {
    id: 'relax',
    title: 'Relaxamento',
    description: 'Alivie o estresse e encontre equilíbrio.',
    icon: Wind,
    colorFrom: 'from-violet-400',
    colorTo: 'to-fuchsia-400',
    shadowColor: 'shadow-violet-300',
    ringColor: 'ring-violet-300',
    textColor: 'text-violet-600 dark:text-violet-400',
    bgActive: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    id: 'focus',
    title: 'Foco Pleno',
    description: 'Aumente sua concentração e clareza.',
    icon: Brain,
    colorFrom: 'from-teal-400',
    colorTo: 'to-emerald-400',
    shadowColor: 'shadow-teal-300',
    ringColor: 'ring-teal-300',
    textColor: 'text-teal-600 dark:text-teal-400',
    bgActive: 'bg-teal-50 dark:bg-teal-900/20',
  },
  {
    id: 'sleep',
    title: 'Sono Profundo',
    description: 'Prepare sua mente para descansar.',
    icon: Moon,
    colorFrom: 'from-indigo-400',
    colorTo: 'to-blue-500',
    shadowColor: 'shadow-indigo-300',
    ringColor: 'ring-indigo-300',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    bgActive: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
]

export const MeditationView: React.FC = () => {
  const { completeMeditation, stats } = useGame()
  const [selectedType, setSelectedType] = useState<MeditationType | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60) // 1 minute default for MVP
  const [duration, setDuration] = useState(60)
  const [phase, setPhase] = useState<'Inspirar' | 'Segurar' | 'Expirar'>('Inspirar')
  const [completed, setCompleted] = useState(false)
  const [breathProgress, setBreathProgress] = useState(0) // 0 to 1 continuous value

  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      setCompleted(true)
      const minutesCompleted = Math.ceil(duration / 60)
      completeMeditation(minutesCompleted)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, completeMeditation, duration])

  // Smooth breathing animation using requestAnimationFrame
  const animateBreathing = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    const progress = getBreathValue(elapsed)
    setBreathProgress(progress)

    // Update phase text based on cycle position
    const cyclePosition = elapsed % TOTAL_CYCLE
    if (cyclePosition < BREATH_CONFIG.inhale) {
      setPhase('Inspirar')
    } else if (cyclePosition < BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn) {
      setPhase('Segurar')
    } else if (cyclePosition < BREATH_CONFIG.inhale + BREATH_CONFIG.holdIn + BREATH_CONFIG.exhale) {
      setPhase('Expirar')
    } else {
      setPhase('Segurar')
    }

    animationRef.current = requestAnimationFrame(animateBreathing)
  }, [])

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = 0
      animationRef.current = requestAnimationFrame(animateBreathing)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setBreathProgress(0)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, animateBreathing])

  const toggleTimer = () => {
    setIsActive(!isActive)
    if (!isActive && timeLeft === 0) {
      setTimeLeft(60)
      setDuration(60)
      setCompleted(false)
    }
  }

  const handleBack = () => {
    setIsActive(false)
    setTimeLeft(60)
    setSelectedType(null)
  }

  const recommendedTime = Math.min(5 + Math.floor(stats.level * 2), 20)

  // --- Render Selection Screen ---
  if (!selectedType) {
    return (
      <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
        {/* Header Section */}
        <div className='z-10 rounded-b-[1.5rem] bg-white px-4 pt-safe pb-4 shadow-sm sm:rounded-b-[2rem] sm:px-6 sm:pt-8 sm:pb-6 dark:bg-slate-900'>
          <div className='mb-2 flex items-center justify-between'>
            <div>
              <h2 className='font-black text-xl text-slate-800 tracking-tight sm:text-2xl dark:text-white'>
                Momento de Paz
              </h2>
              <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Escolha sua prática de hoje
              </p>
            </div>
            <div className='flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-teal-600 sm:h-10 sm:w-10 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-400'>
              <Wind className='sm:hidden' size={18} />
              <Wind className='hidden sm:block' size={20} />
            </div>
          </div>
        </div>

        <div className='flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28 sm:space-y-4 sm:px-6 sm:py-6 sm:pb-32'>
          {MEDITATION_TYPES.map((type, index) => {
            const Icon = type.icon
            return (
              <button
                className='group slide-in-from-bottom-4 fade-in relative w-full animate-in overflow-hidden rounded-2xl border border-slate-100 bg-white fill-mode-backwards p-1 text-left shadow-sm transition-all duration-300 active:scale-[0.98] hover:shadow-md sm:rounded-3xl sm:hover:scale-[1.02] dark:border-slate-800 dark:bg-slate-900'
                key={type.id}
                onClick={() => setSelectedType(type)}
                style={{ animationDelay: `${index * 100}ms` }}
                type='button'
              >
                <div className='relative z-10 flex items-center gap-3 p-4 sm:gap-4 sm:p-5'>
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${type.colorFrom} ${type.colorTo} flex items-center justify-center text-white shadow-md transition-transform duration-300 sm:h-14 sm:w-14 sm:rounded-2xl group-hover:scale-110`}
                  >
                    <Icon className='sm:hidden' size={22} />
                    <Icon className='hidden sm:block' size={24} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-bold text-base text-slate-800 group-hover:text-slate-900 sm:text-lg dark:text-white dark:group-hover:text-white'>
                      {type.title}
                    </h3>
                    <p className='mt-0.5 font-medium text-slate-500 text-[11px] sm:text-xs dark:text-slate-400'>
                      {type.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600 group-hover:bg-${
                      type.colorFrom.split('-')[1]
                    }-50 dark:group-hover:bg-slate-700 group-hover:text-${
                      type.colorFrom.split('-')[1]
                    }-500 transition-colors`}
                  >
                    <Sparkles size={16} />
                  </div>
                </div>
              </button>
            )
          })}

          <div className='mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 transition-colors sm:mt-6 sm:rounded-3xl sm:p-5 dark:border-violet-900/30 dark:bg-violet-900/10'>
            <div className='flex items-start gap-3 sm:gap-4'>
              <div className='shrink-0 rounded-lg bg-violet-100 p-1.5 text-violet-600 sm:rounded-xl sm:p-2 dark:bg-violet-900/30 dark:text-violet-400'>
                <Sun className='sm:hidden' size={18} />
                <Sun className='hidden sm:block' size={20} />
              </div>
              <div>
                <h4 className='font-bold text-xs text-violet-700 sm:text-sm dark:text-violet-300'>
                  Dica do dia
                </h4>
                <p className='mt-1 font-medium text-slate-600 text-[11px] leading-relaxed sm:text-xs dark:text-slate-400'>
                  Meditar por apenas{' '}
                  <span className='font-bold text-violet-600 dark:text-violet-400'>
                    {recommendedTime} minutos
                  </span>{' '}
                  pode aumentar seu XP e reduzir o estresse em até 30%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Render Active Meditation Screen ---

  // Dynamic styling helpers using continuous breathProgress
  // Scale from 0.9 (exhaled) to 1.75 (inhaled) based on breathProgress
  const getBreathScale = (delay = 0): number => {
    const delayedProgress = Math.max(0, Math.min(1, breathProgress - delay))
    const minScale = 0.9
    const maxScale = 1.75
    return minScale + delayedProgress * (maxScale - minScale)
  }

  // Get opacity based on breath progress
  const getBreathOpacity = (base: number, delay = 0): number => {
    const delayedProgress = Math.max(0, Math.min(1, breathProgress - delay))
    return base + delayedProgress * (1 - base) * 0.5
  }

  const getCircleColor = () => {
    if (!isActive) {
      return 'bg-slate-200 dark:bg-slate-700'
    }
    // Smooth color transition based on breathProgress
    const saturation = 100 + breathProgress * 50
    return (
      `bg-gradient-to-br ${selectedType.colorFrom} ${selectedType.colorTo} shadow-lg` +
      ` saturate-[${saturation}%]`
    )
  }

  // Check if currently in hold phase
  const isHoldPhase = phase === 'Segurar'

  return (
    <div className='relative flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950'>
      {/* Background Ambiance - smooth opacity transition */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${selectedType.bgActive}`}
        style={{ opacity: isActive ? breathProgress * 0.3 : 0 }}
      />

      {/* Header & Back Button */}
      <div className='relative z-20 flex items-center justify-between px-4 pt-safe pb-4 sm:px-6 sm:pt-8 sm:pb-6'>
        <button
          className={`touch-target flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition-all active:scale-95 hover:bg-slate-50 sm:h-10 sm:w-10 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 ${
            isActive ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          disabled={isActive}
          onClick={handleBack}
          type='button'
        >
          <ArrowLeft className='text-slate-500 dark:text-slate-400' size={18} />
        </button>
        <div
          className={`flex flex-col items-center ${
            isActive ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-500`}
        >
          <div className={`flex items-center gap-2 ${selectedType.textColor} mb-1 opacity-80`}>
            <selectedType.icon className='sm:hidden' size={14} />
            <selectedType.icon className='hidden sm:block' size={16} />
            <span className='font-bold text-[10px] uppercase tracking-wider sm:text-xs'>
              {selectedType.title}
            </span>
          </div>
          <h2 className='font-black text-slate-800 text-lg sm:text-xl dark:text-white'>
            Respire Fundo
          </h2>
        </div>
        <div className='w-9 sm:w-10' /> {/* Spacer for centering */}
      </div>

      {/* Breathing Animation Container */}
      <div className='relative z-10 flex flex-1 flex-col items-center justify-center pb-16 sm:pb-20'>
        {/* Text Guide with smooth fade */}
        <div
          className={`absolute top-0 z-50 font-black text-2xl tracking-tight sm:text-3xl ${selectedType.textColor}`}
          style={{
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 500ms ease, transform 500ms ease',
          }}
        >
          {phase}
        </div>

        <div className='relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72'>
          {/* Outer breathing ring - slowest response for organic wave effect */}
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              selectedType.colorFrom.includes('violet')
                ? 'border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-900/20'
                : selectedType.colorFrom.includes('teal')
                  ? 'border-teal-200 bg-teal-50/30 dark:border-teal-800 dark:bg-teal-900/20'
                  : 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-900/20'
            }`}
            style={{
              transform: `scale(${isActive ? getBreathScale(-0.1) : 0.9})`,
              opacity: isActive ? getBreathOpacity(0.2, -0.1) : 0.5,
              transition: isActive ? 'none' : 'all 1000ms ease',
            }}
          />

          {/* Middle breathing ring - medium response */}
          <div
            className={`absolute inset-4 rounded-full border ${
              selectedType.colorFrom.includes('violet')
                ? 'border-violet-300 bg-violet-100/40 dark:border-violet-700 dark:bg-violet-800/30'
                : selectedType.colorFrom.includes('teal')
                  ? 'border-teal-300 bg-teal-100/40 dark:border-teal-700 dark:bg-teal-800/30'
                  : 'border-indigo-300 bg-indigo-100/40 dark:border-indigo-700 dark:bg-indigo-800/30'
            }`}
            style={{
              transform: `scale(${isActive ? getBreathScale(-0.05) : 0.9})`,
              opacity: isActive ? getBreathOpacity(0.3, -0.05) : 0.5,
              transition: isActive ? 'none' : 'all 1000ms ease',
            }}
          />

          {/* Inner glow ring - fastest response */}
          <div
            className={`absolute inset-8 rounded-full ${
              selectedType.colorFrom.includes('violet')
                ? 'bg-violet-200/50 dark:bg-violet-700/40'
                : selectedType.colorFrom.includes('teal')
                  ? 'bg-teal-200/50 dark:bg-teal-700/40'
                  : 'bg-indigo-200/50 dark:bg-indigo-700/40'
            }`}
            style={{
              transform: `scale(${isActive ? getBreathScale(0) : 0.9})`,
              opacity: isActive ? getBreathOpacity(0.4, 0) : 0.5,
              filter: `blur(${isActive ? 8 + breathProgress * 8 : 4}px)`,
              transition: isActive ? 'none' : 'all 1000ms ease',
            }}
          />

          {/* Main Core Shape - primary breathing element */}
          <div
            className={`z-10 flex h-32 w-32 items-center justify-center shadow-2xl ${getCircleColor()}
              ${selectedType.id === 'relax' ? 'rounded-full' : ''}
              ${selectedType.id === 'focus' ? 'rounded-3xl' : ''}
              ${selectedType.id === 'sleep' ? 'rounded-full' : ''}
            `}
            style={{
              transform: `scale(${isActive ? getBreathScale(0) : 0.9})`,
              boxShadow:
                isActive && isHoldPhase
                  ? `0 0 ${20 + breathProgress * 20}px ${selectedType.colorFrom.includes('violet') ? 'rgba(167, 139, 250, 0.5)' : selectedType.colorFrom.includes('teal') ? 'rgba(94, 234, 212, 0.5)' : 'rgba(129, 140, 248, 0.5)'}`
                  : undefined,
              filter: selectedType.id === 'sleep' ? 'blur(1px)' : undefined,
              transition: isActive ? 'box-shadow 300ms ease' : 'all 1000ms ease',
            }}
          >
            {/* Timer display */}
            <span
              className='font-light text-2xl text-white tracking-widest'
              style={{
                opacity: isActive ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>

            {!isActive && (
              <span className='absolute font-bold text-slate-400 text-sm uppercase tracking-wider dark:text-slate-500'>
                Iniciar
              </span>
            )}
          </div>

          {/* Subtle pulse indicator during hold phase */}
          {isActive && isHoldPhase && (
            <div
              className={`absolute inset-0 rounded-full ${selectedType.ringColor} ring-4 ring-opacity-30`}
              style={{
                transform: `scale(${getBreathScale(0)})`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className='mt-1'>
          <button
            className={`touch-target relative z-20 flex transform items-center justify-center rounded-full p-5 shadow-xl transition-all active:scale-95 hover:scale-105 sm:p-6 ${
              isActive
                ? 'border border-slate-100 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                : `bg-gradient-to-r ${selectedType.colorFrom} ${selectedType.colorTo} text-white ${selectedType.shadowColor} dark:shadow-none`
            }
                `}
            onClick={toggleTimer}
            type='button'
          >
            {isActive ? (
              <Pause className='sm:hidden' fill='currentColor' size={28} />
            ) : (
              <Play className='ml-1 sm:hidden' fill='currentColor' size={28} />
            )}
            {isActive ? (
              <Pause className='hidden sm:block' fill='currentColor' size={32} />
            ) : (
              <Play className='ml-1 hidden sm:block' fill='currentColor' size={32} />
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {completed && (
        <div className='fade-in absolute inset-0 z-50 flex animate-in flex-col items-center justify-center bg-white/90 p-4 backdrop-blur-md duration-300 sm:p-6 dark:bg-slate-900/90'>
          <div className='zoom-in mb-6 scale-125 animate-in rounded-full bg-emerald-100 p-3 text-emerald-500 duration-300 sm:mb-8 sm:scale-150 sm:p-4 dark:bg-emerald-900/30'>
            <CheckCircle2 className='sm:hidden' size={40} />
            <CheckCircle2 className='hidden sm:block' size={48} />
          </div>
          <h3 className='mb-2 text-center font-black text-2xl text-slate-800 sm:text-3xl dark:text-white'>
            Sessão Completa!
          </h3>
          <p className='max-w-xs text-center font-medium text-slate-500 text-sm sm:text-base dark:text-slate-400'>
            Você acaba de investir no seu bem-estar mental.
          </p>

          <div className='mt-6 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[1px] sm:mt-8 sm:rounded-3xl'>
            <div className='flex flex-col items-center rounded-[15px] bg-white px-6 py-3 sm:rounded-[23px] sm:px-8 sm:py-4 dark:bg-slate-900'>
              <span className='mb-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'>
                Recompensa
              </span>
              <p className='bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text font-black text-2xl text-transparent sm:text-3xl'>
                +{XP_REWARDS.meditation} XP & Pts
              </p>
            </div>
          </div>

          <button
            className='touch-target mt-8 w-full max-w-xs rounded-xl bg-slate-900 py-3.5 font-bold text-base text-white shadow-xl transition-all active:scale-[0.98] hover:scale-[1.02] sm:mt-12 sm:rounded-2xl sm:py-4 sm:text-lg dark:bg-white dark:text-slate-900'
            onClick={() => {
              setCompleted(false)
              handleBack()
            }}
            type='button'
          >
            Voltar ao Início
          </button>
        </div>
      )}
    </div>
  )
}
