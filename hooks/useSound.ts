'use client'

import { createContext, useCallback, useContext, useState } from 'react'

// Tipos de som disponíveis no app (mantidos para compatibilidade)
export type SoundType =
  | 'click'
  | 'success'
  | 'xp'
  | 'coins'
  | 'levelUp'
  | 'achievement'
  | 'notification'
  | 'error'
  | 'pop'
  | 'toggle'
  | 'reward'
  | 'meditation'
  | 'meditationComplete'
  | 'journal'
  | 'mood'
  | 'streak'
  | 'navigation'
  | 'delete'
  | 'swoosh'

// Hook principal (agora desativado)
export function useSound() {
  const [soundEnabled] = useState(false)
  const [masterVolume] = useState(0)

  const playSound = useCallback(() => {
    // Som desativado permanentemente
  }, [])

  // Helpers (no-ops)
  const playClick = useCallback(() => {}, [])
  const playSuccess = useCallback(() => {}, [])
  const playXP = useCallback(() => {}, [])
  const playCoins = useCallback(() => {}, [])
  const playLevelUp = useCallback(() => {}, [])
  const playAchievement = useCallback(() => {}, [])
  const playNotification = useCallback(() => {}, [])
  const playError = useCallback(() => {}, [])
  const playPop = useCallback(() => {}, [])
  const playToggle = useCallback(() => {}, [])
  const playReward = useCallback(() => {}, [])
  const playMeditation = useCallback(() => {}, [])
  const playMeditationComplete = useCallback(() => {}, [])
  const playJournal = useCallback(() => {}, [])
  const playMood = useCallback(() => {}, [])
  const playStreak = useCallback(() => {}, [])
  const playNavigation = useCallback(() => {}, [])
  const playDelete = useCallback(() => {}, [])
  const playSwoosh = useCallback(() => {}, [])

  const toggleSound = useCallback(() => {}, [])

  return {
    soundEnabled,
    masterVolume,
    setSoundEnabled: () => {},
    setMasterVolume: () => {},
    toggleSound,
    playSound,
    playClick,
    playSuccess,
    playXP,
    playCoins,
    playLevelUp,
    playAchievement,
    playNotification,
    playError,
    playPop,
    playToggle,
    playReward,
    playMeditation,
    playMeditationComplete,
    playJournal,
    playMood,
    playStreak,
    playNavigation,
    playDelete,
    playSwoosh,
  }
}

// Context
export type SoundContextType = ReturnType<typeof useSound>

export const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function useSoundContext() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider')
  }
  return context
}
