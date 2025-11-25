/**
 * Sistema de XP e Gamificação para Terapeutas
 *
 * Centraliza toda a lógica de experiência (XP), níveis e condições
 * de ganho específicas para terapeutas.
 */

import { eq } from 'drizzle-orm'
import { therapistStats, users } from '@/lib/db/schema'

/* ============================================
 * CONSTANTES DE RECOMPENSA DO TERAPEUTA
 * ============================================ */

/**
 * Ações do terapeuta que geram XP
 */
export const THERAPIST_XP_ACTIONS = {
  // Visualização de dados
  viewMoodReport: 15,
  viewThoughtRecord: 15,
  viewWeeklyReport: 20,
  viewPatientProfile: 5,

  // Gestão de tarefas
  createPatientTask: 20,
  reviewPatientTask: 15,
  editAiTask: 25,
  sendWeeklyFeedback: 30,

  // Avaliações e relatórios
  submitClinicalReport: 40,
  createTherapyPlan: 50,
  reviewCognitiveConcept: 35,

  // Gestão de recompensas
  approveReward: 25,
  setRewardCost: 10,

  // Sessões
  completeSession: 35,
  scheduleSession: 10,

  // Desafios
  completeChallenge: 50,
  completeChallengeBonus: 100,

  // Metas financeiras
  achieveGoal: 75,
  updateFinancialRecord: 5,
} as const

export type TherapistXPAction = keyof typeof THERAPIST_XP_ACTIONS

/**
 * Categorias de ações para tracking de estatísticas
 */
export const ACTION_STAT_MAP: Record<
  TherapistXPAction,
  keyof typeof therapistStats.$inferSelect | null
> = {
  viewMoodReport: 'totalReportsViewed',
  viewThoughtRecord: 'totalReportsViewed',
  viewWeeklyReport: 'totalReportsViewed',
  viewPatientProfile: null,
  createPatientTask: 'totalTasksCreated',
  reviewPatientTask: 'totalTasksReviewed',
  editAiTask: 'totalTasksCreated',
  sendWeeklyFeedback: 'totalFeedbackSent',
  submitClinicalReport: 'totalClinicalReports',
  createTherapyPlan: 'totalClinicalReports',
  reviewCognitiveConcept: 'totalClinicalReports',
  approveReward: 'totalRewardsApproved',
  setRewardCost: null,
  completeSession: 'totalSessionsCompleted',
  scheduleSession: null,
  completeChallenge: null,
  completeChallengeBonus: null,
  achieveGoal: null,
  updateFinancialRecord: null,
}

/* ============================================
 * CONSTANTES DE SISTEMA DO TERAPEUTA
 * ============================================ */

/**
 * XP necessário por nível para terapeutas (150 XP por nível - mais que pacientes)
 */
export const THERAPIST_XP_PER_LEVEL = 150

/* ============================================
 * CÁLCULOS DE NÍVEL DO TERAPEUTA
 * ============================================ */

/**
 * Calcula o nível atual do terapeuta baseado no XP total
 */
export function getTherapistLevelFromXP(xp: number): number {
  return Math.floor(xp / THERAPIST_XP_PER_LEVEL) + 1
}

/**
 * Calcula o XP mínimo necessário para um nível específico
 */
export function getTherapistXPForLevel(level: number): number {
  return (level - 1) * THERAPIST_XP_PER_LEVEL
}

/**
 * Calcula quanto XP falta para o próximo nível
 */
export function getTherapistXPToNextLevel(currentXP: number): number {
  const currentLevel = getTherapistLevelFromXP(currentXP)
  const nextLevelXP = getTherapistXPForLevel(currentLevel + 1)
  return nextLevelXP - currentXP
}

/**
 * Calcula o progresso dentro do nível atual (0-100%)
 */
export function getTherapistLevelProgress(currentXP: number): number {
  const currentLevel = getTherapistLevelFromXP(currentXP)
  const currentLevelXP = getTherapistXPForLevel(currentLevel)
  const xpInCurrentLevel = currentXP - currentLevelXP
  return Math.min(100, Math.max(0, (xpInCurrentLevel / THERAPIST_XP_PER_LEVEL) * 100))
}

/* ============================================
 * TIPOS DE RESULTADO
 * ============================================ */

export type TherapistXPResult = {
  xpAwarded: number
  newExperience: number
  newLevel: number
  levelUp: boolean
  streakUpdated: boolean
  newStreak: number
}

export type TherapistXPInfo = {
  currentXP: number
  currentLevel: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpInCurrentLevel: number
  xpToNextLevel: number
  progressPercent: number
  currentStreak: number
  longestStreak: number
}

/* ============================================
 * LÓGICA DE GANHO DE XP DO TERAPEUTA
 * ============================================ */

/**
 * Inicializa ou obtém as estatísticas do terapeuta
 */
