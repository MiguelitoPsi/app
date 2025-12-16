/**
 * Constantes e definições para o sistema de gamificação do terapeuta
 */

import type { TherapistStats } from '@/lib/db/schema'

/* ============================================
 * CATEGORIAS DE CONQUISTAS DO TERAPEUTA
 * ============================================ */

export type TherapistBadgeCategory =
  | 'clinical_productivity'
  | 'continuous_care'
  | 'patient_engagement'
  | 'system_mastery'
  | 'financial'
  | 'challenges'

export const THERAPIST_BADGE_CATEGORIES: Record<
  TherapistBadgeCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  clinical_productivity: {
    label: 'Produtividade Clínica',
    icon: 'clinical_productivity',
    color: 'text-blue-500',
    description: 'Conquistas relacionadas a relatórios, tarefas e sessões',
  },
  continuous_care: {
    label: 'Cuidado Contínuo',
    icon: 'continuous_care',
    color: 'text-emerald-500',
    description: 'Conquistas de acompanhamento consistente dos pacientes',
  },
  patient_engagement: {
    label: 'Engajamento com Pacientes',
    icon: 'patient_engagement',
    color: 'text-purple-500',
    description: 'Conquistas de interação e feedback com pacientes',
  },
  system_mastery: {
    label: 'Domínio do Sistema',
    icon: 'system_mastery',
    color: 'text-amber-500',
    description: 'Conquistas de uso avançado das funcionalidades',
  },
  financial: {
    label: 'Gestão Financeira',
    icon: 'financial',
    color: 'text-green-500',
    description: 'Conquistas relacionadas a metas financeiras',
  },
  challenges: {
    label: 'Desafios Semanais',
    icon: 'challenges',
    color: 'text-orange-500',
    description: 'Conquistas de desafios completados',
  },
}

/* ============================================
 * DEFINIÇÕES DE CONQUISTAS DO TERAPEUTA
 * ============================================ */

export type TherapistBadgeDefinition = {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  category: TherapistBadgeCategory
  metric: keyof TherapistStats | 'level' | 'challengesCompleted' | 'goalsAchieved' | 'auto'
  xpReward: number
}

