
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  Bell,
  Book,
  Brain,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Coffee,
  Crown,
  Diamond,
  DollarSign,
  FileText,
  Flame,
  Frown,
  Gift,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Layout,
  Lightbulb,
  LogOut,
  MapPin,
  Megaphone,
  Meh,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  Palette,
  PartyPopper,
  PenTool,
  Phone,
  Pin,
  Receipt,
  RefreshCw,
  Repeat,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  Users,
  Video,
  XCircle,
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
    level_2: Zap,
    level_5: Star,
    level_10: Crown,

    // Tarefas
    tasks_1: Activity,
    tasks_10: Zap,
    tasks_50: Flame,
    tasks_100: Target,
    tasks_500: Trophy,

    // Prioridade
    priority_high: Activity,
    priority_medium: Activity,
    priority_low: Layout,

    // Meditação
    meditation_session: Brain,
    meditation_time: Activity,

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
    streak_muscle: Activity,

    // Recompensas
    reward_gift: Gift,
    reward_gem: DollarSign,

    // Engajamento
    engagement_star: Star,

    // Moods (Direct)
    happy: Smile,
    excited: Zap,
    grateful: Heart,
    calm: Moon,
    neutral: Meh,
    tired: Clock,
    bored: Coffee,
    sad: Frown,
    anxious: Activity,
    fearful: Shield,
    angry: Flame,
    disgusted: AlertTriangle,

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

    // UI elements
    dashboard: BarChart2,
    routine: Calendar,
    reports_nav: FileText,
    finance: DollarSign,
    achievements: Trophy,
    settings: Settings,
    logout: LogOut,
    help: HelpCircle,
    notification: Bell,
    location: MapPin,
    thought: Brain,
    meaning: Target,
    behavior: Activity,
    observations: FileText,
    package: Package,
    refresh: RefreshCw,
    warning: AlertTriangle,
    fire: Flame,
    success: CheckCircle,
    consultation: Lightbulb,
    subscription: Phone,
    rent: Home,
    utilities: Lightbulb,
    equipment: Monitor,
    software: Monitor,
    marketing: Megaphone,
    training: GraduationCap,
    material: Palette,
    insurance: Shield,
    taxes: Receipt,
    other_finance: Pin,
    celebration: PartyPopper,
    sparkles: Sparkles,
    diamond: Diamond,
    total_psychologists: Brain,
    active_subscriptions: CheckCircle,
    expiring_subscriptions: AlertTriangle,
    expired_subscriptions: XCircle,
    monthly_revenue: DollarSign,

    // Dashboard new icons
    clients: Users,
    agenda: Calendar,
    marketing: Megaphone,
    video: Video,
    search: Activity,
    upgrade: Sparkles,
  }

  // Fallback for direct Lucide name mapping if desired, or default
  return map[key] || Star
}
