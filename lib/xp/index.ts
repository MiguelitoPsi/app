/**
 * Sistema de XP e Gamificação
 *
 * Este arquivo centraliza toda a lógica de experiência (XP), moedas (coins),
 * níveis e condições de ganho do sistema de gamificação.
 */

import type { InferSelectModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { userStats, users } from '@/lib/db/schema'
import { isSameDay } from '@/lib/utils/timezone'

/* ============================================
 * CONSTANTES DE RECOMPENSA
 * ============================================ */

/**
 * Valores de XP concedidos por cada ação
 */
export const XP_REWARDS = {
  task: {
    low: 5,
    medium: 10,
    high: 30,
  },
  session: 40, // Sessão com terapeuta
  journal: 30,
  meditation: 30,
  mood: 10,
} as const

/**
 * Valores de moedas concedidas por cada ação
 */
export const COIN_REWARDS = {
  task: {
    low: 5,
    medium: 10,
    high: 30,
  },
  session: 40, // Sessão com terapeuta
  journal: 30,
  meditation: 30,
  mood: 0, // Mood não ganha coins, apenas XP
} as const

/**
 * Multiplicadores de recompensa baseados na duração da meditação (em segundos)
 * - 1 a 3 min: 1x (base)
 * - 5 min: 1.5x
 * - 10 min: 2x
 */
export const MEDITATION_DURATION_MULTIPLIERS = {
  base: 1, // 1 a 3 minutos
  medium: 1.5, // 5 minutos (300 segundos)
  long: 2, // 10 minutos (600 segundos)
} as const

/**
 * Calcula o multiplicador de recompensa baseado na duração da meditação
 * @param durationSeconds - Duração da meditação em segundos
 * @returns Multiplicador de recompensa
 */
export function getMeditationMultiplier(durationSeconds: number): number {
  if (durationSeconds >= 600) return MEDITATION_DURATION_MULTIPLIERS.long // 10+ min
  if (durationSeconds >= 300) return MEDITATION_DURATION_MULTIPLIERS.medium // 5+ min
  return MEDITATION_DURATION_MULTIPLIERS.base // < 5 min
}

/**
 * Calcula XP e coins para meditação baseado na duração
 * @param durationSeconds - Duração da meditação em segundos
 * @returns Objeto com xp e coins calculados
 */
export function getMeditationRewards(durationSeconds: number): { xp: number; coins: number } {
  const multiplier = getMeditationMultiplier(durationSeconds)
  return {
    xp: Math.round(XP_REWARDS.meditation * multiplier),
    coins: Math.round(COIN_REWARDS.meditation * multiplier),
  }
}

/**
 * Calcula o multiplicador de penalidade para tarefas transferidas/atrasadas
 * - Prioridade baixa: 0 XP/coins no primeiro dia de atraso
 * - Prioridade média/alta: 50% no primeiro dia, 0% a partir do segundo dia
 *
 * @param daysOverdue - Número de dias de atraso da tarefa
 * @param priority - Prioridade da tarefa
 * @returns Multiplicador de penalidade (0 a 1)
 */
export function getOverduePenaltyMultiplier(
  daysOverdue: number,
  priority: 'low' | 'medium' | 'high'
): number {
  // Tarefa não está atrasada
  if (daysOverdue <= 0) {
    return 1
  }

  // Prioridade baixa: zero XP/coins já no primeiro dia de atraso
  if (priority === 'low') {
    return 0
  }

  // Prioridade média/alta:
  // - Primeiro dia de atraso: 50%
  // - Segundo dia ou mais: 0%
  if (daysOverdue === 1) {
    return 0.5
  }

  return 0
}

/* ============================================
 * CONSTANTES DE SISTEMA
 * ============================================ */

/**
 * XP necessário para subir de nível (100 XP por nível)
 */
export const XP_PER_LEVEL = 100

/* ============================================
 * CÁLCULOS DE NÍVEL
 * ============================================ */

/**
 * Calcula o nível atual baseado no XP total
 * @param xp - Total de experiência acumulada
 * @returns Nível atual (começa em 1)
 */
export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

/**
 * Calcula o XP mínimo necessário para um nível específico
 * @param level - Nível desejado
 * @returns XP mínimo necessário
 */
export function getXPForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL
}

/**
 * Calcula quanto XP falta para o próximo nível
 * @param currentXP - XP atual do usuário
 * @returns XP restante para subir de nível
 */
export function getXPToNextLevel(currentXP: number): number {
  const currentLevel = getLevelFromXP(currentXP)
  const nextLevelXP = getXPForLevel(currentLevel + 1)
  return nextLevelXP - currentXP
}

/**
 * Calcula o progresso dentro do nível atual (0-100%)
 * @param currentXP - XP atual do usuário
 * @returns Percentual de progresso (0-100)
 */