export const THERAPIST_BADGE_DEFINITIONS: TherapistBadgeDefinition[] = [
  // ==========================================
  // PRODUTIVIDADE CLÍNICA
  // ==========================================

  // Relatórios revisados
  {
    id: 'reports_10',
    name: 'Analista Iniciante',
    description: 'Revisou 10 relatórios de pacientes',
    icon: 'reports',
    requirement: 10,
    category: 'clinical_productivity',
    metric: 'totalReportsViewed',
    xpReward: 50,
  },
  {
    id: 'reports_50',
    name: 'Analista Dedicado',
    description: 'Revisou 50 relatórios de pacientes',
    icon: 'reports',
    requirement: 50,
    category: 'clinical_productivity',
    metric: 'totalReportsViewed',
    xpReward: 100,
  },
  {
    id: 'reports_100',
    name: 'Analista Expert',
    description: 'Revisou 100 relatórios de pacientes',
    icon: 'reports',
    requirement: 100,
    category: 'clinical_productivity',
    metric: 'totalReportsViewed',
    xpReward: 200,
  },

  // Tarefas criadas
  {
    id: 'tasks_created_10',
    name: 'Planejador Iniciante',
    description: 'Criou 10 tarefas para pacientes',
    icon: 'tasks_created',
    requirement: 10,
    category: 'clinical_productivity',
    metric: 'totalTasksCreated',
    xpReward: 50,
  },
  {
    id: 'tasks_created_50',
    name: 'Planejador Ativo',
    description: 'Criou 50 tarefas para pacientes',
    icon: 'tasks_created',
    requirement: 50,
    category: 'clinical_productivity',
    metric: 'totalTasksCreated',
    xpReward: 100,
  },
  {
    id: 'tasks_created_100',
    name: 'Mestre do Planejamento',
    description: 'Criou 100 tarefas para pacientes',
    icon: 'tasks_created',
    requirement: 100,
    category: 'clinical_productivity',
    metric: 'totalTasksCreated',
    xpReward: 200,
  },

  // Sessões finalizadas
  {
    id: 'sessions_10',
    name: 'Terapeuta em Ação',
    description: 'Finalizou 10 sessões no app',
    icon: 'sessions',
    requirement: 10,
    category: 'clinical_productivity',
    metric: 'totalSessionsCompleted',
    xpReward: 75,
  },
  {
    id: 'sessions_30',
    name: 'Terapeuta Dedicado',
    description: 'Finalizou 30 sessões no app',
    icon: 'sessions',
    requirement: 30,
    category: 'clinical_productivity',
    metric: 'totalSessionsCompleted',
    xpReward: 150,
  },
  {
    id: 'sessions_100',
    name: 'Terapeuta Experiente',
    description: 'Finalizou 100 sessões no app',
    icon: 'sessions',
    requirement: 100,
    category: 'clinical_productivity',
    metric: 'totalSessionsCompleted',
    xpReward: 300,
  },

  // ==========================================
  // CUIDADO CONTÍNUO
  // ==========================================

  // Streak de análise
  {
    id: 'streak_7',
    name: 'Semana Dedicada',
    description: '7 dias seguidos analisando registros',
    icon: 'streak_fire',
    requirement: 7,
    category: 'continuous_care',
    metric: 'currentStreak',
    xpReward: 100,
  },
  {
    id: 'streak_14',
    name: 'Quinzena Consistente',
    description: '14 dias seguidos de atividade',
    icon: 'streak_fire',
    requirement: 14,
    category: 'continuous_care',
    metric: 'currentStreak',
    xpReward: 200,
  },
  {
    id: 'streak_30',
    name: 'Mês Impecável',
    description: '30 dias seguidos de atividade',
    icon: 'streak_fire',
    requirement: 30,
    category: 'continuous_care',
    metric: 'currentStreak',
    xpReward: 400,
  },

  // Pacientes gerenciados
  {
    id: 'patients_5',
    name: 'Equipe Inicial',
    description: 'Gerenciando 5 pacientes',
    icon: 'patients_managed',
    requirement: 5,
    category: 'continuous_care',
    metric: 'totalPatientsManaged',
    xpReward: 75,
  },
  {
    id: 'patients_10',
    name: 'Equipe em Crescimento',
    description: 'Gerenciando 10 pacientes',
    icon: 'patients_managed',
    requirement: 10,
    category: 'continuous_care',
    metric: 'totalPatientsManaged',
    xpReward: 150,
  },
  {
    id: 'patients_20',
    name: 'Consultório Cheio',
    description: 'Gerenciando 20 pacientes',
    icon: 'patients_managed',
    requirement: 20,
    category: 'continuous_care',
    metric: 'totalPatientsManaged',
    xpReward: 300,
  },

  // ==========================================
  // ENGAJAMENTO COM PACIENTES
  // ==========================================

  // Recompensas aprovadas
  {
    id: 'rewards_approved_10',
    name: 'Motivador',
    description: 'Aprovou 10 recompensas de pacientes',
    icon: 'reward_gift',
    requirement: 10,
    category: 'patient_engagement',
    metric: 'totalRewardsApproved',
    xpReward: 75,
  },
  {
    id: 'rewards_approved_25',
    name: 'Incentivador',
    description: 'Aprovou 25 recompensas de pacientes',
    icon: 'reward_gift',
    requirement: 25,
    category: 'patient_engagement',
    metric: 'totalRewardsApproved',
    xpReward: 150,
  },
  {
    id: 'rewards_approved_50',
    name: 'Campeão do Reforço',
    description: 'Aprovou 50 recompensas de pacientes',
    icon: 'reward_gift',
    requirement: 50,
    category: 'patient_engagement',
    metric: 'totalRewardsApproved',
    xpReward: 250,
  },

  // Feedback enviado
  {
    id: 'feedback_5',
    name: 'Comunicador',
    description: 'Enviou 5 feedbacks semanais',
    icon: 'feedback',
    requirement: 5,
    category: 'patient_engagement',
    metric: 'totalFeedbackSent',
    xpReward: 75,
  },
  {
    id: 'feedback_15',
    name: 'Orientador',
    description: 'Enviou 15 feedbacks semanais',
    icon: 'feedback',
    requirement: 15,
    category: 'patient_engagement',
    metric: 'totalFeedbackSent',
    xpReward: 150,
  },
  {
    id: 'feedback_30',
    name: 'Mentor Excepcional',
    description: 'Enviou 30 feedbacks semanais',
    icon: 'feedback',
    requirement: 30,
    category: 'patient_engagement',
    metric: 'totalFeedbackSent',
    xpReward: 300,
  },

  // ==========================================
  // DOMÍNIO DO SISTEMA
  // ==========================================

  // Relatórios clínicos
  {
    id: 'clinical_reports_5',
    name: 'Documentador',
    description: 'Criou 5 relatórios clínicos',
    icon: 'reports',
    requirement: 5,
    category: 'system_mastery',
    metric: 'totalClinicalReports',
    xpReward: 100,
  },
  {
    id: 'clinical_reports_15',
    name: 'Registrador Avançado',
    description: 'Criou 15 relatórios clínicos',
    icon: 'reports',
    requirement: 15,
    category: 'system_mastery',
    metric: 'totalClinicalReports',
    xpReward: 200,
  },

  // Primeiro uso de IA
  {
    id: 'first_ai_plan',
    name: 'Parceiro da IA',
    description: 'Primeiro Plano Terapêutico criado pela IA e editado',
    icon: 'meditation',
    requirement: 1,
    category: 'system_mastery',
    metric: 'auto',
    xpReward: 100,
  },
  {
    id: 'first_cognitive_review',
    name: 'Analista Cognitivo',
    description: 'Primeira conceituação cognitiva revisada',
    icon: 'meditation_session',
    requirement: 1,
    category: 'system_mastery',
    metric: 'auto',
    xpReward: 100,
  },

  // Níveis
  {
    id: 'level_5',
    name: 'Profissional em Evolução',
    description: 'Alcançou nível 5',
    icon: 'mood_star',
    requirement: 5,
    category: 'system_mastery',
    metric: 'level',
    xpReward: 150,
  },
  {
    id: 'level_10',
    name: 'Expert do Sistema',
    description: 'Alcançou nível 10',
    icon: 'mood_star',
    requirement: 10,
    category: 'system_mastery',
    metric: 'level',
    xpReward: 300,
  },

  // ==========================================
  // GESTÃO FINANCEIRA
  // ==========================================

  {
    id: 'first_goal',
    name: 'Visionário',
    description: 'Definiu sua primeira meta financeira',
    icon: 'goals',
    requirement: 1,
    category: 'financial',
    metric: 'goalsAchieved',
    xpReward: 50,
  },
  {
    id: 'goals_3',
    name: 'Estrategista',
    description: 'Alcançou 3 metas profissionais',
    icon: 'goals',
    requirement: 3,
    category: 'financial',
    metric: 'goalsAchieved',
    xpReward: 150,
  },
  {
    id: 'goals_10',
    name: 'Realizador de Sonhos',
    description: 'Alcançou 10 metas profissionais',
    icon: 'goals',
    requirement: 10,
    category: 'financial',
    metric: 'goalsAchieved',
    xpReward: 400,
  },

  // ==========================================
  // DESAFIOS SEMANAIS
  // ==========================================

  {
    id: 'challenges_1',
    name: 'Primeiro Desafio',
    description: 'Completou seu primeiro desafio semanal',
    icon: 'challenges',
    requirement: 1,
    category: 'challenges',
    metric: 'challengesCompleted',
    xpReward: 50,
  },
  {
    id: 'challenges_5',
    name: 'Desafiador',
    description: 'Completou 5 desafios semanais',
    icon: 'challenges',
    requirement: 5,
    category: 'challenges',
    metric: 'challengesCompleted',
    xpReward: 150,
  },
  {
    id: 'challenges_10',
    name: 'Mestre dos Desafios',
    description: 'Completou 10 desafios semanais',
    icon: 'challenges',
    requirement: 10,
    category: 'challenges',
    metric: 'challengesCompleted',
    xpReward: 300,
  },
  {
    id: 'challenges_25',
    name: 'Lenda dos Desafios',
    description: 'Completou 25 desafios semanais',
    icon: 'challenges',
    requirement: 25,
    category: 'challenges',
    metric: 'challengesCompleted',
    xpReward: 500,
  },
]

