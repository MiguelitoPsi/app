import Image from 'next/image'
import type { Mood } from '@/lib/constants'

type AvatarOficialProps = {
  mood?: Mood
  size?: 'sm' | 'md' | 'lg'
}

// Subset of moods with specific images
const moodImages: Partial<Record<Mood, string>> = {
  happy: '/mascote/feliz.png',
  calm: '/mascote/calmo.png',
  neutral: '/mascote/calmo.png',
  sad: '/mascote/triste.png',
  anxious: '/mascote/ansioso.png',
  angry: '/mascote/raiva.png',
}

// Fallback image for moods without specific visuals
const defaultMoodImage = '/mascote/calmo.png'

// Gradientes de cor para cada emoção (with fallback for unsupported moods)
const moodGradients: Partial<Record<Mood, string>> = {
  happy: 'from-yellow-300 via-amber-400 to-yellow-500',
  calm: 'from-green-400 via-emerald-500 to-green-600',
  neutral: 'from-slate-400 via-gray-500 to-slate-600',
  sad: 'from-blue-400 via-sky-500 to-blue-600',
  anxious: 'from-purple-400 via-violet-500 to-purple-600',
  angry: 'from-red-400 via-rose-500 to-red-600',
}
const defaultGradient = 'from-slate-400 via-gray-500 to-slate-600'

// Cores de glow/aura para cada emoção (with fallback for unsupported moods)
const moodGlowColors: Partial<Record<Mood, string>> = {
  happy: '251, 191, 36', // amber
  calm: '34, 197, 94', // green
  neutral: '148, 163, 184', // slate
  sad: '56, 189, 248', // sky
  anxious: '167, 139, 250', // violet
  angry: '251, 113, 133', // rose
}
const defaultGlowColor = '148, 163, 184' // slate

const sizeConfig = {
  sm: {
    container: 'h-24 w-24',
    ball: 'h-16 w-16',
    image: 64,
    imageClass: 'h-14 w-14',
    offset: 'top-2',
  },
  md: {
    container: 'h-36 w-36',
    ball: 'h-24 w-24',
    image: 96,
    imageClass: 'h-20 w-20',
    offset: 'top-2',
  },
  lg: {
    container: 'h-48 w-48',
    ball: 'h-32 w-32',
    image: 128,
    imageClass: 'h-28 w-28',
    offset: 'top-2',
  },
}

export default function AvatarOficial({ mood = 'calm', size = 'lg' }: AvatarOficialProps) {
  const imageSrc = moodImages[mood] || defaultMoodImage
  const gradient = moodGradients[mood] || defaultGradient
  const glowColor = moodGlowColors[mood] || defaultGlowColor
  const config = sizeConfig[size]

  return (
    <div className={`relative flex flex-col items-center justify-end ${config.container}`}>
      {/* Camaleão */}
      <div className={`absolute  ${config.offset} z-10`}>
        <Image
          alt={`Mascote ${mood}`}
          className={`${config.imageClass} drop-shadow-lg transition-all duration-300`}
          height={config.image}
          priority
          src={imageSrc}
          width={config.image}
        />
      </div>

      {/* Aura externa pulsante */}
      <div
        className={`absolute ${config.ball} rounded-full animate-pulse opacity-40 blur-xl`}
        style={{
          background: `radial-gradient(circle, rgba(${glowColor}, 0.8) 0%, rgba(${glowColor}, 0) 70%)`,
          transform: 'scale(1.5)',
        }}
      />

      {/* Aura média */}
      <div
        className={`absolute ${config.ball} rounded-full opacity-50 blur-md`}
        style={{
          background: `radial-gradient(circle, rgba(${glowColor}, 0.6) 0%, rgba(${glowColor}, 0) 60%)`,
          transform: 'scale(1.3)',
        }}
      />

      {/* Bola 3D com gradiente e iluminação */}
      <div
        className={`${config.ball} relative rounded-full bg-gradient-to-br ${gradient} transition-all duration-500`}
        style={{
          boxShadow: `
            inset -8px -10px 25px rgba(0,0,0,0.35),
            inset 8px 10px 25px rgba(255,255,255,0.4),
            inset -2px -3px 10px rgba(0,0,0,0.2),
            0 0 20px rgba(${glowColor}, 0.5),
            0 0 40px rgba(${glowColor}, 0.3),
            0 8px 20px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Reflexo de luz superior (highlight) */}
        <div
          className='absolute rounded-full bg-gradient-to-br from-white/60 via-white/20 to-transparent'
          style={{
            width: '45%',
            height: '35%',
            top: '8%',
            left: '15%',
            filter: 'blur(2px)',
          }}
        />
        {/* Reflexo secundário menor */}
        <div
          className='absolute rounded-full bg-white/30'
          style={{
            width: '15%',
            height: '10%',
            top: '50%',
            left: '60%',
            filter: 'blur(3px)',
          }}
        />
      </div>
    </div>
  )
}
