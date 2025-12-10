'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { BASE64_SOUNDS } from '@/lib/sounds/sound-data'

// Tipos de som disponíveis no app
export type SoundType =
  | 'click' // Click em botões gerais
  | 'success' // Tarefa completada, ação bem sucedida
  | 'xp' // Ganhou XP
  | 'coins' // Ganhou moedas
  | 'levelUp' // Subiu de nível
  | 'achievement' // Conquistou badge/achievement
  | 'notification' // Nova notificação
  | 'error' // Erro ou ação inválida
  | 'pop' // Som de pop (abrir modal, etc)
  | 'toggle' // Toggle de switch
  | 'reward' // Resgatou recompensa
  | 'meditation' // Sons de meditação
  | 'meditationComplete' // Meditação completa
  | 'journal' // Salvou entrada no diário
  | 'mood' // Registrou humor
  | 'streak' // Streak ativada/mantida
  | 'navigation' // Navegação entre telas
  | 'delete' // Deletar item
  | 'swoosh' // Transição suave

// Volume padrão para cada tipo de som (0-1)
const DEFAULT_VOLUMES: Record<SoundType, number> = {
  click: 0.3,
  success: 0.5,
  xp: 0.5,
  coins: 0.5,
  levelUp: 0.7,
  achievement: 0.7,
  notification: 0.5,
  error: 0.4,
  pop: 0.3,
  toggle: 0.25,
  reward: 0.6,
  meditation: 0.4,
  meditationComplete: 0.6,
  journal: 0.4,
  mood: 0.4,
  streak: 0.6,
  navigation: 0.2,
  delete: 0.3,
  swoosh: 0.25,
}

// Chave para localStorage
const SOUND_ENABLED_KEY = 'nepsis-sound-enabled'
const SOUND_VOLUME_KEY = 'nepsis-sound-volume'

// Verificar se estamos no cliente
const isClient = typeof window !== 'undefined'

// Audio Context singleton para Web Audio API
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (!isClient) return null
  if (!audioContext) {
    try {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    } catch {
      console.warn('Web Audio API not supported')
      return null
    }
  }
  return audioContext
}

