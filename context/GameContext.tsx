'use client'

import type React from 'react'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { BADGE_DEFINITIONS } from '@/lib/constants'
import { trpc } from '@/lib/trpc/client'
import type {
  AvatarConfig,
  GameContextType,
  Mood,
  RewardCategory,
  UrgentTask,
  UserStats,
} from '../types'

const GameContext = createContext<GameContextType | undefined>(undefined)

export const RANKS = [
  { level: 1, name: 'Primeiro Passo', xpRequired: 0, description: 'O começo de uma grande jornada.' },
  { level: 2, name: 'Observador de Si', xpRequired: 300, description: 'Aprendendo os fundamentos.' },
  { level: 3, name: 'Cultivador da Clareza', xpRequired: 700, description: 'Descobrindo novos horizontes.' },
  { level: 4, name: 'Construtor de Hábitos', xpRequired: 1200, description: 'Enfrentando desafios maiores.' },
  { level: 5, name: 'Navegador Emocional', xpRequired: 1800, description: 'Experiência acumulada.' },
  { level: 6, name: 'Praticante da Presença', xpRequired: 2500, description: 'Domínio sobre a mente.' },
  { level: 7, name: 'Artífice da Mente', xpRequired: 3300, description: 'Um exemplo para todos.' },
  { level: 8, name: 'Alinhado ao Propósito', xpRequired: 4200, description: 'Enxergando além.' },
  { level: 9, name: 'Integrado', xpRequired: 5200, description: 'Além dos limites.' },
  { level: 10, name: 'Consciência Plena', xpRequired: 6500, description: 'O auge da evolução.' },
]

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const utils = trpc.useUtils()

  // Fetch user profile - core data, refresh less often
  const { data: userProfile } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  })

  // Fetch tasks - can change frequently
  const { data: tasksData = [], refetch: refetchTasks } = trpc.task.getAll.useQuery(undefined, {
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false,
  })

  // Fetch tasks from therapist (for patients)
  const { data: therapistTasksData = [] } = trpc.task.getMyTasksFromTherapist.useQuery(undefined, {
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false,
  })

  // Transfer overdue tasks mutation
  const transferOverdueMutation = trpc.task.transferOverdueTasks.useMutation({
    onSuccess: (result) => {
      if (result.transferredCount > 0) {
        // Refresh tasks after transfer
        refetchTasks()
      }
      // Update urgent tasks from the result
      if (result.urgentTasks.length > 0) {
        setUrgentOverdueTasks(
          result.urgentTasks.map((t) => ({
            ...t,
            originalDueDate: t.originalDueDate ? new Date(t.originalDueDate) : null,
          }))
        )
      }
    },
  })

  // State for urgent overdue tasks (2+ days)
  const [urgentOverdueTasks, setUrgentOverdueTasks] = useState<UrgentTask[]>([])
  const [hasTransferredToday, setHasTransferredToday] = useState(false)

  // Transfer overdue tasks on mount (once per day)
  useEffect(() => {
    if (!hasTransferredToday && tasksData.length > 0) {
      const lastTransferDate = localStorage.getItem('lastTaskTransferDate')
      const today = new Date().toDateString()

      if (lastTransferDate !== today) {
        transferOverdueMutation.mutate()
        localStorage.setItem('lastTaskTransferDate', today)
        setHasTransferredToday(true)
      }
    }
  }, [hasTransferredToday, tasksData.length, transferOverdueMutation])

  // Fetch journal entries - rarely changes
  const { data: journalData = [] } = trpc.journal.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  })

  // Fetch latest mood from moodHistory - used for currentMood
  const { data: latestMood } = trpc.user.getLatestMood.useQuery(undefined, {
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: false,
  })

  // Fetch badges - rarely changes
  const { data: badgesData = [] } = trpc.badge.getAll.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
  })

  // Fetch rewards - can change with purchases
  const { data: rewardsData = [] } = trpc.reward.getAll.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  })

  // Convert user profile to UserStats format
  const stats: UserStats = useMemo(() => {
    if (!userProfile) {
      return {
        name: '',
        xp: 0,
        level: 1,
        points: 0,
        streak: 0,
        longestStreak: 0,
        badges: [],
        avatarConfig: { accessory: 'none', shirtColor: 'bg-blue-500' },
        theme: 'light',
        totalMeditationMinutes: 0,
        dailyMeditationCount: 0,
        lastMeditationDate: 0,
        totalTasksCompleted: 0,
        totalJournals: 0,
        tutorialCompleted: false,
        lastMoodXPTimestamp: undefined,
        rewards: [],
        completedTasksHigh: 0,
        completedTasksMedium: 0,
        completedTasksLow: 0,
        totalMoodLogs: 0,
        redeemedRewards: 0,
        engagement: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
      }
    }

    const avatarConfig = (userProfile.preferences as Record<string, unknown> | null)
      ?.avatar_config as AvatarConfig | undefined
    const theme = (userProfile.preferences as Record<string, unknown> | null)?.theme as
      | 'light'
      | 'dark'
      | undefined

    // Cast userProfile to any to access extendedStats since type inference might lag
    // biome-ignore lint/suspicious/noExplicitAny: extendedStats added in router
    const extendedStats = (userProfile as any).extendedStats || {}
    // biome-ignore lint/suspicious/noExplicitAny: stats added in router
    const dbStats = (userProfile as any).stats || {}

    // Calculate engagement for today
    const now = new Date()
    const isSameDay = (d1: number, d2: Date) => {
      if (!d1) return false
      const date1 = new Date(d1)
      return (
        date1.getDate() === d2.getDate() &&
        date1.getMonth() === d2.getMonth() &&
        date1.getFullYear() === d2.getFullYear()
      )
    }

    const lastTaskDate = userProfile.lastTaskXpDate
      ? new Date(userProfile.lastTaskXpDate).getTime()
      : 0
    const lastJournalDate = userProfile.lastJournalXpDate
      ? new Date(userProfile.lastJournalXpDate).getTime()
      : 0
    const lastMeditationDate = userProfile.lastMeditationXpDate
      ? new Date(userProfile.lastMeditationXpDate).getTime()
      : 0

    const hasTaskToday = isSameDay(lastTaskDate, now)
    const hasJournalToday = isSameDay(lastJournalDate, now)
    const hasMeditationToday = isSameDay(lastMeditationDate, now)

    const engagementScore =
      (hasTaskToday ? 1 : 0) + (hasJournalToday ? 1 : 0) + (hasMeditationToday ? 1 : 0)
    const isEngaged = engagementScore >= 3 ? 1 : 0

    return {
      id: userProfile.id,
      name: userProfile.name || '',
      role: userProfile.role as 'admin' | 'psychologist' | 'patient',
      xp: userProfile.experience || 0,
      level: userProfile.level || 1,
      points: userProfile.coins || 0,
      streak: userProfile.streak || 0,
      longestStreak: dbStats.longestStreak || userProfile.streak || 0,
      badges: badgesData.map((b) => ({
        id: b.badgeId,
        date: b.unlockedAt ? new Date(b.unlockedAt).getTime() : Date.now(),
      })),
      avatarConfig: avatarConfig || {
        accessory: 'none',
        shirtColor: 'bg-blue-500',
      },
      theme: theme || 'light',
      totalMeditationMinutes: extendedStats.totalMeditationMinutes || 0,
      dailyMeditationCount: 0,
      lastMeditationDate,
      totalTasksCompleted: dbStats.completedTasks || 0,
      totalJournals: journalData.length,
      tutorialCompleted: true,
      lastMoodXPTimestamp: userProfile.lastMoodXpDate
        ? new Date(userProfile.lastMoodXpDate).getTime()
        : undefined,
      rewards: rewardsData.map((r) => {
        // Verificar se foi resgatado hoje (cooldown diário)
        const claimedToday = r.claimedAt
          ? new Date(r.claimedAt).toDateString() === new Date().toDateString()
          : false

        return {
          id: r.id,
          title: r.title,
          category: (r.category as RewardCategory) || 'lazer',
          cost: r.cost,
          // Status: redeemed se resgatou hoje, approved se tem custo, pending se aguarda aprovação
          status: claimedToday ? 'redeemed' : r.cost > 0 ? 'approved' : 'pending',
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          claimedAt: r.claimedAt ? new Date(r.claimedAt).getTime() : undefined,
        }
      }),
      completedTasksHigh: extendedStats.completedTasksHigh || 0,
      completedTasksMedium: extendedStats.completedTasksMedium || 0,
      completedTasksLow: extendedStats.completedTasksLow || 0,
      totalMoodLogs: extendedStats.totalMoodLogs || 0,
      redeemedRewards: extendedStats.redeemedRewards || 0,
      engagement: isEngaged,
      completedTasks: dbStats.completedTasks || 0,
      totalMeditations: dbStats.totalMeditations || 0,
      totalJournalEntries: dbStats.totalJournalEntries || 0,
    }
  }, [userProfile, journalData, rewardsData, badgesData])

  // Convert tasks to the expected format (including tasks from therapist)
  const tasks = useMemo(() => {
    // Regular tasks
    const regularTasks = tasksData.map((task) => ({
      id: task.id,
      title: task.title,
      priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
      completed: Boolean(task.completed),
      dueDate: task.dueDate ? new Date(task.dueDate).getTime() : Date.now(),
      originalDueDate: task.originalDueDate ? new Date(task.originalDueDate).getTime() : undefined,
      frequency: (task.frequency || 'once') as 'once' | 'daily' | 'weekly' | 'monthly',
      weekDays: task.weekDays as number[] | undefined,
      monthDays: task.monthDays as number[] | undefined,
      isFromTherapist: false,
    }))

    // Tasks from therapist
    const fromTherapist = therapistTasksData.map((task) => ({
      id: task.id,
      title: task.title,
      priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
      completed: task.status === 'completed',
      dueDate: task.dueDate ? new Date(task.dueDate).getTime() : Date.now(),
      originalDueDate: undefined,
      frequency: (task.frequency || 'once') as 'once' | 'daily' | 'weekly' | 'monthly',
      weekDays: task.weekDays as number[] | undefined,
      monthDays: undefined,
      isFromTherapist: true,
      category: task.category,
    }))

    // Combine and sort by dueDate (closest first), then priority (high first)
    return [...regularTasks, ...fromTherapist].sort((a, b) => {
      // First by date (closer dates first)
      if (a.dueDate !== b.dueDate) {
        return a.dueDate - b.dueDate
      }
      // Then by priority (high > medium > low)
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [tasksData, therapistTasksData])

  // Convert journal entries to the expected format
  const journal = useMemo(
    () =>
      journalData.map((entry) => ({
        id: entry.id,
        timestamp: new Date(entry.createdAt).getTime(),
        emotion: (entry.mood as Mood) || 'neutral',
        intensity: 5,
        thought: entry.content || '',
        aiAnalysis: entry.aiAnalysis || undefined,
        therapistFeedback: entry.therapistFeedback || undefined,
        feedbackAt: entry.feedbackAt ? new Date(entry.feedbackAt).getTime() : undefined,
        feedbackViewed: entry.feedbackViewed ?? false,
      })),
    [journalData]
  )

  // Get current mood from moodHistory (or fallback to journal)
  const currentMood: Mood = useMemo(() => {
    // Priority: moodHistory > journal
    if (latestMood) return latestMood as Mood
    if (journal.length > 0) return journal[0]?.emotion || 'neutral'
    return 'neutral'
  }, [latestMood, journal])

  // Use BADGE_DEFINITIONS directly
  const allBadges = BADGE_DEFINITIONS

  // State for new badges
  const [newBadges, setNewBadges] = useState<typeof BADGE_DEFINITIONS>([])

  // Helper functions that use tRPC mutations
  const addXP = (amount: number) => {
    // XP is now managed by backend mutations
    console.log('XP awarded:', amount)
  }

  const addPoints = (amount: number) => {
    // Points/coins are now managed by backend mutations
    console.log('Points awarded:', amount)
  }

  const checkBadges = () => {
    // Fire and forget - don't block UI
    utils.client.badge.checkAndUnlock
      .mutate()
      .then((result) => {
        if (result.newBadges && result.newBadges.length > 0) {
          const unlockedBadges = BADGE_DEFINITIONS.filter((def) =>
            result.newBadges.includes(def.id)
          )
          setNewBadges((prev) => [...prev, ...unlockedBadges])
          // Invalidate in background
          utils.badge.getAll.invalidate()
          utils.user.getProfile.invalidate()
        }
      })
      .catch((error) => {
        console.error('Error checking badges:', error)
      })
  }

  const dismissNewBadge = () => {
    setNewBadges((prev) => prev.slice(1))
  }

  const dismissUrgentTask = (id: string) => {
    setUrgentOverdueTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // Helper to optimistically update user profile XP and coins
  const updateProfileOptimistically = (xpDelta: number, coinsDelta: number) => {
    utils.user.getProfile.setData(undefined, (old) => {
      if (!old) return old
      const newExperience = Math.max(0, (old.experience || 0) + xpDelta)
      const newCoins = Math.max(0, (old.coins || 0) + coinsDelta)
      const newLevel = Math.floor(newExperience / 100) + 1
      return {
        ...old,
        experience: newExperience,
        coins: newCoins,
        level: newLevel,
      }
    })
  }

  const toggleTask = async (id: string) => {
    // Find the task - check both regular tasks and therapist tasks
    const regularTask = tasksData.find((t) => t.id === id)
    const therapistTask = therapistTasksData.find((t) => t.id === id)
    const task = regularTask || therapistTask
    const isFromTherapist = !!therapistTask

    if (!task) return

    const wasCompleted = isFromTherapist
      ? therapistTask?.status === 'completed'
      : (regularTask?.completed ?? false)

    // Optimistic update - update task cache immediately
    if (isFromTherapist) {
      utils.task.getMyTasksFromTherapist.setData(undefined, (old) => {
        if (!old) return old
        return old.map((t) =>
          t.id === id ? { ...t, status: wasCompleted ? 'pending' : 'completed' } : t
        )
      })
    } else {
      utils.task.getAll.setData(undefined, (old) => {
        if (!old) return old
        return old.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      })
    }

    // Optimistic update for XP/coins based on task type and priority
    const priority = task.priority || 'medium'
    // Sessões (categoria 'sessao') dão 40 XP/coins
    const isSession = isFromTherapist && therapistTask?.category === 'sessao'
    let xp: number
    let coins: number

    if (isSession) {
      xp = 40
      coins = 40
    } else {
      const xpRewards: Record<string, number> = { high: 30, medium: 10, low: 5 }
      const coinRewards: Record<string, number> = { high: 30, medium: 10, low: 5 }
      xp = xpRewards[priority] || 10
      coins = coinRewards[priority] || 10
    }

    if (wasCompleted) {
      // Uncompleting - remove XP/coins
      updateProfileOptimistically(-xp, -coins)
    } else {
      updateProfileOptimistically(xp, coins)
    }

    try {
      if (isFromTherapist) {
        // Complete therapist task
        await utils.client.task.completeTherapistTask.mutate({ taskId: id })
        utils.task.getMyTasksFromTherapist.invalidate()
      } else {
        // Complete regular task
        await utils.client.task.complete.mutate({ id })
        utils.task.getAll.invalidate()
      }
      // After mutation, sync with actual server values in background
      utils.user.getProfile.invalidate()
      checkBadges()
    } catch (error) {
      // Revert optimistic updates on error
      utils.task.getAll.invalidate()
      utils.task.getMyTasksFromTherapist.invalidate()
      utils.user.getProfile.invalidate()
      console.error('Error completing task:', error)
    }
  }

  const addTask = async (taskData: {
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    dueDate?: number
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
    weekDays?: number[]
    monthDays?: number[]
  }) => {
    try {
      await utils.client.task.create.mutate({
        title: taskData.title,
        description: taskData.description,
        category: 'general',
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        frequency: taskData.frequency,
        weekDays: taskData.weekDays,
        monthDays: taskData.monthDays,
      })

      // Background invalidation - refetch to get the new task with all fields
      utils.task.getAll.invalidate()
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    // Optimistic delete
    utils.task.getAll.setData(undefined, (old) => {
      if (!old) return old
      return old.filter((task) => task.id !== id)
    })

    try {
      await utils.client.task.delete.mutate({ id })
      // Background invalidation
      utils.task.getAll.invalidate()
    } catch (error) {
      utils.task.getAll.invalidate()
      console.error('Error deleting task:', error)
    }
  }

  const addJournalEntry = async (entryData: {
    emotion: Mood
    intensity: number
    thought: string
    aiAnalysis?: string
  }) => {
    // Optimistic update for XP/coins (journal gives 30 XP and 30 coins)
    updateProfileOptimistically(30, 30)

    try {
      await utils.client.journal.create.mutate({
        content: entryData.thought,
        mood: entryData.emotion,
        aiAnalysis: entryData.aiAnalysis,
      })
      // Background invalidation
      utils.journal.getAll.invalidate()
      utils.user.getProfile.invalidate()
      checkBadges()
    } catch (error) {
      // Revert on error
      utils.user.getProfile.invalidate()
      console.error('Error creating journal entry:', error)
    }
  }

  const setMood = async (mood: Mood) => {
    // Check if XP is available (1 hour cooldown)
    const lastXP = stats.lastMoodXPTimestamp || 0
    const ONE_HOUR_MS = 60 * 60 * 1000
    const now = Date.now()
    const canGainXP = !lastXP || now - lastXP >= ONE_HOUR_MS

    // Only do optimistic update if XP is available
    if (canGainXP) {
      updateProfileOptimistically(10, 0)
    } else {
      return // Abort if no XP can be gained
    }

    try {
      await utils.client.user.trackMood.mutate({ mood })
      // Background invalidation
      utils.user.getProfile.invalidate()
      utils.user.getLatestMood.invalidate()
      utils.user.hasRecentAnxiety.invalidate()
      checkBadges()
    } catch (error) {
      // Revert on error
      utils.user.getProfile.invalidate()
      console.error('Error tracking mood:', error)
    }
  }

  const completeMeditation = async (minutes: number) => {
    // Calcula duração em segundos
    const durationSeconds = minutes * 60

    // Calcula XP e coins baseado na duração
    // 1-3 min: 1x (30 XP/coins), 5 min: 1.5x (45 XP/coins), 10 min: 2x (60 XP/coins)
    let multiplier = 1
    if (durationSeconds >= 600)
      multiplier = 2 // 10+ min
    else if (durationSeconds >= 300) multiplier = 1.5 // 5+ min

    const xpReward = Math.round(30 * multiplier)
    const coinReward = Math.round(30 * multiplier)

    // Optimistic update for XP/coins
    updateProfileOptimistically(xpReward, coinReward)

    try {
      await utils.client.meditation.create.mutate({
        duration: durationSeconds,
        type: 'guided',
      })
      // Background invalidation
      utils.meditation.getHistory.invalidate()
      utils.user.getProfile.invalidate()
      checkBadges()
    } catch (error) {
      // Revert on error
      utils.user.getProfile.invalidate()
      console.error('Error completing meditation:', error)
    }
  }

  const updateAvatarConfig = async (config: AvatarConfig) => {
    try {
      await utils.client.user.updateAvatar.mutate({
        accessory: config.accessory,
        shirtColor: config.shirtColor,
      })
      // Background invalidation
      utils.user.getProfile.invalidate()
    } catch (error) {
      console.error('Error updating avatar:', error)
    }
  }

  const toggleTheme = async () => {
    try {
      // Get current user to toggle theme
      const user = await utils.client.user.getProfile.query()
      const newTheme = user.preferences?.theme === 'light' ? 'dark' : 'light'
      await utils.client.user.updateTheme.mutate({ theme: newTheme })
      // Background invalidation
      utils.user.getProfile.invalidate()
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  const addRewardRequest = async (title: string, category: string) => {
    try {
      await utils.client.reward.create.mutate({
        title,
        description: '',
        category,
        cost: 0,
      })
      // Background invalidation
      utils.reward.getAll.invalidate()
    } catch (error) {
      console.error('Error creating reward:', error)
    }
  }

  const redeemReward = async (id: string) => {
    // Find the reward to get its cost
    const reward = rewardsData.find((r) => r.id === id)
    const cost = reward?.cost || 0

    // Optimistic update - mark claimedAt as now (cooldown diário)
    utils.reward.getAll.setData(undefined, (old) => {
      if (!old) return old
      return old.map((r) => (r.id === id ? { ...r, claimedAt: new Date() } : r))
    })

    // Optimistic update - deduct coins
    if (cost > 0) {
      updateProfileOptimistically(0, -cost)
    }

    try {
      await utils.client.reward.claim.mutate({ id })
      // Background invalidation
      utils.reward.getAll.invalidate()
      utils.user.getProfile.invalidate()
      checkBadges()
    } catch (error) {
      // Revert on error
      utils.reward.getAll.invalidate()
      utils.user.getProfile.invalidate()
      console.error('Error redeeming reward:', error)
    }
  }

  const deleteReward = async (id: string) => {
    // Optimistic delete
    utils.reward.getAll.setData(undefined, (old) => {
      if (!old) return old
      return old.filter((reward) => reward.id !== id)
    })

    try {
      await utils.client.reward.delete.mutate({ id })
      // Background invalidation
      utils.reward.getAll.invalidate()
    } catch (error) {
      utils.reward.getAll.invalidate()
      console.error('Error deleting reward:', error)
    }
  }

  const updateReward = async (
    id: string,
    updates: {
      title?: string
      description?: string
      cost?: number
      status?: string
    }
  ) => {
    try {
      await utils.client.reward.updateCost.mutate({
        rewardId: id,
        cost: updates.cost || 0,
      })
      // Background invalidation
      utils.reward.getAll.invalidate()
    } catch (error) {
      console.error('Error updating reward:', error)
    }
  }

  // Apply theme to document
  useEffect(() => {
    if (stats.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [stats.theme])

  return (
    <GameContext.Provider
      value={{
        stats,
        tasks,
        journal,
        currentMood,
        allBadges,
        newBadges,
        urgentOverdueTasks,
        dismissNewBadge,
        dismissUrgentTask,
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