export async function getOrCreateTherapistStats(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  therapistId: string
) {
  const [existing] = await db
    .select()
    .from(therapistStats)
    .where(eq(therapistStats.therapistId, therapistId))
    .limit(1)

  if (existing) {
    return existing
  }

  // Criar registro de estatísticas
  const newStats = {
    therapistId,
    level: 1,
    experience: 0,
    totalPatientsManaged: 0,
    totalReportsViewed: 0,
    totalTasksCreated: 0,
    totalTasksReviewed: 0,
    totalFeedbackSent: 0,
    totalRewardsApproved: 0,
    totalSessionsCompleted: 0,
    totalClinicalReports: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date(),
  }

  await db.insert(therapistStats).values(newStats)
  return newStats
}

/**
 * Verifica e atualiza o streak do terapeuta
 */
function calculateStreak(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number
): { newStreak: number; newLongestStreak: number; streakUpdated: boolean } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (!lastActivityDate) {
    return { newStreak: 1, newLongestStreak: Math.max(1, longestStreak), streakUpdated: true }
  }

  const lastDate = new Date(lastActivityDate)
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())

  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Mesmo dia, não atualiza streak
    return { newStreak: currentStreak, newLongestStreak: longestStreak, streakUpdated: false }
  }

  if (diffDays === 1) {
    // Dia consecutivo
    const newStreak = currentStreak + 1
    return {
      newStreak,
      newLongestStreak: Math.max(newStreak, longestStreak),
      streakUpdated: true,
    }
  }

  // Streak quebrado
  return { newStreak: 1, newLongestStreak: longestStreak, streakUpdated: true }
}

/**
 * Aplica XP ao terapeuta por uma ação realizada
 */
export async function awardTherapistXP(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  therapistId: string,
  action: TherapistXPAction,
  multiplier = 1
): Promise<TherapistXPResult> {
  // Verificar se usuário existe e é terapeuta
  const [user] = await db.select().from(users).where(eq(users.id, therapistId)).limit(1)

  if (!user || user.role !== 'psychologist') {
    throw new Error('User not found or not a therapist')
  }

  // Obter ou criar estatísticas
  const stats = await getOrCreateTherapistStats(db, therapistId)

  // Calcular XP
  const baseXP = THERAPIST_XP_ACTIONS[action]
  const xpAwarded = Math.round(baseXP * multiplier)
  const newExperience = stats.experience + xpAwarded
  const newLevel = getTherapistLevelFromXP(newExperience)
  const levelUp = newLevel > stats.level

  // Calcular streak
  const { newStreak, newLongestStreak, streakUpdated } = calculateStreak(
    stats.lastActivityDate,
    stats.currentStreak,
    stats.longestStreak
  )

  // Preparar atualização
  const now = new Date()
  const updateData: Record<string, unknown> = {
    experience: newExperience,
    level: newLevel,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: now,
    updatedAt: now,
  }

  // Incrementar estatística específica se aplicável
  const statField = ACTION_STAT_MAP[action]
  if (statField && statField in stats) {
    updateData[statField] = (stats[statField] as number) + 1
  }

  // Atualizar banco de dados
  await db.update(therapistStats).set(updateData).where(eq(therapistStats.therapistId, therapistId))

  return {
    xpAwarded,
    newExperience,
    newLevel,
    levelUp,
    streakUpdated,
    newStreak,
  }
}

/**
 * Adiciona XP diretamente (para conquistas, bônus, etc)
 */
export async function addTherapistRawXP(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  therapistId: string,
  amount: number
): Promise<{ level: number; experience: number }> {
  const stats = await getOrCreateTherapistStats(db, therapistId)

  const newExperience = stats.experience + amount
  const newLevel = getTherapistLevelFromXP(newExperience)

  await db
    .update(therapistStats)
    .set({
      experience: newExperience,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(therapistStats.therapistId, therapistId))

  return { level: newLevel, experience: newExperience }
}

/**
 * Obtém informações completas de progresso do terapeuta
 */
export function getTherapistXPInfo(stats: typeof therapistStats.$inferSelect): TherapistXPInfo {
  const currentXP = stats.experience
  const currentLevel = getTherapistLevelFromXP(currentXP)
  const xpForCurrentLevel = getTherapistXPForLevel(currentLevel)
  const xpForNextLevel = getTherapistXPForLevel(currentLevel + 1)
  const xpInCurrentLevel = currentXP - xpForCurrentLevel
  const xpToNextLevel = xpForNextLevel - currentXP
  const progressPercent = getTherapistLevelProgress(currentXP)

  return {
    currentXP,
    currentLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel,
    xpToNextLevel,
    progressPercent,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
  }
}

/**
 * Incrementa contador de pacientes gerenciados
 */
export async function incrementPatientsManaged(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  therapistId: string
): Promise<void> {
  const stats = await getOrCreateTherapistStats(db, therapistId)

  await db
    .update(therapistStats)
    .set({
      totalPatientsManaged: stats.totalPatientsManaged + 1,
      updatedAt: new Date(),
    })
    .where(eq(therapistStats.therapistId, therapistId))
}
