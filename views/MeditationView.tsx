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
import { useEffect, useState } from 'react'
import { XP_REWARDS } from '@/lib/xp'
import { useGame } from '../context/GameContext'

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

  // Breathing Phase Logic
  useEffect(() => {
    if (!isActive) {
      return
    }

    const cycleLength = 12_000 // 12 seconds total cycle
    setPhase('Inspirar')
    const startTimestamp = Date.now()

    const breathInterval = setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) % cycleLength
      // Inspirar: 5s (Larger expansion)
      if (elapsed < 5000) {
        setPhase('Inspirar')
      }
      // Segurar: 3s (Hold)
      else if (elapsed < 8000) {
        setPhase('Segurar')
      }
      // Expirar: 4s (Release - slightly shorter than inhale)
      else {
        setPhase('Expirar')
      }
    }, 100)

    return () => clearInterval(breathInterval)
  }, [isActive])

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

  // Dynamic styling helpers
  const getCircleScale = () => {
    if (!isActive) {
      return 'scale-90 opacity-50'
    }
    switch (phase) {
      case 'Inspirar':
        return 'scale-[1.75]'
      case 'Segurar':
        return 'scale-[1.75]'
      case 'Expirar':
        return 'scale-90'
    }
  }

  const getCircleColor = () => {
    if (!isActive) {
      return 'bg-slate-200 dark:bg-slate-700'
    }
    switch (phase) {
      case 'Inspirar':
        return `bg-gradient-to-br ${selectedType.colorFrom} ${selectedType.colorTo} shadow-lg opacity-90`
      case 'Segurar':
        return `bg-gradient-to-br ${selectedType.colorFrom} ${selectedType.colorTo} shadow-xl saturate-150`
      case 'Expirar':
        return `bg-gradient-to-br ${selectedType.colorFrom} to-slate-300 dark:to-slate-700 opacity-80`
    }
  }

  const getDurationClass = () => {
    if (!isActive) {
      return 'duration-1000'
    }
    if (phase === 'Inspirar') {
      return 'duration-[5000ms] ease-out'
    }
    if (phase === 'Segurar') {
      return 'duration-[3000ms] linear'
    }
    return 'duration-[4000ms] ease-in-out'
  }

  return (
    <div className='relative flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950'>
      {/* Background Ambiance */}
      <div
        className={`absolute inset-0 z-0 transition-colors duration-[4000ms] ease-in-out ${
          phase === 'Inspirar' && isActive
            ? `${selectedType.bgActive}/80`
            : 'bg-slate-50 dark:bg-slate-950'
        }
        ${phase === 'Segurar' && isActive ? selectedType.bgActive : ''}
      `}
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
        {/* Text Guide */}
        <div
          className={`absolute top-0 z-50 font-black text-2xl tracking-tight transition-all duration-500 sm:text-3xl ${
            isActive
              ? `${selectedType.textColor} translate-y-0 opacity-100`
              : 'translate-y-4 text-slate-300 opacity-0 dark:text-slate-600'
          }
        `}
        >
          {phase}
        </div>

        <div className='relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72'>
          {/* Dynamic Visuals based on Type */}
          {selectedType.id === 'relax' && (
            <>
              <div
                className={`absolute inset-0 rounded-full border opacity-30 transition-all delay-300 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${
                    selectedType.colorFrom.split('-')[1]
                  }-200 dark:border-${
                    selectedType.colorFrom.split('-')[1]
                  }-800 bg-${selectedType.colorFrom.split('-')[1]}-50 dark:bg-${
                    selectedType.colorFrom.split('-')[1]
                  }-900/20`}
              />
              <div
                className={`absolute inset-4 rounded-full border opacity-40 transition-all delay-150 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${
                    selectedType.colorFrom.split('-')[1]
                  }-300 dark:border-${
                    selectedType.colorFrom.split('-')[1]
                  }-700 bg-${selectedType.colorFrom.split('-')[1]}-100 dark:bg-${
                    selectedType.colorFrom.split('-')[1]
                  }-800/20`}
              />
            </>
          )}

          {selectedType.id === 'focus' && (
            <>
              <div
                className={`absolute inset-8 rounded-3xl border-2 opacity-30 transition-all delay-300 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${selectedType.colorFrom.split('-')[1]}-400 rotate-12`}
              />
              <div
                className={`absolute inset-8 rounded-3xl border-2 opacity-40 transition-all delay-150 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${selectedType.colorFrom.split('-')[1]}-500 -rotate-12`}
              />
            </>
          )}

          {selectedType.id === 'anxiety' && (
            <>
              <div
                className={`absolute inset-12 rounded-xl border-4 opacity-30 transition-all delay-300 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${selectedType.colorFrom.split('-')[1]}-300 rotate-45`}
              />
              <div
                className={`absolute inset-12 rounded-xl border-4 opacity-40 transition-all delay-150 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}border-${selectedType.colorFrom.split('-')[1]}-400 rotate-45`}
              />
            </>
          )}

          {selectedType.id === 'sleep' && (
            <>
              <div
                className={`absolute inset-0 rounded-full opacity-20 blur-xl transition-all delay-300 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}bg-${selectedType.colorFrom.split('-')[1]}-400`}
              />
              <div
                className={`absolute inset-4 rounded-full opacity-30 blur-lg transition-all delay-150 ${
                  isActive ? getDurationClass() : 'duration-1000'
                }
                  ${getCircleScale()}bg-${selectedType.colorFrom.split('-')[1]}-500`}
              />
            </>
          )}

          {/* Main Core Shape */}
          <div
            className={`z-10 flex h-32 w-32 items-center justify-center shadow-2xl transition-all ${
              isActive ? getDurationClass() : 'duration-1000'
            }
            ${getCircleScale()}
            ${getCircleColor()}
            ${selectedType.id === 'relax' ? 'rounded-full' : ''}
            ${selectedType.id === 'focus' ? 'rotate-0 rounded-3xl' : ''}
            ${selectedType.id === 'anxiety' ? 'rotate-45 rounded-2xl' : ''}
            ${selectedType.id === 'sleep' ? 'rounded-full blur-[1px]' : ''}
            ${
              phase === 'Segurar' && isActive
                ? `ring-4 ${selectedType.ringColor} animate-pulse ring-opacity-50`
                : ''
            }
            `}
          >
            <span
              className={`font-light text-2xl text-white tracking-widest transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }
                    ${selectedType.id === 'anxiety' ? '-rotate-45' : ''}
                `}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>

            {!isActive && (
              <span
                className={`absolute font-bold text-slate-400 text-sm uppercase tracking-wider dark:text-slate-500 ${
                  selectedType.id === 'anxiety' ? '-rotate-45' : ''
                }`}
              >
                Iniciar
              </span>
            )}
          </div>
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
