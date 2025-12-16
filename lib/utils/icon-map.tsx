
import {
  Activity,
  Award,
  BarChart2,
  Book,
  Brain,
  Calendar,
  CheckCircle,
  Crown,
  DollarSign,
  FileText,
  Flame,
  Gift,
  Heart,
  Layout,
  MessageSquare,
  PenTool,
  Repeat,
  Shield,
  Smile,
  Star,
  Target,
  Trophy,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import type React from 'react'

export const getIconByKey = (key: string): React.ElementType => {
  const map: Record<string, React.ElementType> = {
    // Badges gerais
    evolution: Crown,
    tasks_general: CheckCircle,
    tasks_priority: Target,
    meditation: Brain,
    journal: Book,
    mood: Smile,
    consistency: Flame,
    rewards: Gift,
    engagement: Star,
    
    // Níveis
    level_2: Zap, // seedling -> Zap/Plant (using Zap as generic energy/start) or maybe Sprout if available? Lucide has Sprout.
    level_5: Star,
    level_10: Crown,
    
    // Tarefas
    tasks_1: Activity, // foot -> Activity? or Play?
    tasks_10: Zap, // rocket
    tasks_50: Flame,
    tasks_100: Target, // 100
    tasks_500: Trophy,
    
    // Prioridade
    priority_high: Activity, // siren
    priority_medium: Activity, // balance
    priority_low: Layout, // clipboard
    
    // Meditação
    meditation_session: Brain,
    meditation_time: Activity, // dove -> Activity/Heart/Brain?
    
    // Diário
    journal_entry: Book,
    journal_writer: PenTool,
    journal_reflection: Brain,
    journal_biographer: Book,
    
    // Humor
    mood_log: Smile,
    mood_week: Calendar,
    mood_month: Calendar,
    mood_master: Smile,
    
    // Consistência
    streak_fire: Flame,
    streak_calendar: Calendar,
    streak_muscle: Activity, // muscle -> Activity
    
    // Recompensas
    reward_gift: Gift,
    reward_gem: DollarSign, // gem -> Dollar/Diamond
    
    // Engajamento
    engagement_star: Star,
    
    // Therapist
    clinical_productivity: BarChart2,
    continuous_care: Heart,
    patient_engagement: Users,
    system_mastery: Shield,
    financial: DollarSign,
    challenges: Trophy,
    
    reports: FileText,
    tasks_created: PenTool,
    sessions: Video,
    patients_managed: Users,
    feedback: MessageSquare,
    goals: Target,
  }

  // Fallback for direct Lucide name mapping if desired, or default
  return map[key] || Star
}
