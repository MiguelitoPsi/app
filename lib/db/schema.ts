import { relations, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  role: text('role', { enum: ['admin', 'psychologist', 'patient'] })
    .notNull()
    .default('patient'),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  coins: integer('coins').notNull().default(0),
  lastTaskXpDate: integer('last_task_xp_date', { mode: 'timestamp' }),
  lastJournalXpDate: integer('last_journal_xp_date', { mode: 'timestamp' }),
  journalXpCountToday: integer('journal_xp_count_today').notNull().default(0),
  lastMeditationXpDate: integer('last_meditation_xp_date', {
    mode: 'timestamp',
  }),
  lastMoodXpDate: integer('last_mood_xp_date', { mode: 'timestamp' }),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
  preferences: text('preferences', { mode: 'json' }).$type<{
    notifications?: boolean
    pushNotifications?: boolean
    theme?: 'light' | 'dark'
    language?: string
    avatar_config?: {
      accessory: string
      shirtColor: string
    }
  }>(),
  termsAcceptedAt: integer('terms_accepted_at', { mode: 'timestamp' }),
  bannedAt: integer('banned_at', { mode: 'timestamp' }),
  banReason: text('ban_reason'),
  // Para identificar pacientes suspensos em cadeia quando terapeuta é suspenso
  suspendedByTherapistId: text('suspended_by_therapist_id'),
  // Para distinguir entre suspensão admin e desvinculação de terapeuta
  unlinkReason: text('unlink_reason', { enum: ['unlinked', 'discharged'] }),
  unlinkedByTherapistId: text('unlinked_by_therapist_id'),
  unlinkedByTherapistName: text('unlinked_by_therapist_name'),
  // Soft delete - conta excluída pelo admin
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedReason: text('deleted_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  password: text('password'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  originalDueDate: integer('original_due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  experience: integer('experience').notNull().default(10),
  coins: integer('coins').notNull().default(5),
  frequency: text('frequency', {
    enum: ['once', 'daily', 'weekly', 'monthly'],
  }).default('once'),
  weekDays: text('week_days', { mode: 'json' }).$type<number[]>(),
  monthDays: text('month_days', { mode: 'json' }).$type<number[]>(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  metadata: text('metadata', { mode: 'json' }).$type<{
    icon?: string
    color?: string
    tags?: string[]
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  mood: text('mood'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  aiAnalysis: text('ai_analysis'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  therapistFeedback: text('therapist_feedback'),
  feedbackViewed: integer('feedback_viewed', { mode: 'boolean' }).default(false),
  feedbackAt: integer('feedback_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const rewards = sqliteTable('rewards', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('lazer'),
  cost: integer('cost').notNull(),
  claimed: integer('claimed', { mode: 'boolean' }).notNull().default(false),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const meditationSessions = sqliteTable('meditation_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  duration: integer('duration').notNull(),
  type: text('type').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const userStats = sqliteTable('user_stats', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  totalMeditations: integer('total_meditations').notNull().default(0),
  totalJournalEntries: integer('total_journal_entries').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const moodHistory = sqliteTable('mood_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mood: text('mood', {
    enum: ['happy', 'calm', 'neutral', 'sad', 'anxious', 'angry'],
  }).notNull(),
  xpAwarded: integer('xp_awarded').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const psychologistPatients = sqliteTable('psychologist_patients', {
  id: text('id').primaryKey(),
  psychologistId: text('psychologist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const patientInvites = sqliteTable('patient_invites', {
  id: text('id').primaryKey(),
  psychologistId: text('psychologist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  birthdate: text('birthdate'),
  gender: text('gender'),
  address: text('address', { mode: 'json' }).$type<{
    street?: string
    city?: string
    state?: string
    zip?: string
  }>(),
  token: text('token').notNull().unique(),
  status: text('status', {
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

export const adminInvites = sqliteTable('admin_invites', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  role: text('role', { enum: ['admin', 'psychologist'] }).notNull(),
  email: text('email'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', {
    enum: ['pending', 'accepted', 'expired'],
  })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  acceptedBy: text('accepted_by').references(() => users.id, {
    onDelete: 'set null',
  }),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Push notification subscriptions for Web Push API
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  deviceType: text('device_type', {
    enum: ['mobile', 'desktop', 'unknown'],
  }).default('unknown'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
})

// ============================================
// THERAPIST GAMIFICATION TABLES
// ============================================

// Therapist statistics and XP tracking
export const therapistStats = sqliteTable('therapist_stats', {
  therapistId: text('therapist_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  totalPatientsManaged: integer('total_patients_managed').notNull().default(0),
  totalReportsViewed: integer('total_reports_viewed').notNull().default(0),
  totalTasksCreated: integer('total_tasks_created').notNull().default(0),
  totalTasksReviewed: integer('total_tasks_reviewed').notNull().default(0),
  totalFeedbackSent: integer('total_feedback_sent').notNull().default(0),
  totalRewardsApproved: integer('total_rewards_approved').notNull().default(0),
  totalSessionsCompleted: integer('total_sessions_completed').notNull().default(0),
  totalClinicalReports: integer('total_clinical_reports').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: integer('last_activity_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Therapist achievements/badges
export const therapistAchievements = sqliteTable('therapist_achievements', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull(),
  category: text('category', {
    enum: [
      'clinical_productivity',
      'continuous_care',
      'patient_engagement',
      'system_mastery',
      'financial',
      'challenges',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  xpReward: integer('xp_reward').notNull().default(0),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Therapist tasks/routine items for managing patients
export const therapistTasks = sqliteTable('therapist_tasks', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['feedback', 'session', 'review_records', 'create_plan', 'approve_reward', 'custom'],
  })
    .notNull()
    .default('custom'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  status: text('status', {
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  xpReward: integer('xp_reward').notNull().default(20),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
  }),
  isAiGenerated: integer('is_ai_generated', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata', { mode: 'json' }).$type<{
    icon?: string
    color?: string
    notes?: string
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Weekly challenges for therapists
export const therapistChallenges = sqliteTable('therapist_challenges', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  challengeId: text('challenge_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: [
      'review_records',
      'send_feedback',
      'create_tasks',
      'approve_rewards',
      'complete_sessions',
      'financial',
    ],
  }).notNull(),
  targetCount: integer('target_count').notNull().default(1),
  currentCount: integer('current_count').notNull().default(0),
  xpReward: integer('xp_reward').notNull().default(50),
  bonusMultiplier: integer('bonus_multiplier').notNull().default(1),
  status: text('status', { enum: ['active', 'completed', 'expired'] })
    .notNull()
    .default('active'),
  weekStart: integer('week_start', { mode: 'timestamp' }).notNull(),
  weekEnd: integer('week_end', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Financial management for therapists
export const therapistFinancial = sqliteTable('therapist_financial', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  category: text('category', {
    enum: [
      'session',
      'plan',
      'workshop',
      'supervision',
      'consultation',
      'subscription',
      'rent',
      'equipment',
      'marketing',
      'training',
      'taxes',
      'utilities',
      'insurance',
      'software',
      'material',
      'other',
    ],
  }).notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  patientId: text('patient_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  frequency: text('frequency', { enum: ['weekly', 'monthly', 'yearly'] }),
  metadata: text('metadata', { mode: 'json' }).$type<{
    notes?: string
    paymentMethod?: string
    invoiceNumber?: string
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Professional goals for therapists
export const therapistGoals = sqliteTable('therapist_goals', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['schedule', 'revenue', 'retention', 'expansion', 'professional_development'],
  }).notNull(),
  targetValue: integer('target_value').notNull(),
  currentValue: integer('current_value').notNull().default(0),
  unit: text('unit').notNull().default('count'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['active', 'completed', 'paused', 'cancelled'],
  })
    .notNull()
    .default('active'),
  aiSuggested: integer('ai_suggested', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Weekly AI-generated reports for patient insights
export const weeklyReports = sqliteTable('weekly_reports', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weekStart: integer('week_start', { mode: 'timestamp' }).notNull(),
  weekEnd: integer('week_end', { mode: 'timestamp' }).notNull(),
  moodSummary: text('mood_summary'),
  thoughtPatterns: text('thought_patterns', { mode: 'json' }).$type<{
    patterns: string[]
    frequency: Record<string, number>
  }>(),
  emotionalTrends: text('emotional_trends', { mode: 'json' }).$type<{
    dominant: string[]
    improving: string[]
    concerning: string[]
  }>(),
  triggers: text('triggers', { mode: 'json' }).$type<string[]>(),
  interventionSuggestions: text('intervention_suggestions', {
    mode: 'json',
  }).$type<
    {
      suggestion: string
      rationale: string
      priority: 'high' | 'medium' | 'low'
    }[]
  >(),
  aiAnalysis: text('ai_analysis'),
  isViewed: integer('is_viewed', { mode: 'boolean' }).notNull().default(false),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Patient tasks created by therapist
export const patientTasksFromTherapist = sqliteTable('patient_tasks_from_therapist', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('terapia'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  frequency: text('frequency', {
    enum: ['once', 'daily', 'weekly', 'biweekly', 'monthly'],
  })
    .notNull()
    .default('once'),
  weekDays: text('week_days', { mode: 'json' }).$type<number[]>(),
  status: text('status', {
    enum: ['pending', 'accepted', 'completed', 'rejected'],
  })
    .notNull()
    .default('pending'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  feedback: text('feedback'),
  feedbackAt: integer('feedback_at', { mode: 'timestamp' }),
  xpReward: integer('xp_reward').notNull().default(20),
  isAiSuggested: integer('is_ai_suggested', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata', { mode: 'json' }).$type<{
    icon?: string
    color?: string
    aiRationale?: string
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Therapy sessions tracking
export const therapySessions = sqliteTable('therapy_sessions', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  duration: integer('duration').notNull().default(50),
  status: text('status', {
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
  })
    .notNull()
    .default('scheduled'),
  sessionType: text('session_type', {
    enum: ['individual', 'couple', 'family', 'group'],
  })
    .notNull()
    .default('individual'),
  notes: text('notes'),
  sessionValue: integer('session_value'),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Session documents (PDFs and images uploaded by therapists)
export const sessionDocuments = sqliteTable('session_documents', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type', {
    enum: ['pdf', 'image', 'document', 'spreadsheet', 'presentation', 'text', 'other'],
  }).notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileData: text('file_data').notNull(), // Base64 encoded file data
  description: text('description'),
  sessionDate: integer('session_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Cognitive Conceptualization Diagram (D. Hernandes model)
export const cognitiveConceptualization = sqliteTable('cognitive_conceptualization', {
  id: text('id').primaryKey(),
  therapistId: text('therapist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  patientId: text('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Header data
  name: text('name'),
  date: integer('date', { mode: 'timestamp' }),
  // Main sections
  childhoodData: text('childhood_data'), // Dados Relevantes de Infância
  coreBelief: text('core_belief'), // Crença Central
  conditionalAssumptions: text('conditional_assumptions'), // Suposições Condicionais - Regras
  compensatoryStrategies: text('compensatory_strategies'), // Estratégia(s) Compensatória(s)
  // Situations (up to 3)
  situations: text('situations', { mode: 'json' }).$type<{
    situation1?: {
      situation: string
      automaticThought: string
      meaningOfAT: string // Significado do PA (Pensamento Automático)
      emotion: string
      behavior: string
    }
    situation2?: {
      situation: string
      automaticThought: string
      meaningOfAT: string
      emotion: string
      behavior: string
    }
    situation3?: {
      situation: string
      automaticThought: string
      meaningOfAT: string
      emotion: string
      behavior: string
    }
  }>(),
  notes: text('notes'),
  // Therapeutic Plan (AI generated)
  therapeuticPlan: text('therapeutic_plan', { mode: 'json' }).$type<{
    objectives: string[]
    interventions: Array<{
      technique: string
      description: string
      targetBelief?: string
    }>
    suggestedActivities: string[]
    estimatedDuration: string
    observations: string
    generatedAt: string
  }>(),
  // Approval fields
  isApproved: integer('is_approved', { mode: 'boolean' }).notNull().default(false),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Psychologist subscription management
export const psychologistSubscriptions = sqliteTable('psychologist_subscriptions', {
  id: text('id').primaryKey(),
  psychologistId: text('psychologist_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['trial', 'monthly', 'quarterly', 'yearly'] })
    .notNull()
    .default('trial'),
  status: text('status', {
    enum: ['active', 'expired', 'cancelled', 'pending'],
  })
    .notNull()
    .default('pending'),
  amount: integer('amount').notNull().default(0), // Amount in cents
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  lastPaymentDate: integer('last_payment_date', { mode: 'timestamp' }),
  nextPaymentDate: integer('next_payment_date', { mode: 'timestamp' }),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

// Therapist profile - professional data
export const therapistProfiles = sqliteTable('therapist_profiles', {
  therapistId: text('therapist_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  cpf: text('cpf').notNull(),
  birthDate: integer('birth_date', { mode: 'timestamp' }).notNull(),
  crp: text('crp').notNull(),
  education: text('education').notNull(),
  city: text('city').notNull(),
  attendanceType: text('attendance_type', {
    enum: ['online', 'presential', 'both'],
  }).notNull(),
  clinicAddress: text('clinic_address'),
  phone: text('phone').notNull(),
  bio: text('bio'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type JournalEntry = typeof journalEntries.$inferSelect
export type NewJournalEntry = typeof journalEntries.$inferInsert
export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
export type Badge = typeof badges.$inferSelect
export type NewBadge = typeof badges.$inferInsert
export type MeditationSession = typeof meditationSessions.$inferSelect
export type NewMeditationSession = typeof meditationSessions.$inferInsert
export type UserStats = typeof userStats.$inferSelect
export type MoodHistory = typeof moodHistory.$inferSelect
export type NewMoodHistory = typeof moodHistory.$inferInsert
export type PsychologistPatient = typeof psychologistPatients.$inferSelect
export type NewPsychologistPatient = typeof psychologistPatients.$inferInsert
export type PatientInvite = typeof patientInvites.$inferSelect
export type NewPatientInvite = typeof patientInvites.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert

// Therapist types
export type TherapistStats = typeof therapistStats.$inferSelect
export type NewTherapistStats = typeof therapistStats.$inferInsert
export type TherapistAchievement = typeof therapistAchievements.$inferSelect
export type NewTherapistAchievement = typeof therapistAchievements.$inferInsert
export type TherapistTask = typeof therapistTasks.$inferSelect
export type NewTherapistTask = typeof therapistTasks.$inferInsert
export type TherapistChallenge = typeof therapistChallenges.$inferSelect
export type NewTherapistChallenge = typeof therapistChallenges.$inferInsert
export type TherapistFinancialRecord = typeof therapistFinancial.$inferSelect
export type NewTherapistFinancialRecord = typeof therapistFinancial.$inferInsert
export type TherapistGoal = typeof therapistGoals.$inferSelect
export type NewTherapistGoal = typeof therapistGoals.$inferInsert
export type TherapistProfile = typeof therapistProfiles.$inferSelect
export type NewTherapistProfile = typeof therapistProfiles.$inferInsert
export type WeeklyReport = typeof weeklyReports.$inferSelect
export type NewWeeklyReport = typeof weeklyReports.$inferInsert
export type PatientTaskFromTherapist = typeof patientTasksFromTherapist.$inferSelect
export type NewPatientTaskFromTherapist = typeof patientTasksFromTherapist.$inferInsert
export type TherapySession = typeof therapySessions.$inferSelect
export type NewTherapySession = typeof therapySessions.$inferInsert
export type SessionDocument = typeof sessionDocuments.$inferSelect
export type NewSessionDocument = typeof sessionDocuments.$inferInsert
export type CognitiveConceptualization = typeof cognitiveConceptualization.$inferSelect
export type NewCognitiveConceptualization = typeof cognitiveConceptualization.$inferInsert
export type PsychologistSubscription = typeof psychologistSubscriptions.$inferSelect
export type NewPsychologistSubscription = typeof psychologistSubscriptions.$inferInsert

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  therapistStats: one(therapistStats, {
    fields: [users.id],
    references: [therapistStats.therapistId],
  }),
  patientsAsTherapist: many(psychologistPatients, {
    relationName: 'psychologist',
  }),
  therapistsAsPatient: many(psychologistPatients, {
    relationName: 'patient',
  }),
  therapistAchievements: many(therapistAchievements),
  therapistTasks: many(therapistTasks),
  therapistChallenges: many(therapistChallenges),
  therapistFinancial: many(therapistFinancial),
  therapistGoals: many(therapistGoals),
}))

export const psychologistPatientsRelations = relations(psychologistPatients, ({ one }) => ({
  psychologist: one(users, {
    fields: [psychologistPatients.psychologistId],
    references: [users.id],
    relationName: 'psychologist',
  }),
  patient: one(users, {
    fields: [psychologistPatients.patientId],
    references: [users.id],
    relationName: 'patient',
  }),
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}))

// Therapist relations
export const therapistStatsRelations = relations(therapistStats, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistStats.therapistId],
    references: [users.id],
  }),
}))

export const therapistAchievementsRelations = relations(therapistAchievements, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistAchievements.therapistId],
    references: [users.id],
  }),
}))

export const therapistTasksRelations = relations(therapistTasks, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistTasks.therapistId],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [therapistTasks.patientId],
    references: [users.id],
  }),
}))

export const therapistChallengesRelations = relations(therapistChallenges, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistChallenges.therapistId],
    references: [users.id],
  }),
}))

export const therapistFinancialRelations = relations(therapistFinancial, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistFinancial.therapistId],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [therapistFinancial.patientId],
    references: [users.id],
  }),
}))

export const therapistGoalsRelations = relations(therapistGoals, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistGoals.therapistId],
    references: [users.id],
  }),
}))

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
  therapist: one(users, {
    fields: [weeklyReports.therapistId],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [weeklyReports.patientId],
    references: [users.id],
  }),
}))

export const patientTasksFromTherapistRelations = relations(
  patientTasksFromTherapist,
  ({ one }) => ({
    therapist: one(users, {
      fields: [patientTasksFromTherapist.therapistId],
      references: [users.id],
    }),
    patient: one(users, {
      fields: [patientTasksFromTherapist.patientId],
      references: [users.id],
    }),
  })
)

export const therapySessionsRelations = relations(therapySessions, ({ one }) => ({
  therapist: one(users, {
    fields: [therapySessions.therapistId],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [therapySessions.patientId],
    references: [users.id],
  }),
}))

export const sessionDocumentsRelations = relations(sessionDocuments, ({ one }) => ({
  therapist: one(users, {
    fields: [sessionDocuments.therapistId],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [sessionDocuments.patientId],
    references: [users.id],
  }),
}))

export const cognitiveConceptualizationRelations = relations(
  cognitiveConceptualization,
  ({ one }) => ({
    therapist: one(users, {
      fields: [cognitiveConceptualization.therapistId],
      references: [users.id],
    }),
    patient: one(users, {
      fields: [cognitiveConceptualization.patientId],
      references: [users.id],
    }),
  })
)

export const psychologistSubscriptionsRelations = relations(
  psychologistSubscriptions,
  ({ one }) => ({
    psychologist: one(users, {
      fields: [psychologistSubscriptions.psychologistId],
      references: [users.id],
    }),
  })
)

// Password reset tokens - LGPD compliant
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}))
