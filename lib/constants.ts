import type { UserStats } from "./db/schema";

export const TIMEZONE = "America/Sao_Paulo";

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  metric:
    | keyof Pick<
        UserStats,
        | "totalMeditations"
        | "completedTasks"
        | "totalJournalEntries"
        | "longestStreak"
      >
    | "totalMeditationMinutes"
    | "auto";
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "apprentice",
    name: "Aprendiz",
    description: "Completou o tutorial básico",
    icon: "🎓",
    requirement: 1,
    metric: "auto",
  },
  {
    id: "zen_master",
    name: "Mestre Zen",
    description: "20 min de meditação",
    icon: "🧘",
    requirement: 20,
    metric: "totalMeditationMinutes",
  },
  {
    id: "warrior",
    name: "Guerreiro",
    description: "7 dias de ofensiva",
    icon: "⚔️",
    requirement: 7,
    metric: "longestStreak",
  },
  {
    id: "analyst",
    name: "Analista",
    description: "5 Diários criados",
    icon: "🧠",
    requirement: 5,
    metric: "totalJournalEntries",
  },
  {
    id: "doer",
    name: "Realizador",
    description: "10 Tarefas concluídas",
    icon: "✅",
    requirement: 10,
    metric: "completedTasks",
  },
];

export type RankDefinition = {
  level: number;
  name: string;
  minXp: number;
  description: string;
};

export const RANKS: RankDefinition[] = [
  {
    level: 1,
    name: "Iniciado",
    minXp: 0,
    description: "O começo da jornada de autoconhecimento.",
  },
  {
    level: 2,
    name: "Guerreiro da Mente",
    minXp: 100,
    description: "Enfrentando os primeiros desafios emocionais.",
  },
  {
    level: 3,
    name: "Aprendiz da Calma",
    minXp: 200,
    description: "Descobrindo o poder da respiração consciente.",
  },
  {
    level: 4,
    name: "Guardião do Foco",
    minXp: 300,
    description: "Mantendo a atenção no momento presente.",
  },
  {
    level: 5,
    name: "Mestre das Emoções",
    minXp: 400,
    description: "Navegando com sabedoria pelas ondas dos sentimentos.",
  },
  {
    level: 6,
    name: "Sábio Interior",
    minXp: 500,
    description: "Conexão profunda com o eu verdadeiro.",
  },
  {
    level: 7,
    name: "Iluminado",
    minXp: 600,
    description: "Estado de fluxo e aceitação plena da realidade.",
  },
];

export type Mood = "happy" | "calm" | "neutral" | "sad" | "anxious" | "angry";

export const MOOD_SCORE_MAP: Record<Mood, number> = {
  happy: 100,
  calm: 80,
  neutral: 60,
  anxious: 40,
  sad: 30,
  angry: 20,
};

export const TASK_LIMITS = {
  high: 2,
  medium: 5,
} as const;

/**
 * Helper function to calculate level from XP
 * Re-exported from lib/xp for backwards compatibility
 */
export { getLevelFromXP } from "./xp";

// Helper function to get rank definition for a level
export function getRankForLevel(level: number): RankDefinition {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].level) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}
