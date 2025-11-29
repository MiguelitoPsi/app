'use client'

import { useTherapistGame } from '@/context/TherapistGameContext'
import { getTherapistRankForLevel } from '@/lib/constants/therapist'
import TherapistLevelUpModal from './TherapistLevelUpModal'

/**
 * TherapistLevelUpManager - Gerenciador de level up para terapeutas
 *
 * Detecta quando o terapeuta sobe de nível via TherapistGameContext
 * e exibe o modal celebratório com o novo rank e benefícios.
 */
export function TherapistLevelUpManager() {
  const { levelUp, clearLevelUp } = useTherapistGame()

  if (!levelUp.triggered) return null

  const rank = getTherapistRankForLevel(levelUp.newLevel)

  return <TherapistLevelUpModal newLevel={levelUp.newLevel} onClose={clearLevelUp} rank={rank} />
}

export default TherapistLevelUpManager