// Gerar sons sintéticos com Web Audio API
function playSyntheticSound(type: SoundType, volume: number, masterVolume: number) {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resumir contexto se suspenso (necessário após interação do usuário)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const finalVolume = volume * masterVolume
  const now = ctx.currentTime

  // Criar ganho
  const gainNode = ctx.createGain()
  gainNode.connect(ctx.destination)
  gainNode.gain.setValueAtTime(finalVolume, now)

  // Criar oscilador
  const osc = ctx.createOscillator()

  switch (type) {
    case 'click': {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.05)
      break
    }

    case 'success': {
      // Acorde ascendente
      const freqs = [523.25, 659.25, 783.99] // C5, E5, G5
      for (const [i, freq] of freqs.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now)
        g.gain.setValueAtTime(0, now + i * 0.08)
        g.gain.linearRampToValueAtTime(finalVolume * 0.5, now + i * 0.08 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.08)
        o.stop(now + 0.5)
      }
      return
    }

    case 'xp': {
      // Som ascendente brilhante
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.2)
      break
    }

    case 'coins': {
      // Som de moedas tilintando
      const coinFreqs = [2000, 2500, 3000]
      for (const [i, freq] of coinFreqs.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now + i * 0.06)
        g.gain.setValueAtTime(finalVolume * 0.4, now + i * 0.06)
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.1)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.06)
        o.stop(now + i * 0.06 + 0.12)
      }
      return
    }

    case 'levelUp': {
      // Fanfarra épica
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      for (const [i, freq] of notes.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'square'
        o.frequency.setValueAtTime(freq, now + i * 0.12)
        g.gain.setValueAtTime(finalVolume * 0.3, now + i * 0.12)
        g.gain.linearRampToValueAtTime(finalVolume * 0.5, now + i * 0.12 + 0.05)
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.12)
        o.stop(now + 1)
      }
      return
    }

    case 'achievement': {
      // Som de conquista épico
      const achNotes = [392, 523.25, 659.25, 783.99, 1046.5] // G4, C5, E5, G5, C6
      for (const [i, freq] of achNotes.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'triangle'
        o.frequency.setValueAtTime(freq, now + i * 0.1)
        g.gain.setValueAtTime(finalVolume * 0.4, now + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.9)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.1)
        o.stop(now + 1)
      }
      return
    }

    case 'notification': {
      // Ding-dong suave
      const o2 = ctx.createOscillator()
      const g2 = ctx.createGain()
      osc.type = 'sine'
      o2.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      o2.frequency.setValueAtTime(660, now + 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      g2.gain.setValueAtTime(finalVolume * 0.7, now + 0.15)
      g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45)
      osc.connect(gainNode)
      o2.connect(g2)
      g2.connect(ctx.destination)
      osc.start(now)
      o2.start(now + 0.15)
      osc.stop(now + 0.35)
      o2.stop(now + 0.5)
      break
    }

    case 'error': {
      // Buzz de erro
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.setValueAtTime(100, now + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.2)
      break
    }

    case 'pop': {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.1)
      break
    }

    case 'toggle': {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.setValueAtTime(800, now + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.08)
      break
    }

    case 'reward': {
      // Som mágico de recompensa
      const rewNotes = [523.25, 783.99, 1046.5, 1318.5]
      for (const [i, freq] of rewNotes.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now + i * 0.08)
        g.gain.setValueAtTime(finalVolume * 0.4, now + i * 0.08)
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.08)
        o.stop(now + 0.7)
      }
      return
    }

    case 'meditation': {
      // Tom suave de sino tibetano
      osc.type = 'sine'
      osc.frequency.setValueAtTime(528, now) // Frequência de cura
      gainNode.gain.exponentialRampToValueAtTime(finalVolume * 0.3, now + 0.5)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 2.1)
      break
    }

    case 'meditationComplete': {
      // Três tons suaves descendentes
      const medNotes = [880, 659.25, 523.25]
      for (const [i, freq] of medNotes.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now + i * 0.3)
        g.gain.setValueAtTime(finalVolume * 0.4, now + i * 0.3)
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.5)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.3)
        o.stop(now + i * 0.3 + 0.6)
      }
      return
    }

    case 'journal': {
      // Som de escrita/papel
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.2)
      break
    }

    case 'mood': {
      // Som suave de registro
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(550, now + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.2)
      break
    }

    case 'streak': {
      // Som de fogo/energia
      const streakNotes = [440, 554.37, 659.25, 880]
      for (const [i, freq] of streakNotes.entries()) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(freq, now + i * 0.05)
        g.gain.setValueAtTime(finalVolume * 0.2, now + i * 0.05)
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(now + i * 0.05)
        o.stop(now + 0.5)
      }
      return
    }

    case 'navigation': {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(500, now)
      gainNode.gain.setValueAtTime(finalVolume * 0.2, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.04)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.05)
      break
    }

    case 'delete': {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.connect(gainNode)
      osc.start(now)
      osc.stop(now + 0.2)
      break
    }

    case 'swoosh': {
      // Ruído filtrado tipo swoosh
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const noise = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2000, now)
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.15)
      filter.Q.value = 1
      noise.buffer = buffer
      gainNode.gain.setValueAtTime(finalVolume * 0.3, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      noise.connect(filter)
      filter.connect(gainNode)
      noise.start(now)
      return
    }

    default:
      return
  }
}

// Fallback para base64
function playBase64Sound(type: SoundType, volume: number, masterVolume: number) {
  if (!isClient) return

  const soundData = BASE64_SOUNDS[type]
  if (!soundData) return

  try {
    const audio = new Audio(soundData)
    audio.volume = volume * masterVolume
    audio.play().catch(() => {
      // Ignorar erros de autoplay
    })
  } catch {
    // Ignorar erros
  }
}

