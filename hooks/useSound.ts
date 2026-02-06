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
  const playClick = useCallback(() => {
    /* disabled */
  }, [])
  const playSuccess = useCallback(() => {
    /* disabled */
  }, [])
  const playXP = useCallback(() => {
    /* disabled */
  }, [])
  const playCoins = useCallback(() => {
    /* disabled */
  }, [])
  const playLevelUp = useCallback(() => {
    /* disabled */
  }, [])
  const playAchievement = useCallback(() => {
    /* disabled */
  }, [])
  const playNotification = useCallback(() => {
    /* disabled */
  }, [])
  const playError = useCallback(() => {
    /* disabled */
  }, [])
  const playPop = useCallback(() => {
    /* disabled */
  }, [])
  const playToggle = useCallback(() => {
    /* disabled */
  }, [])
  const playReward = useCallback(() => {
    /* disabled */
  }, [])
  const playMeditation = useCallback(() => {
    /* disabled */
  }, [])
  const playMeditationComplete = useCallback(() => {
    /* disabled */
  }, [])
  const playJournal = useCallback(() => {
    /* disabled */
  }, [])
  const playMood = useCallback(() => {
    /* disabled */
  }, [])
  const playStreak = useCallback(() => {
    /* disabled */
  }, [])
  const playNavigation = useCallback(() => {
    /* disabled */
  }, [])
  const playDelete = useCallback(() => {
    /* disabled */
  }, [])
  const playSwoosh = useCallback(() => {
    /* disabled */
  }, [])

  const toggleSound = useCallback(() => {
    /* disabled */
  }, [])

  return {
    soundEnabled,
    masterVolume,
    setSoundEnabled: () => {
      /* disabled */
    },
    setMasterVolume: () => {
      /* disabled */
    },
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
