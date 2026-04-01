'use client'

import { RiMoonLine as Moon, RiSparklingLine } from '@remixicon/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useRef } from 'react'
import { RANKS, useGame } from '@/context/GameContext'

// Mood → Hue mapping (base: hsl(H, 15%, 69%) — only H changes)
const MOOD_MAP = [
  { key: 'raiva', mascot: '/mascote/raiva.png', hue: 0, range: [1, 2] },
  { key: 'triste', mascot: '/mascote/triste.png', hue: 220, range: [3, 4] },
  { key: 'ansioso', mascot: '/mascote/ansioso.png', hue: 35, range: [5, 6] },
  { key: 'calmo', mascot: '/mascote/calmo.png', hue: 107, range: [7, 8] },
  { key: 'feliz', mascot: '/mascote/feliz.png', hue: 55, range: [9, 10] },
] as const

function getMoodFromScore(score: number) {
  return MOOD_MAP.find((m) => score >= m.range[0] && score <= m.range[1]) ?? MOOD_MAP[3]
}

// Mock data for cards
const MOCK_STATS = {
  journalEntries: 12,
  meditationMinutes: 45,
  tasksCompleted: 8,
  currentStreak: 5,
  weeklyMoodAvg: 7,
  sleepHours: '7h 30m',
}

export default function HomeMain() {
  const _router = useRouter()
  const { stats } = useGame()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mood-based theming (only H changes in hsl)
  const mood = useMemo(() => getMoodFromScore(MOCK_STATS.weeklyMoodAvg), [])

  const hue = mood.hue
  const moodColor = `hsl(${hue}, 30%, 69%)`
  const moodGradFrom = `hsl(${hue}, 21%, 46%)`
  const moodGradTo = `hsl(${hue}, 27%, 60%)`

  // Calculate current rank
  const currentRank = useMemo(() => {
    const rank = [...RANKS].reverse().find((r) => stats.level >= r.level)
    return rank ?? RANKS[0]
  }, [stats.level])

  // Calculate XP progress
  const nextRank = RANKS.find((r) => r.level === stats.level + 1)
  const currentRankThreshold = currentRank?.xpRequired ?? 0
  const nextRankThreshold = nextRank?.xpRequired ?? currentRankThreshold + 100
  const xpInCurrentLevel = stats.xp - currentRankThreshold
  const xpNeededForNextLevel = nextRankThreshold - currentRankThreshold
  const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))

  // Greeting based on time of day
  const _greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const _firstName = stats.name ? stats.name.split(' ')[0] : ''

  return (
    <div
      className='h-full overflow-y-auto overscroll-contain scroll-smooth'
      ref={scrollRef}
      style={{ backgroundColor: moodColor }}
    >
      {/* Hero */}
      <div className='relative bg-white px-6 pb-0 pt-10'>
        {/* Moon icon */}
        <div className='absolute left-6 top-6'>
          <Moon className='h-5 w-5 text-[#8a7e6b]/50' />
        </div>

        {/* Time Display */}
        <p className='mb-8 text-center text-5xl font-bold tracking-tight text-[#5a5243]'>
          {new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          <span className='ml-2 text-base font-medium uppercase tracking-wide text-[#8a7e6b]/70'>
            {new Date().getHours() >= 12 ? 'PM' : 'AM'}
          </span>
        </p>

        {/* Mascot + Green Ground */}
        <div className='relative w-full pb-8'>
          {/* Green ground — curved hill */}
          <div
            className='absolute bottom-0 left-[-20%] right-[-20%] top-[50%]'
            style={{ borderRadius: '50% 50% 0 0', backgroundColor: moodColor }}
          />

          {/* Mascot floating above the ground */}
          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className='relative z-10 flex justify-center'
            initial={{ y: 10, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
          >
            <div className='relative h-48 w-48'>
              <Image
                alt='Mascote Nepsis'
                className='object-contain'
                fill
                priority
                quality={100}
                src={mood.mascot}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Green bottom section with level + XP */}
      <div className='px-6 pb-6' style={{ backgroundColor: moodColor }}>
        {/* Level Badge */}
        <motion.div
          animate={{ scale: 1, opacity: 1 }}
          className='mb-3 flex flex-col items-center'
          initial={{ scale: 0.8, opacity: 0 }}
          transition={{
            delay: 0.4,
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
        >
          <span className='text-2xl font-extrabold text-white'>Lv.{stats.level}</span>
        </motion.div>

        {/* XP Progress Bar */}
        <div className='mx-auto w-full max-w-[260px]'>
          <div className='mb-1 flex items-center justify-between text-[10px] font-semibold text-white/70'>
            <span>Sua Experiência</span>
            <span>+{xpInCurrentLevel} XP</span>
          </div>
          <div className='relative h-3 w-full overflow-hidden rounded-full bg-white/15'>
            <motion.div
              animate={{ width: `${xpProgress}%` }}
              className='absolute inset-y-0 left-0 rounded-full'
              initial={{ width: 0 }}
              style={{
                background: `linear-gradient(to right, ${moodGradFrom}, ${moodGradTo})`,
              }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className='mt-1 text-center text-[10px] font-medium text-white/50'>
            {xpInCurrentLevel}/{xpNeededForNextLevel} XP
          </p>
        </div>
      </div>

      {/* Content below hero */}
      <div className='flex flex-col gap-5 px-4 py-6' style={{ backgroundColor: moodColor }}>
        {/* Tip */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-center text-xs font-medium text-[#8a7e6b]'
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7 }}
        >
          <RiSparklingLine className='mr-1 inline h-3.5 w-3.5' style={{ color: moodColor }} />
          Quanto mais você cuidar de si, mais você evolui.
        </motion.p>

        {/* Quick Actions Grid */}

        {/* Stats Overview */}

        {/* Weekly Summary Card */}
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className='overflow-hidden rounded-2xl border bg-white/80 shadow-sm'
          initial={{ opacity: 0, y: 20 }}
          style={{ borderColor: `hsla(${hue}, 15%, 69%, 0.2)` }}
          transition={{ delay: 1.1 }}
        >
          <div className='p-4' style={{ backgroundColor: moodColor }}>
            <h3 className='text-sm font-bold text-white'>Resumo Semanal</h3>
            <p className='mt-0.5 text-[10px] text-white/70'>Seu desempenho dos últimos 7 dias</p>
          </div>
          <div
            className='grid grid-cols-3 divide-x'
            style={
              {
                '--tw-divide-color': `hsla(${hue}, 15%, 69%, 0.1)`,
              } as React.CSSProperties
            }
          >
            <div className='flex flex-col items-center py-4'>
              <span className='text-lg font-extrabold text-[#5a5243]'>
                {MOCK_STATS.weeklyMoodAvg}
              </span>
              <span className='text-[10px] font-medium text-[#8a7e6b]'>Humor Médio</span>
            </div>
            <div className='flex flex-col items-center py-4'>
              <span className='text-lg font-extrabold text-[#5a5243]'>{MOCK_STATS.sleepHours}</span>
              <span className='text-[10px] font-medium text-[#8a7e6b]'>Sono Médio</span>
            </div>
            <div className='flex flex-col items-center py-4'>
              <span className='text-lg font-extrabold text-[#5a5243]'>
                {MOCK_STATS.currentStreak}
              </span>
              <span className='text-[10px] font-medium text-[#8a7e6b]'>Dias Seguidos</span>
            </div>
          </div>
        </motion.section>

        {/* Bottom spacer */}
        <div className='h-4' />
      </div>
    </div>
  )
}
