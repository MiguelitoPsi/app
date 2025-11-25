/**
 * Sistema de XP e Gamificação
 *
 * Este arquivo centraliza toda a lógica de experiência (XP), moedas (coins),
 * níveis e condições de ganho do sistema de gamificação.
 */

import type { InferSelectModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { users } from '@/lib/db/schema'
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
  journal: 30,
  meditation: 30,
  mood: 0, // Mood não ganha coins, apenas XP
} as const

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

export type XPAction = 'task' | 'journal' | 'meditation' | 'mood'

/**
 * Mapeia ações para os campos de timestamp no banco de dados
 */
const COOLDOWN_FIELDS: Record<XPAction, keyof typeof users.$inferSelect> = {
  task: 'lastTaskXpDate',
  journal: 'lastJournalXpDate',
  meditation: 'lastMeditationXpDate',
  mood: 'lastMoodXpDate',
}

/**
 * Verifica se o usuário pode ganhar XP para uma ação específica
 * - Mood: Limite de 1 vez por hora
 * - Outras ações: Limite de 1 vez por dia
 *
 * @param user - Objeto do usuário do banco de dados
 * @param action - Tipo de ação
 * @returns true se pode ganhar XP, false se ainda está em cooldown
 */
export function canAwardXP(user: InferSelectModel<typeof users>, action: XPAction): boolean {
  // Tasks sempre dão XP
  if (action === 'task') {
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

  // Para outras ações, verificar se é o mesmo dia
  return !isSameDay(lastDate, new Date())
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
  priority?: 'low' | 'medium' | 'high'
): Promise<XPResult> {
  // Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  // Verificar se pode ganhar XP hoje
  const canGainXP = canAwardXP(user, action)

  // Calcular valores de recompensa
  let xpReward = 0
  let coinReward = 0

  if (action === 'task' && priority) {
    xpReward = XP_REWARDS.task[priority]
    coinReward = COIN_REWARDS.task[priority]
  } else if (action === 'journal') {
    xpReward = XP_REWARDS.journal
    coinReward = COIN_REWARDS.journal
  } else if (action === 'meditation') {
    xpReward = XP_REWARDS.meditation
    coinReward = COIN_REWARDS.meditation
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

  // Sempre aplicar coins (independente do cooldown de XP)
  coinsAwarded = coinReward
  newCoins = user.coins + coinsAwarded
  updateData.coins = newCoins

  // Atualizar banco de dados
  await db.update(users).set(updateData).where(eq(users.id, userId))

  return {
    xpAwarded,
    coinsAwarded,
    newExperience,
    newCoins,
    newLevel,
    levelUp,
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
