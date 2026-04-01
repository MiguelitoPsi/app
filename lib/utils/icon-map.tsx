import {
  RiAlertLine,
  RiBarChartLine,
  RiBellLine,
  RiBookLine,
  RiBox3Line,
  RiBrainLine,
  RiBuildingLine,
  RiCalendarLine,
  RiChat2Line,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiCupLine,
  RiWirelessChargingLine as RiElectricityLine,
  RiEmotionHappyLine,
  RiEmotionNormalLine,
  RiEmotionUnhappyLine,
  RiFileTextLine,
  RiFireLine,
  RiGiftLine,
  RiGraduationCapLine,
  RiHeartLine,
  RiHeartPulseLine,
  RiHomeLine,
  RiLayoutGridLine,
  RiLightbulbLine,
  RiLogoutBoxRLine,
  RiMapPinLine,
  RiMegaphoneLine,
  RiMoneyDollarCircleLine,
  RiMoonLine,
  RiPaletteLine,
  RiCake2Line as RiPartyPopperLine,
  RiPencilLine,
  RiPhoneLine,
  RiPushpinLine,
  RiQuestionLine,
  RiReceiptLine,
  RiRefreshLine,
  RiSearchLine,
  RiSettings2Line,
  RiShieldLine,
  RiSparklingLine,
  RiStarLine,
  RiTargetLine,
  RiTeamLine,
  RiTimerLine,
  RiTrophyLine,
  RiVideoLine,
  RiVipCrownLine,
  RiVipDiamondLine,
} from '@remixicon/react'
import type React from 'react'

export type RemixIconType = React.ComponentType<{
  className?: string
  size?: number | string
  [key: string]: any
}>

export const getIconByKey = (key: string): RemixIconType => {
  const map: Record<string, RemixIconType> = {
    // Badges gerais
    evolution: RiVipCrownLine,
    tasks_general: RiCheckboxCircleLine,
    tasks_priority: RiTargetLine,
    meditation: RiBrainLine,
    journal: RiBookLine,
    mood: RiEmotionHappyLine,
    consistency: RiFireLine,
    rewards: RiGiftLine,
    engagement: RiStarLine,

    // Níveis
    level_2: RiElectricityLine,
    level_5: RiStarLine,
    level_10: RiVipCrownLine,

    // Tarefas
    tasks_1: RiHeartPulseLine,
    tasks_10: RiElectricityLine,
    tasks_50: RiFireLine,
    tasks_100: RiTargetLine,
    tasks_500: RiTrophyLine,

    // Prioridade
    priority_high: RiHeartPulseLine,
    priority_medium: RiHeartPulseLine,
    priority_low: RiLayoutGridLine,

    // Meditação
    meditation_session: RiBrainLine,
    meditation_time: RiHeartPulseLine,

    // Diário
    journal_entry: RiBookLine,
    journal_writer: RiPencilLine,
    journal_reflection: RiBrainLine,
    journal_biographer: RiBookLine,

    // Humor
    mood_log: RiEmotionHappyLine,
    mood_week: RiCalendarLine,
    mood_month: RiCalendarLine,
    mood_master: RiEmotionHappyLine,

    // Consistência
    streak_fire: RiFireLine,
    streak_calendar: RiCalendarLine,
    streak_muscle: RiHeartPulseLine,

    // Recompensas
    reward_gift: RiGiftLine,
    reward_gem: RiVipDiamondLine,

    // Engajamento
    engagement_star: RiStarLine,

    // Moods (Direct)
    happy: RiEmotionHappyLine,
    excited: RiElectricityLine,
    grateful: RiHeartLine,
    calm: RiMoonLine,
    neutral: RiEmotionNormalLine,
    tired: RiTimerLine,
    bored: RiCupLine,
    sad: RiEmotionUnhappyLine,
    anxious: RiHeartPulseLine,
    fearful: RiShieldLine,
    angry: RiFireLine,
    disgusted: RiAlertLine,

    // Therapist
    clinical_productivity: RiBarChartLine,
    continuous_care: RiHeartLine,
    patient_engagement: RiTeamLine,
    system_mastery: RiShieldLine,
    financial_nav: RiMoneyDollarCircleLine, // Changed from financial to avoid potential conflict if any
    challenges: RiTrophyLine,

    reports: RiFileTextLine,
    tasks_created: RiPencilLine,
    sessions: RiVideoLine,
    patients_managed: RiTeamLine,
    feedback: RiChat2Line,
    goals: RiTargetLine,

    // UI elements
    dashboard: RiBarChartLine,
    routine: RiCalendarLine,
    reports_nav: RiFileTextLine,
    finance: RiMoneyDollarCircleLine,
    achievements: RiTrophyLine,
    settings: RiSettings2Line,
    logout: RiLogoutBoxRLine,
    help: RiQuestionLine,
    notification: RiBellLine,
    location: RiMapPinLine,
    thought: RiBrainLine,
    meaning: RiTargetLine,
    behavior: RiHeartPulseLine,
    observations: RiFileTextLine,
    package: RiBox3Line,
    refresh: RiRefreshLine,
    warning: RiAlertLine,
    fire: RiFireLine,
    success: RiCheckboxCircleLine,
    consultation: RiLightbulbLine,
    subscription: RiPhoneLine,
    rent: RiHomeLine,
    utilities: RiLightbulbLine,
    equipment: RiBuildingLine,
    software: RiBuildingLine,
    marketing: RiMegaphoneLine,
    training: RiGraduationCapLine,
    material: RiPaletteLine,
    insurance: RiShieldLine,
    taxes: RiReceiptLine,
    other_finance: RiPushpinLine,
    celebration: RiPartyPopperLine,
    sparkles: RiSparklingLine,
    diamond: RiVipDiamondLine,
    total_psychologists: RiBrainLine,
    active_subscriptions: RiCheckboxCircleLine,
    expiring_subscriptions: RiAlertLine,
    expired_subscriptions: RiCloseLine,
    monthly_revenue: RiMoneyDollarCircleLine,

    // Dashboard new icons
    clients: RiTeamLine,
    agenda: RiCalendarLine,
    video: RiVideoLine,
    search: RiSearchLine,
    upgrade: RiSparklingLine,
  }

  return map[key] || RiStarLine
}
