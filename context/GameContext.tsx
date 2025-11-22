'use client'

import type React from 'react'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import type {
  AvatarConfig,
  BadgeDefinition,
  BadgeUnlock,
  GameContextType,
  JournalEntry,
  Mood,
  Reward,
  RewardCategory,
  Task,
  UserStats,
} from '../types'

const GameContext = createContext<GameContextType | undefined>(undefined)

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // { id: 'start', name: 'Primeiro Passo', description: 'Iniciou a jornada', icon: '🌱', requirement: 0, metric: 'auto' },
  {
    id: 'apprentice',
    name: 'Aprendiz',
    description: 'Completou o tutorial básico',
    icon: '🎓',
    requirement: 1,
    metric: 'tutorialCompleted',
  },
  {
    id: 'zen_master',
    name: 'Mestre Zen',
    description: '20 min de meditação',
    icon: '🧘',
    requirement: 20,
    metric: 'totalMeditationMinutes',
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    description: '7 dias de ofensiva',
    icon: '⚔️',
    requirement: 7,
    metric: 'streak',
  },
  {
    id: 'analyst',
    name: 'Analista',
    description: '5 Diários criados',
    icon: '🧠',
    requirement: 5,
    metric: 'totalJournals',
  },
  {
    id: 'doer',
    name: 'Realizador',
    description: '10 Tarefas concluídas',
    icon: '✅',
    requirement: 10,
    metric: 'totalTasksCompleted',
  },
]

export const RANKS = [
  { level: 1, name: 'Iniciado', minXp: 0, description: 'O começo da jornada de autoconhecimento.' },
  {
    level: 2,
    name: 'Guerreiro da Mente',
    minXp: 100,
    description: 'Enfrentando os primeiros desafios emocionais.',
  },
  {
    level: 3,
    name: 'Aprendiz da Calma',
    minXp: 200,
    description: 'Descobrindo o poder da respiração consciente.',
  },
  {
    level: 4,
    name: 'Guardião do Foco',
    minXp: 300,
    description: 'Mantendo a atenção no momento presente.',
  },
  {
    level: 5,
    name: 'Mestre das Emoções',
    minXp: 400,
    description: 'Navegando com sabedoria pelas ondas dos sentimentos.',
  },
  {
    level: 6,
    name: 'Sábio Interior',
    minXp: 500,
    description: 'Conexão profunda com o eu verdadeiro.',
  },
  {
    level: 7,
    name: 'Iluminado',
    minXp: 600,
    description: 'Estado de fluxo e aceitação plena da realidade.',
  },
]