// Hook principal para tocar sons
export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (!isClient) return true
    const stored = localStorage.getItem(SOUND_ENABLED_KEY)
    return stored === null ? true : stored === 'true'
  })

  const [masterVolume, setMasterVolume] = useState<number>(() => {
    if (!isClient) return 0.7
    const stored = localStorage.getItem(SOUND_VOLUME_KEY)
    return stored === null ? 0.7 : Number.parseFloat(stored)
  })

  // Ref para evitar tocar múltiplos sons ao mesmo tempo
  const lastPlayedRef = useRef<{ [key: string]: number }>({})

  // Inicializar Audio Context na primeira interação
  useEffect(() => {
    const initAudio = () => {
      getAudioContext()
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio)
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
  }, [])

  // Persistir configurações
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled))
    }
  }, [soundEnabled])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(SOUND_VOLUME_KEY, String(masterVolume))
    }
  }, [masterVolume])

  // Função principal para tocar som
  const playSound = useCallback(
    (soundType: SoundType, options?: { volume?: number; debounce?: number }) => {
      if (!(isClient && soundEnabled)) return

      const debounceMs = options?.debounce ?? 50
      const now = Date.now()
      const lastPlayed = lastPlayedRef.current[soundType] || 0

      // Debounce para evitar sons repetidos muito rápidos
      if (now - lastPlayed < debounceMs) return
      lastPlayedRef.current[soundType] = now

      const volume = options?.volume ?? DEFAULT_VOLUMES[soundType]

      // Tentar Web Audio API primeiro, fallback para base64
      try {
        playSyntheticSound(soundType, volume, masterVolume)
      } catch {
        playBase64Sound(soundType, volume, masterVolume)
      }
    },
    [soundEnabled, masterVolume]
  )

  // Helpers para sons específicos
  const playClick = useCallback(() => playSound('click'), [playSound])
  const playSuccess = useCallback(() => playSound('success'), [playSound])
  const playXP = useCallback(() => playSound('xp'), [playSound])
  const playCoins = useCallback(() => playSound('coins'), [playSound])
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound])
  const playAchievement = useCallback(() => playSound('achievement'), [playSound])
  const playNotification = useCallback(() => playSound('notification'), [playSound])
  const playError = useCallback(() => playSound('error'), [playSound])
  const playPop = useCallback(() => playSound('pop'), [playSound])
  const playToggle = useCallback(() => playSound('toggle'), [playSound])
  const playReward = useCallback(() => playSound('reward'), [playSound])
  const playMeditation = useCallback(() => playSound('meditation'), [playSound])
  const playMeditationComplete = useCallback(() => playSound('meditationComplete'), [playSound])
  const playJournal = useCallback(() => playSound('journal'), [playSound])
  const playMood = useCallback(() => playSound('mood'), [playSound])
  const playStreak = useCallback(() => playSound('streak'), [playSound])
  const playNavigation = useCallback(() => playSound('navigation'), [playSound])
  const playDelete = useCallback(() => playSound('delete'), [playSound])
  const playSwoosh = useCallback(() => playSound('swoosh'), [playSound])

  // Toggle som on/off
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev)
  }, [])

  return {
    // Estado
    soundEnabled,
    masterVolume,

    // Setters
    setSoundEnabled,
    setMasterVolume,
    toggleSound,

    // Função genérica
    playSound,

    // Helpers específicos
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

// Context para compartilhar estado de som globalmente
export type SoundContextType = {
  soundEnabled: boolean
  masterVolume: number
  setSoundEnabled: (enabled: boolean) => void
  setMasterVolume: (volume: number) => void
  toggleSound: () => void
  playSound: (soundType: SoundType, options?: { volume?: number; debounce?: number }) => void
  playClick: () => void
  playSuccess: () => void
  playXP: () => void
  playCoins: () => void
  playLevelUp: () => void
  playAchievement: () => void
  playNotification: () => void
  playError: () => void
  playPop: () => void
  playToggle: () => void
  playReward: () => void
  playMeditation: () => void
  playMeditationComplete: () => void
  playJournal: () => void
  playMood: () => void
  playStreak: () => void
  playNavigation: () => void
  playDelete: () => void
  playSwoosh: () => void
}

export const SoundContext = createContext<SoundContextType | undefined>(undefined)

// Hook para usar o contexto
export function useSoundContext() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider')
  }
  return context
}