/* ============================================
 * RANKS DO TERAPEUTA
 * ============================================ */

export type TherapistRankDefinition = {
  level: number
  name: string
  minXp: number
  description: string
  icon: string
  benefits: string[]
}

export const THERAPIST_RANKS: TherapistRankDefinition[] = [
  {
    level: 1,
    name: 'Terapeuta Iniciante',
    minXp: 0,
    description: 'Começando sua jornada de crescimento profissional.',
    icon: 'level_2',
    benefits: ['Acesso básico ao sistema', 'Até 5 pacientes'],
  },
  {
    level: 2,
    name: 'Terapeuta em Desenvolvimento',
    minXp: 150,
    description: 'Desenvolvendo suas habilidades de acompanhamento.',
    icon: 'journal_biographer',
    benefits: ['Relatórios básicos de IA', 'Até 10 pacientes'],
  },
  {
    level: 3,
    name: 'Terapeuta Dedicado',
    minXp: 450,
    description: 'Demonstrando comprometimento com seus pacientes.',
    icon: 'sessions',
    benefits: ['Desafios semanais', 'Gestão financeira básica'],
  },
  {
    level: 4,
    name: 'Terapeuta Experiente',
    minXp: 900,
    description: 'Experiência sólida no uso das ferramentas.',
    icon: 'level_5',
    benefits: ['Relatórios avançados de IA', 'Metas personalizadas'],
  },
  {
    level: 5,
    name: 'Terapeuta Avançado',
    minXp: 1500,
    description: 'Domínio completo das funcionalidades.',
    icon: 'challenges',
    benefits: ['IA Coach personalizado', 'Insights preditivos'],
  },
  {
    level: 6,
    name: 'Terapeuta Expert',
    minXp: 2250,
    description: 'Referência em uso do sistema.',
    icon: 'system_mastery',
    benefits: ['Análises comparativas', 'Pacientes ilimitados'],
  },
  {
    level: 7,
    name: 'Mestre Terapeuta',
    minXp: 3000,
    description: 'Excelência no cuidado e gestão profissional.',
    icon: 'evolution',
    benefits: ['Todos os recursos premium', 'Suporte prioritário'],
  },
]