const INITIAL_STATS: UserStats = {
  name: 'Miguel',
  xp: 0,
  level: 1,
  points: 0,
  streak: 0,
  badges: [],
  totalMeditationMinutes: 0,
  dailyMeditationCount: 0,
  lastMeditationDate: 0,
  totalTasksCompleted: 0,
  totalJournals: 0,
  tutorialCompleted: false,
  lastMoodXPTimestamp: 0,
  theme: 'light',
  avatarConfig: {
    accessory: 'none',
    shirtColor: 'bg-slate-800',
  },
  rewards: [],
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS)

  // Initialize with Today's timestamp (midnight)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [tasks, setTasks] = useState<Task[]>([])

  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [currentMood, setCurrentMood] = useState<Mood>('calm')

  // Badge Checking Logic
  useEffect(() => {
    const newBadges: BadgeUnlock[] = []
    const now = Date.now()

    for (const badge of BADGE_DEFINITIONS) {
      const isAlreadyUnlocked = stats.badges.some((b) => b.id === badge.id)
      if (isAlreadyUnlocked) {
        continue
      }

      let unlocked = false
      if (badge.metric === 'auto') {
        unlocked = true
      } else {
        const metricKey = badge.metric as keyof UserStats
        const userValue =
          typeof stats[metricKey] === 'boolean'
            ? stats[metricKey]
              ? 1
              : 0
            : (stats[metricKey] as number)

        if (userValue >= badge.requirement) {
          unlocked = true
        }
      }

      if (unlocked) {
        newBadges.push({ id: badge.id, date: now })
      }
    }

    if (newBadges.length > 0) {
      setStats((prev) => ({
        ...prev,
        badges: [...prev.badges, ...newBadges],
        xp: prev.xp + newBadges.length * 100, // Bonus XP for badges
      }))
    }
  }, [
    stats.totalMeditationMinutes,
    stats.totalTasksCompleted,
    stats.totalJournals,
    stats.streak,
    stats.tutorialCompleted,
    stats.badges,
  ])

  // Tutorial Completion Logic
  useEffect(() => {
    if (!stats.tutorialCompleted) {
      const hasMeditated = stats.totalMeditationMinutes > 0
      const hasJournaled = stats.totalJournals > 0
      const hasTask = stats.totalTasksCompleted > 0

      if (hasMeditated && hasJournaled && hasTask) {
        setStats((prev) => ({ ...prev, tutorialCompleted: true }))
      }
    }
  }, [
    stats.totalMeditationMinutes,
    stats.totalJournals,
    stats.totalTasksCompleted,
    stats.tutorialCompleted,
  ])

  const addXP = (amount: number) => {
    setStats((prev) => {
      const newXP = prev.xp + amount
      const newLevel = Math.floor(newXP / 100) + 1
      return { ...prev, xp: newXP, level: newLevel }
    })
  }

  const addPoints = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + amount,
    }))
  }

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isCompleting = !t.completed
          if (isCompleting) {
            // Dynamic XP based on Priority
            let xpReward = 10
            let pointsReward = 10 // Base points

            if (t.priority === 'medium') {
              xpReward = 20
              pointsReward = 20
            }
            if (t.priority === 'high') {
              xpReward = 30
              pointsReward = 40 // High priority gives significant points
            }

            addXP(xpReward)
            addPoints(pointsReward)
            setStats((s) => ({ ...s, totalTasksCompleted: s.totalTasksCompleted + 1 }))
          }
          return { ...t, completed: !t.completed }
        }
        return t
      })
    )
  }

  const addTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      ...taskData,
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const addJournalEntry = (entryData: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...entryData,
    }
    setJournal((prev) => [newEntry, ...prev])
    addXP(50) // Significant XP for journaling
    addPoints(50) // Significant Points for journaling
    setStats((s) => ({ ...s, totalJournals: s.totalJournals + 1 }))
  }

  const setMood = (mood: Mood) => {
    setCurrentMood(mood)

    const now = Date.now()
    const lastXP = stats.lastMoodXPTimestamp || 0
    const COOLDOWN = 60 * 60 * 1000 // 1 Hour Cooldown

    if (now - lastXP >= COOLDOWN) {
      setStats((prev) => {
        const amount = 20
        const newXP = prev.xp + amount
        const newLevel = Math.floor(newXP / 100) + 1
        return {
          ...prev,
          xp: newXP,
          level: newLevel,
          lastMoodXPTimestamp: now,
        }
      })
    }
  }

  const completeMeditation = (minutes: number) => {
    setStats((prev) => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const lastMedDate = new Date(prev.lastMeditationDate || 0)
      const lastMedStart = new Date(
        lastMedDate.getFullYear(),
        lastMedDate.getMonth(),
        lastMedDate.getDate()
      ).getTime()

      let newDailyCount = prev.dailyMeditationCount

      // Reset count if new day
      if (todayStart > lastMedStart) {
        newDailyCount = 0
      }

      let xpToAdd = 0
      let pointsToAdd = 0

      // Only award if count < 3
      if (newDailyCount < 3) {
        xpToAdd = 50
        pointsToAdd = 30 // Points for meditation
        newDailyCount++
      }

      return {
        ...prev,
        xp: prev.xp + xpToAdd,
        points: prev.points + pointsToAdd,
        totalMeditationMinutes: prev.totalMeditationMinutes + minutes,
        dailyMeditationCount: newDailyCount,
        lastMeditationDate: Date.now(),
      }
    })
  }

  const updateAvatarConfig = (config: AvatarConfig) => {
    setStats((prev) => ({
      ...prev,
      avatarConfig: config,
    }))
  }

  const toggleTheme = () => {
    setStats((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }))
  }

  const addRewardRequest = (title: string, category: RewardCategory) => {
    // Limit active rewards to prevent spam
    if (stats.rewards.length >= 20) {
      return
    }

    const newReward: Reward = {
      id: Date.now().toString(),
      title,
      category,
      cost: 0,
      status: 'pending',
      createdAt: Date.now(),
    }

    setStats((prev) => ({
      ...prev,
      rewards: [newReward, ...prev.rewards],
    }))
  }

  const redeemReward = (id: string) => {
    setStats((prev) => {
      const reward = prev.rewards.find((r) => r.id === id)
      if (!reward || reward.status !== 'approved' || prev.points < reward.cost) {
        return prev
      }

      return {
        ...prev,
        points: prev.points - reward.cost,
        rewards: prev.rewards.map((r) => (r.id === id ? { ...r, status: 'redeemed' as const } : r)),
      }
    })
  }

  const deleteReward = (id: string) => {
    setStats((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((r) => r.id !== id),
    }))
  }

  const updateReward = (id: string, updates: Partial<Reward>) => {
    setStats((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  }

  return (
    <GameContext.Provider
      value={{
        stats,
        tasks,
        journal,
        currentMood,
        allBadges: BADGE_DEFINITIONS,
        addXP,
        addPoints,
        toggleTask,
        addTask,
        deleteTask,
        addJournalEntry,
        setMood,
        completeMeditation,
        updateAvatarConfig,
        toggleTheme,
        addRewardRequest,
        redeemReward,
        deleteReward,
        updateReward,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
