import type { UserStats } from './db/schema'

export const TIMEZONE = 'America/Sao_Paulo'

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

export const BADGE_CATEGORIES: Record<
  BadgeCategory,
  { label: string; icon: string; color: string }
> = {
  evolution: { label: 'Evolução de Nível', icon: 'evolution', color: 'text-amber-500' },
  tasks_general: { label: 'Tarefas Concluídas', icon: 'tasks_general', color: 'text-emerald-500' },
  tasks_priority: { label: 'Tarefas por Prioridade', icon: 'tasks_priority', color: 'text-blue-500' },
  meditation: { label: 'Meditação', icon: 'meditation', color: 'text-violet-500' },
  journal: { label: 'Diário de Pensamento', icon: 'journal', color: 'text-pink-500' },
  mood: { label: 'Registro de Humor', icon: 'mood', color: 'text-orange-500' },
  consistency: { label: 'Consistência', icon: 'consistency', color: 'text-red-500' },
  rewards: { label: 'Recompensas', icon: 'rewards', color: 'text-purple-500' },
  engagement: { label: 'Engajamento Geral', icon: 'engagement', color: 'text-indigo-500' },
}

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
        'totalMeditations' | 'completedTasks' | 'totalJournalEntries' | 'longestStreak'
      >
    | 'totalMeditationMinutes'
    | 'level'
    | 'completedTasksHigh'
    | 'completedTasksMedium'
    | 'completedTasksLow'
    | 'totalMoodLogs'
    | 'redeemedRewards'
    | 'engagement'
    | 'auto'
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Evolução de Nível
  {
    id: 'level_2',
    name: 'Aprendiz',
    description: 'Alcançou o nível 2',
    icon: 'level_2',
    requirement: 2,
    category: 'evolution',
    metric: 'level',
  },
  {
    id: 'level_5',
    name: 'Veterano',
    description: 'Alcançou o nível 5',
    icon: 'level_5',
    requirement: 5,
    category: 'evolution',
    metric: 'level',
  },
  {
    id: 'level_10',
    name: 'Mestre',
    description: 'Alcançou o nível 10',
    icon: 'level_10',
    requirement: 10,
    category: 'evolution',
    metric: 'level',
  },

  // Tarefas Gerais
  {
    id: 'tasks_1',
    name: 'Primeiro Passo',
    description: 'Concluiu 1 tarefa',
    icon: 'tasks_1',
    requirement: 1,
    category: 'tasks_general',
    metric: 'completedTasks',
  },
  {
    id: 'tasks_10',
    name: 'Realizador',
    description: 'Concluiu 10 tarefas',
    icon: 'tasks_10',
    requirement: 10,
    category: 'tasks_general',
    metric: 'completedTasks',
  },
  {
    id: 'tasks_50',
    name: 'Produtivo',
    description: 'Concluiu 50 tarefas',
    icon: 'tasks_50',
    requirement: 50,
    category: 'tasks_general',
    metric: 'completedTasks',
  },
  {
    id: 'tasks_100',
    name: 'Implacável',
    description: 'Concluiu 100 tarefas',
    icon: 'tasks_100',
    requirement: 100,
    category: 'tasks_general',
    metric: 'completedTasks',
  },
  {
    id: 'tasks_500',
    name: 'Lendário',
    description: 'Concluiu 500 tarefas',
    icon: 'tasks_500',
    requirement: 500,
    category: 'tasks_general',
    metric: 'completedTasks',
  },

  // Tarefas por Prioridade
  {
    id: 'priority_high_10',
    name: 'Prioridade Máxima',
    description: '10 tarefas de alta prioridade',
    icon: 'priority_high',
    requirement: 10,
    category: 'tasks_priority',
    metric: 'completedTasksHigh',
  },
  {
    id: 'priority_medium_20',
    name: 'Equilíbrio',
    description: '20 tarefas de média prioridade',
    icon: 'priority_medium',
    requirement: 20,
    category: 'tasks_priority',
    metric: 'completedTasksMedium',
  },
  {
    id: 'priority_low_30',
    name: 'Organizado',
    description: '30 tarefas de baixa prioridade',
    icon: 'priority_low',
    requirement: 30,
    category: 'tasks_priority',
    metric: 'completedTasksLow',
  },

  // Meditação
  {
    id: 'meditation_sessions_10',
    name: 'Iniciado Zen',
    description: '10 sessões de meditação',
    icon: 'meditation_session',
    requirement: 10,
    category: 'meditation',
    metric: 'totalMeditations',
  },
  {
    id: 'meditation_minutes_100',
    name: 'Mente Serena',
    description: '100 minutos de meditação',
    icon: 'meditation_time',
    requirement: 100,
    category: 'meditation',
    metric: 'totalMeditationMinutes',
  },

  // Diário
  {
    id: 'journal_1',
    name: 'Querido Diário',
    description: 'Primeiro registro no diário',
    icon: 'journal_entry',
    requirement: 1,
    category: 'journal',
    metric: 'totalJournalEntries',
  },
  {
    id: 'journal_10',
    name: 'Escritor',
    description: '10 registros no diário',
    icon: 'journal_writer',
    requirement: 10,
    category: 'journal',
    metric: 'totalJournalEntries',
  },
  {
    id: 'journal_30',
    name: 'Reflexivo',
    description: '30 registros no diário',
    icon: 'journal_reflection',
    requirement: 30,
    category: 'journal',
    metric: 'totalJournalEntries',
  },
  {
    id: 'journal_100',
    name: 'Biógrafo',
    description: '100 registros no diário',
    icon: 'journal_biographer',
    requirement: 100,
    category: 'journal',
    metric: 'totalJournalEntries',
  },

  // Humor
  {
    id: 'mood_1',
    name: 'Autoconhecimento',
    description: 'Primeiro registro de humor',
    icon: 'mood_log',
    requirement: 1,
    category: 'mood',
    metric: 'totalMoodLogs',
  },
  {
    id: 'mood_7',
    name: 'Semana Emocional',
    description: '7 registros de humor',
    icon: 'mood_week',
    requirement: 7,
    category: 'mood',
    metric: 'totalMoodLogs',
  },
  {
    id: 'mood_30',
    name: 'Mês Consciente',
    description: '30 registros de humor',
    icon: 'mood_month',
    requirement: 30,
    category: 'mood',
    metric: 'totalMoodLogs',
  },
  {
    id: 'mood_100',
    name: 'Mestre das Emoções',
    description: '100 registros de humor',
    icon: 'mood_master',
    requirement: 100,
    category: 'mood',
    metric: 'totalMoodLogs',
  },

  // Consistência
  {
    id: 'streak_3',
    name: 'Aquecendo',
    description: '3 dias seguidos',
    icon: 'streak_fire',
    requirement: 3,
    category: 'consistency',
    metric: 'longestStreak',
  },
  {
    id: 'streak_7',
    name: 'Focado',
    description: '7 dias seguidos',
    icon: 'streak_calendar',
    requirement: 7,
    category: 'consistency',
    metric: 'longestStreak',
  },
  {
    id: 'streak_21',
    name: 'Hábito Formado',
    description: '21 dias seguidos',
    icon: 'streak_muscle',
    requirement: 21,
    category: 'consistency',
    metric: 'longestStreak',
  },
  {
    id: 'streak_30',
    name: 'Mensalista',
    description: '30 dias seguidos',
    icon: 'streak_calendar',
    requirement: 30,
    category: 'consistency',
    metric: 'longestStreak',
  },
  {
    id: 'streak_100',
    name: 'Centenário',
    description: '100 dias seguidos',
    icon: 'streak_fire',
    requirement: 100,
    category: 'consistency',
    metric: 'longestStreak',
  },

  // Recompensas
  {
    id: 'rewards_1',
    name: 'Merecido',
    description: '1 recompensa resgatada',
    icon: 'reward_gift',
    requirement: 1,
    category: 'rewards',
    metric: 'redeemedRewards',
  },
  {
    id: 'rewards_5',
    name: 'Celebrando',
    description: '5 recompensas resgatadas',
    icon: 'reward_gift',
    requirement: 5,
    category: 'rewards',
    metric: 'redeemedRewards',
  },
  {
    id: 'rewards_10',
    name: 'Conquistador',
    description: '10 recompensas resgatadas',
    icon: 'reward_gem',
    requirement: 10,
    category: 'rewards',
    metric: 'redeemedRewards',
  },
  {
    id: 'rewards_20',
    name: 'Colecionador',
    description: '20 recompensas resgatadas',
    icon: 'evolution',
    requirement: 20,
    category: 'rewards',
    metric: 'redeemedRewards',
  },

  // Engajamento
  {
    id: 'engagement_combo',
    name: 'Super Dia',
    description: 'Usou 3 funcionalidades no mesmo dia',
    icon: 'engagement_star',
    requirement: 1,
    category: 'engagement',
    metric: 'engagement',
  },
]