/**
 * Obtém o rank atual baseado no nível
 */
export function getTherapistRankForLevel(level: number): TherapistRankDefinition {
  for (let i = THERAPIST_RANKS.length - 1; i >= 0; i--) {
    if (level >= THERAPIST_RANKS[i].level) {
      return THERAPIST_RANKS[i]
    }
  }
  return THERAPIST_RANKS[0]
}

/* ============================================
 * DEFINIÇÕES DE DESAFIOS SEMANAIS
 * ============================================ */

export type WeeklyChallengeTemplate = {
  id: string
  title: string
  description: string
  type:
    | 'review_records'
    | 'send_feedback'
    | 'create_tasks'
    | 'approve_rewards'
    | 'complete_sessions'
    | 'financial'
  targetCount: number
  xpReward: number
  bonusMultiplier: number
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const WEEKLY_CHALLENGE_TEMPLATES: WeeklyChallengeTemplate[] = [
  // Fáceis
  {
    id: 'review_all_patients',
    title: 'Revisão Completa',
    description: 'Revisar registros de todos os seus pacientes esta semana',
    type: 'review_records',
    targetCount: 5,
    xpReward: 50,
    bonusMultiplier: 1,
    icon: 'reports',
    difficulty: 'easy',
  },
  {
    id: 'approve_pending_rewards',
    title: 'Motivação Express',
    description: 'Aprovar todas as recompensas pendentes',
    type: 'approve_rewards',
    targetCount: 3,
    xpReward: 40,
    bonusMultiplier: 1,
    icon: 'reward_gift',
    difficulty: 'easy',
  },

  // Médios
  {
    id: 'feedback_48h',
    title: 'Feedback Ágil',
    description: 'Enviar feedback dentro de 48h após cada sessão',
    type: 'send_feedback',
    targetCount: 3,
    xpReward: 75,
    bonusMultiplier: 1.5,
    icon: 'streak_fire',
    difficulty: 'medium',
  },
  {
    id: 'create_behavior_tasks',
    title: 'Mudança de Comportamento',
    description: 'Criar 3 tarefas focadas em mudança de comportamento',
    type: 'create_tasks',
    targetCount: 3,
    xpReward: 60,
    bonusMultiplier: 1.5,
    icon: 'goals',
    difficulty: 'medium',
  },
  {
    id: 'complete_all_sessions',
    title: 'Semana Completa',
    description: 'Registrar todas as sessões agendadas como concluídas',
    type: 'complete_sessions',
    targetCount: 5,
    xpReward: 80,
    bonusMultiplier: 1.5,
    icon: 'tasks_general',
    difficulty: 'medium',
  },

  // Difíceis
  {
    id: 'super_week',
    title: 'Super Semana',
    description: 'Revisar registros, enviar feedback e aprovar recompensas para todos os pacientes',
    type: 'review_records',
    targetCount: 10,
    xpReward: 150,
    bonusMultiplier: 2,
    icon: 'mood_star',
    difficulty: 'hard',
  },
  {
    id: 'financial_control',
    title: 'Controle Total',
    description: 'Atualizar todos os registros financeiros da semana',
    type: 'financial',
    targetCount: 7,
    xpReward: 100,
    bonusMultiplier: 2,
    icon: 'financial',
    difficulty: 'hard',
  },
]

/* ============================================
 * TIPOS DE METAS PROFISSIONAIS
 * ============================================ */

export type GoalCategory =
  | 'schedule'
  | 'revenue'
  | 'retention'
  | 'expansion'
  | 'professional_development'

export const GOAL_CATEGORIES: Record<GoalCategory, { label: string; icon: string; color: string }> =
  {
    schedule: {
      label: 'Lotar Agenda',
      icon: 'sessions',
      color: 'text-blue-500',
    },
    revenue: {
      label: 'Aumentar Faturamento',
      icon: 'financial',
      color: 'text-green-500',
    },
    retention: {
      label: 'Melhorar Retenção',
      icon: 'patient_engagement',
      color: 'text-purple-500',
    },
    expansion: {
      label: 'Expandir Consultório',
      icon: 'goals',
      color: 'text-amber-500',
    },
    professional_development: {
      label: 'Desenvolvimento Profissional',
      icon: 'system_mastery',
      color: 'text-indigo-500',
    },
  }

export const GOAL_SUGGESTIONS: Array<{
  category: GoalCategory
  title: string
  description: string
  suggestedTarget: number
  unit: string
}> = [
  {
    category: 'schedule',
    title: 'Preencher horários vagos',
    description: 'Alcançar X sessões por semana',
    suggestedTarget: 20,
    unit: 'sessões/semana',
  },
  {
    category: 'schedule',
    title: 'Reduzir faltas',
    description: 'Manter taxa de comparecimento acima de X%',
    suggestedTarget: 90,
    unit: '%',
  },
  {
    category: 'revenue',
    title: 'Aumentar valor da sessão',
    description: 'Aumentar valor médio para R$X',
    suggestedTarget: 200,
    unit: 'R$',
  },
  {
    category: 'revenue',
    title: 'Meta de faturamento mensal',
    description: 'Alcançar R$X de faturamento',
    suggestedTarget: 10_000,
    unit: 'R$',
  },
  {
    category: 'retention',
    title: 'Aumentar retenção',
    description: 'Manter X% dos pacientes por mais de 3 meses',
    suggestedTarget: 80,
    unit: '%',
  },
  {
    category: 'expansion',
    title: 'Novos pacientes',
    description: 'Conquistar X novos pacientes este mês',
    suggestedTarget: 5,
    unit: 'pacientes',
  },
  {
    category: 'professional_development',
    title: 'Horas de estudo',
    description: 'Dedicar X horas para capacitação',
    suggestedTarget: 10,
    unit: 'horas/mês',
  },
]

/* ============================================
 * CATEGORIAS FINANCEIRAS
 * ============================================ */

export type FinancialCategory =
  | 'session'
  | 'plan'
  | 'workshop'
  | 'supervision'
  | 'consultation'
  | 'subscription'
  | 'rent'
  | 'equipment'
  | 'marketing'
  | 'training'
  | 'taxes'
  | 'utilities'
  | 'insurance'
  | 'software'
  | 'material'
  | 'other'

export const FINANCIAL_CATEGORIES: Record<
  FinancialCategory,
  { label: string; icon: string; type: 'income' | 'expense' | 'both'; description?: string }
> = {
  // Receitas
  session: {
    label: 'Sessões',
    icon: 'sessions',
    type: 'income',
    description: 'Sessões de terapia individuais',
  },
  plan: {
    label: 'Pacotes/Planos',
    icon: 'reward_gift',
    type: 'income',
    description: 'Pacotes mensais ou semanais de sessões',
  },
  workshop: {
    label: 'Workshops/Cursos',
    icon: 'system_mastery',
    type: 'income',
    description: 'Workshops, palestras e cursos ministrados',
  },
  supervision: {
    label: 'Supervisão',
    icon: 'patient_engagement',
    type: 'income',
    description: 'Supervisão clínica para outros profissionais',
  },
  consultation: {
    label: 'Consultoria',
    icon: '💡',
    type: 'income',
    description: 'Consultoria para empresas ou instituições',
  },

  // Despesas
  subscription: {
    label: 'Assinaturas',
    icon: '📱',
    type: 'expense',
    description: 'Softwares, plataformas e serviços por assinatura',
  },
  rent: {
    label: 'Aluguel',
    icon: '🏠',
    type: 'expense',
    description: 'Aluguel do consultório ou coworking',
  },
  utilities: {
    label: 'Contas',
    icon: '💡',
    type: 'expense',
    description: 'Água, luz, internet, telefone',
  },
  equipment: {
    label: 'Equipamentos',
    icon: '🖥️',
    type: 'expense',
    description: 'Computador, móveis, decoração',
  },
  software: {
    label: 'Software',
    icon: '💻',
    type: 'expense',
    description: 'Licenças de software, sistemas de gestão',
  },
  marketing: {
    label: 'Marketing',
    icon: '📣',
    type: 'expense',
    description: 'Publicidade, site, redes sociais',
  },
  training: {
    label: 'Capacitação',
    icon: '📚',
    type: 'expense',
    description: 'Cursos, especializações, congressos',
  },
  material: {
    label: 'Materiais',
    icon: '🎨',
    type: 'expense',
    description: 'Materiais de escritório, testes psicológicos',
  },
  insurance: {
    label: 'Seguros',
    icon: '🛡️',
    type: 'expense',
    description: 'Seguro profissional, plano de saúde',
  },
  taxes: {
    label: 'Impostos',
    icon: '📋',
    type: 'expense',
    description: 'ISS, IR, contribuições obrigatórias',
  },

  // Ambos
  other: {
    label: 'Outros',
    icon: '📌',
    type: 'both',
    description: 'Outras receitas ou despesas não categorizadas',
  },
}