export function getLevelProgress(currentXP: number): number {
  const currentLevel = getLevelFromXP(currentXP)
  const currentLevelXP = getXPForLevel(currentLevel)
  const xpInCurrentLevel = currentXP - currentLevelXP
  return Math.min(100, Math.max(0, (xpInCurrentLevel / XP_PER_LEVEL) * 100))
}

/* ============================================
 * VERIFICAÇÕES DE COOLDOWN
 * ============================================ */

export type XPAction = 'task' | 'session' | 'journal' | 'meditation' | 'mood'

/**
 * Mapeia ações para os campos de timestamp no banco de dados
 */
const COOLDOWN_FIELDS: Record<XPAction, keyof typeof users.$inferSelect> = {
  task: 'lastTaskXpDate',
  session: 'lastTaskXpDate', // Sessão usa o mesmo campo que task
  journal: 'lastJournalXpDate',
  meditation: 'lastMeditationXpDate',
  mood: 'lastMoodXpDate',
}

/**
 * Verifica se o usuário pode ganhar XP para uma ação específica
 * - Tasks: Sempre dão XP (sem cooldown)
 * - Mood: Limite de 1 vez por hora
 * - Outras ações (journal, meditation): Limite de 1 vez por dia
 *
 * @param user - Objeto do usuário do banco de dados
 * @param action - Tipo de ação
 * @returns true se pode ganhar XP, false se ainda está em cooldown
 */
export function canAwardXP(user: InferSelectModel<typeof users>, action: XPAction): boolean {
  // Tasks e sessões sempre dão XP
  if (action === 'task' || action === 'session') {
    return true
  }

  const field = COOLDOWN_FIELDS[action]
  const lastDate = user[field] as Date | null

  if (!lastDate) {
    return true
  }

  // Para mood, verificar se passou 1 hora (3600000 ms)
  if (action === 'mood') {
    const ONE_HOUR_MS = 60 * 60 * 1000
    const now = new Date()
    const timeDiff = now.getTime() - new Date(lastDate).getTime()
    return timeDiff >= ONE_HOUR_MS
  }

  // Para outras ações (journal, meditation), verificar se é o mesmo dia
  return !isSameDay(lastDate, new Date())
}

/* ============================================
 * LÓGICA DE STREAK
 * ============================================ */

/**
 * Calcula o novo streak baseado na última atividade
 * O streak representa dias consecutivos de uso do app
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

  // Streak quebrado (mais de 1 dia sem atividade)
  return { newStreak: 1, newLongestStreak: longestStreak, streakUpdated: true }
}

/**
 * Obtém a última data de atividade do usuário
 * Considera a mais recente entre task, journal, meditation e mood
 */
function getLastActivityDate(user: InferSelectModel<typeof users>): Date | null {
  const dates = [
    user.lastTaskXpDate,
    user.lastJournalXpDate,
    user.lastMeditationXpDate,
    user.lastMoodXpDate,
  ].filter((d): d is Date => d !== null)

  if (dates.length === 0) {
    return null
  }

  return new Date(Math.max(...dates.map((d) => d.getTime())))
}

/* ============================================
 * LÓGICA DE GANHO DE XP E COINS
 * ============================================ */

export type XPResult = {
  xpAwarded: number
  coinsAwarded: number
  newExperience: number
  newCoins: number
  newLevel: number
  levelUp: boolean
  newStreak: number
  streakUpdated: boolean
}

/**
 * Calcula e aplica ganho de XP e coins para uma ação
 *
 * @param db - Instância do banco de dados
 * @param userId - ID do usuário
 * @param action - Tipo de ação realizada
 * @param priority - Prioridade da tarefa (apenas para tasks)
 * @returns Resultado com valores de XP, coins e nível atualizado
 */