export type RankDefinition = {
  level: number
  name: string
  minXp: number
  description: string
}

export const RANKS: RankDefinition[] = [
  {
    level: 1,
    name: 'Primeiro Passo',
    minXp: 0,
    description: 'O começo da jornada de autoconhecimento.',
  },
  {
    level: 2,
    name: 'Observador de Si',
    minXp: 300,
    description: 'Enfrentando os primeiros desafios emocionais.',
  },
  {
    level: 3,
    name: 'Cultivador da Clareza',
    minXp: 700,
    description: 'Descobrindo o poder da respiração consciente.',
  },
  {
    level: 4,
    name: 'Construtor de Hábitos',
    minXp: 1200,
    description: 'Mantendo a atenção no momento presente.',
  },
  {
    level: 5,
    name: 'Navegador Emocional',
    minXp: 1800,
    description: 'Navegando com sabedoria pelas ondas dos sentimentos.',
  },
  {
    level: 6,
    name: 'Praticante da Presença',
    minXp: 2500,
    description: 'Conexão profunda com o eu verdadeiro.',
  },
  {
    level: 7,
    name: 'Artífice da Mente',
    minXp: 3300,
    description: 'Estado de fluxo e aceitação plena da realidade.',
  },
  {
    level: 8,
    name: 'Alinhado ao Propósito',
    minXp: 4200,
    description: 'Enxergando além do óbvio.',
  },
  {
    level: 9,
    name: 'Integrado',
    minXp: 5200,
    description: 'Além dos limites da mente comum.',
  },
  {
    level: 10,
    name: 'Consciência Plena',
    minXp: 6500,
    description: 'Um exemplo supremo de equilíbrio e sabedoria.',
  },
]

export type Mood = 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious' | 'angry'

export const MOOD_SCORE_MAP: Record<Mood, number> = {
  happy: 100,
  calm: 80,
  neutral: 60,
  anxious: 40,
  sad: 30,
  angry: 20,
}

export const TASK_LIMITS = {
  high: 2,
  medium: 5,
} as const

// Helper function to get rank definition for a level
export function getRankForLevel(level: number): RankDefinition {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].level) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}
