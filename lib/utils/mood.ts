import type { Mood } from '@/types'

export const moodTranslations: Record<Mood, string> = {
  happy: 'Feliz',
  excited: 'Animado',
  grateful: 'Grato',
  calm: 'Calmo',
  neutral: 'Neutro',
  tired: 'Cansado',
  bored: 'Entediado',
  sad: 'Triste',
  anxious: 'Ansioso',
  fearful: 'Com Medo',
  angry: 'Bravo',
  disgusted: 'Enojado',
}

export const translateMood = (mood: string | null | undefined): string => {
  if (!mood) return ''
  const m = mood.toLowerCase() as Mood
  return moodTranslations[m] || mood
}