export async function awardXPAndCoins(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  userId: string,
  action: XPAction,
  options?: {
    priority?: 'low' | 'medium' | 'high'
    meditationDuration?: number // duração em segundos
    daysOverdue?: number // dias de atraso para tarefas transferidas
  }
): Promise<XPResult> {
  const priority = options?.priority
  const meditationDuration = options?.meditationDuration
  const daysOverdue = options?.daysOverdue ?? 0

  // Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  // Buscar userStats para longestStreak
  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1)
  const currentLongestStreak = stats?.longestStreak || 0

  // Verificar se pode ganhar XP hoje
  const canGainXP = canAwardXP(user, action)

  // Calcular valores de recompensa
  let xpReward = 0
  let coinReward = 0

  if (action === 'task' && priority) {
    // Aplicar penalidade para tarefas atrasadas/transferidas
    const penaltyMultiplier = getOverduePenaltyMultiplier(daysOverdue, priority)
    xpReward = Math.round(XP_REWARDS.task[priority] * penaltyMultiplier)
    coinReward = Math.round(COIN_REWARDS.task[priority] * penaltyMultiplier)
  } else if (action === 'session') {
    // Sessão com terapeuta - 40 XP e 40 coins
    xpReward = XP_REWARDS.session
    coinReward = COIN_REWARDS.session
  } else if (action === 'journal') {
    xpReward = XP_REWARDS.journal
    coinReward = COIN_REWARDS.journal
  } else if (action === 'meditation') {
    // Usar duração para calcular recompensas se disponível
    if (meditationDuration) {
      const rewards = getMeditationRewards(meditationDuration)
      xpReward = rewards.xp
      coinReward = rewards.coins
    } else {
      xpReward = XP_REWARDS.meditation
      coinReward = COIN_REWARDS.meditation
    }
  } else if (action === 'mood') {
    xpReward = XP_REWARDS.mood
    coinReward = COIN_REWARDS.mood
  }

  // Inicializar resultado
  let xpAwarded = 0
  let coinsAwarded = 0
  let newExperience = user.experience
  let newCoins = user.coins
  let newLevel = user.level
  let levelUp = false

  // Calcular streak
  const lastActivityDate = getLastActivityDate(user)
  const { newStreak, newLongestStreak, streakUpdated } = calculateStreak(
    lastActivityDate,
    user.streak || 0,
    currentLongestStreak
  )

  // Preparar atualização do banco
  const now = new Date()
  const updateData: Record<string, Date | number> = {
    updatedAt: now,
  }

  // Aplicar XP se permitido
  if (canGainXP) {
    xpAwarded = xpReward
    newExperience = user.experience + xpAwarded
    newLevel = getLevelFromXP(newExperience)
    levelUp = newLevel > user.level

    updateData.experience = newExperience
    updateData.level = newLevel
    updateData[COOLDOWN_FIELDS[action]] = now
  }

  // Atualizar streak se mudou
  if (streakUpdated) {
    updateData.streak = newStreak
  }

  // Sempre aplicar coins (independente do cooldown de XP)
  coinsAwarded = coinReward
  newCoins = user.coins + coinsAwarded
  updateData.coins = newCoins

  // Atualizar banco de dados (users)
  await db.update(users).set(updateData).where(eq(users.id, userId))

  // Atualizar longestStreak no userStats se necessário
  if (streakUpdated && newLongestStreak > currentLongestStreak) {
    if (stats) {
      await db
        .update(userStats)
        .set({
          longestStreak: newLongestStreak,
          updatedAt: now,
        })
        .where(eq(userStats.userId, userId))
    } else {
      // Criar userStats se não existir
      await db.insert(userStats).values({
        userId,
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: newLongestStreak,
        updatedAt: now,
      })
    }
  }

  return {
    xpAwarded,
    coinsAwarded,
    newExperience,
    newCoins,
    newLevel,
    levelUp,
    newStreak,
    streakUpdated,
  }
}

/**
 * Adiciona XP diretamente ao usuário (sem cooldown ou validações)
 * Usado para recompensas especiais ou conquistas
 *
 * @param db - Instância do banco de dados
 * @param userId - ID do usuário
 * @param amount - Quantidade de XP a adicionar
 * @returns Nível e experiência atualizados
 */
export async function addRawXP(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  userId: string,
  amount: number
): Promise<{ level: number; experience: number }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  const newExperience = user.experience + amount
  const newLevel = getLevelFromXP(newExperience)

  await db
    .update(users)
    .set({
      experience: newExperience,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return { level: newLevel, experience: newExperience }
}

/**
 * Adiciona moedas diretamente ao usuário
 *
 * @param db - Instância do banco de dados
 * @param userId - ID do usuário
 * @param amount - Quantidade de coins a adicionar
 * @returns Total de moedas atualizado
 */
export async function addCoins(
  // biome-ignore lint/suspicious/noExplicitAny: aceitar qualquer tipo de banco de dados Drizzle
  db: any,
  userId: string,
  amount: number
): Promise<{ coins: number }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  const newCoins = user.coins + amount

  await db
    .update(users)
    .set({
      coins: newCoins,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return { coins: newCoins }
}

/* ============================================
 * INFORMAÇÕES DE PROGRESSO
 * ============================================ */

export type XPInfo = {
  currentXP: number
  currentLevel: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpInCurrentLevel: number
  xpToNextLevel: number
  progressPercent: number
}

/**
 * Obtém informações completas sobre o progresso de XP do usuário
 *
 * @param currentXP - XP atual do usuário
 * @returns Objeto com informações de progresso
 */
export function getXPInfo(currentXP: number): XPInfo {
  const currentLevel = getLevelFromXP(currentXP)
  const xpForCurrentLevel = getXPForLevel(currentLevel)
  const xpForNextLevel = getXPForLevel(currentLevel + 1)
  const xpInCurrentLevel = currentXP - xpForCurrentLevel
  const xpToNextLevel = xpForNextLevel - currentXP
  const progressPercent = getLevelProgress(currentXP)

  return {
    currentXP,
    currentLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel,
    xpToNextLevel,
    progressPercent,
  }
}
