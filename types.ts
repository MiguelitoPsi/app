export type Mood = 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious' | 'angry'

export type JournalEntry = {
  id: string
  timestamp: number
  emotion: Mood
  intensity: number // 1-10
  thought: string
  aiAnalysis?: string
}

export type Task = {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  dueDate: number // Timestamp (start of day)
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  weekDays?: number[] // 0-6 (Sunday-Saturday) for weekly tasks
  monthDays?: number[] // 1-31 for monthly tasks
}

export type BadgeUnlock = {
  id: string
  date: number
}

export type AvatarAccessory = 'none' | 'glasses' | 'crown' | 'headphones' | 'bow' | 'star'

export type AvatarConfig = {
  accessory: AvatarAccessory
  shirtColor: string // Tailwind color class
}

export type RewardCategory = 'lazer' | 'autocuidado' | 'descanso' | 'social'

export type Reward = {
  id: string
  title: string
  category: RewardCategory
  cost: number // 0 if pending
  status: 'pending' | 'approved' | 'redeemed'
  createdAt: number
  claimedAt?: number // Timestamp do último resgate (cooldown diário)
}

export type UserStats = {
  id?: string
  name: string
  role?: 'admin' | 'psychologist' | 'patient'
  xp: number
  level: number
  points: number // New Currency
  streak: number
  longestStreak: number
  badges: BadgeUnlock[] // Stores ID and timestamp
  avatarConfig: AvatarConfig
  theme: 'light' | 'dark'
  // Metrics for achievements
  totalMeditationMinutes: number
  dailyMeditationCount: number // Tracks daily sessions for point limit
  lastMeditationDate: number // Timestamp to reset daily count
  totalTasksCompleted: number
  totalJournals: number
  tutorialCompleted: boolean
  lastMoodXPTimestamp?: number // Timestamp for cooldown tracking
  rewards: Reward[] // User's custom rewards

  // New metrics for achievements
  completedTasksHigh: number
  completedTasksMedium: number
  completedTasksLow: number
  totalMoodLogs: number
  redeemedRewards: number
  engagement: number // 0 or 1 (boolean-like) or score
  completedTasks: number
  totalMeditations: number
  totalJournalEntries: number
}

export type BadgeCategory =
  | 'evolution'
  | 'tasks_general'
  | 'tasks_priority'
  | 'meditation'
  | 'journal'
  | 'mood'
  | 'consistency'
  | 'rewards'
  | 'engagement'

export type BadgeDefinition = {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  category: BadgeCategory
  metric:
    | keyof Pick<
        UserStats,
        | 'totalMeditationMinutes'
        | 'totalTasksCompleted'
        | 'totalJournals'
        | 'streak'
        | 'tutorialCompleted'
        | 'completedTasks'
        | 'totalMeditations'
        | 'totalJournalEntries'
        | 'longestStreak'
      >
    | 'auto'
    | 'level'
    | 'completedTasksHigh'
    | 'completedTasksMedium'
    | 'completedTasksLow'
    | 'totalMoodLogs'
    | 'redeemedRewards'
    | 'engagement'
}

export type GameContextType = {
  stats: UserStats
  tasks: Task[]
  journal: JournalEntry[]
  currentMood: Mood
  allBadges: BadgeDefinition[]
  newBadges: BadgeDefinition[]
  dismissNewBadge: () => void
  addXP: (amount: number) => void
  addPoints: (amount: number) => void
  toggleTask: (id: string) => void
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void
  deleteTask: (id: string) => void
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void
  setMood: (mood: Mood) => void
  completeMeditation: (minutes: number) => void
  updateAvatarConfig: (config: AvatarConfig) => void
  toggleTheme: () => void
  addRewardRequest: (title: string, category: RewardCategory) => void
  redeemReward: (id: string) => void
  deleteReward: (id: string) => void
  updateReward: (id: string, updates: Partial<Reward>) => void
}

export const Tab = {
  HOME: 'home',
  MEDITATION: 'meditation',
  ADD: 'add',
  ROUTINE: 'routine',
  PROFILE: 'profile',
  THERAPIST: 'therapist',
  REWARDS: 'rewards',
  DASHBOARD: 'dashboard',
} as const

export type Tab = (typeof Tab)[keyof typeof Tab]
