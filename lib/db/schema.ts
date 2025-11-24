import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  role: text("role", { enum: ["admin", "psychologist", "patient"] })
    .notNull()
    .default("patient"),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  lastTaskXpDate: integer("last_task_xp_date", { mode: "timestamp" }),
  lastJournalXpDate: integer("last_journal_xp_date", { mode: "timestamp" }),
  lastMeditationXpDate: integer("last_meditation_xp_date", {
    mode: "timestamp",
  }),
  lastMoodXpDate: integer("last_mood_xp_date", { mode: "timestamp" }),
  preferences: text("preferences", { mode: "json" }).$type<{
    notifications?: boolean;
    theme?: "light" | "dark";
    language?: string;
    avatar_config?: {
      accessory: string;
      shirtColor: string;
    };
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  password: text("password"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  experience: integer("experience").notNull().default(10),
  coins: integer("coins").notNull().default(5),
  frequency: text("frequency", {
    enum: ["once", "daily", "weekly", "monthly"],
  }).default("once"),
  weekDays: text("week_days", { mode: "json" }).$type<number[]>(),
  monthDays: text("month_days", { mode: "json" }).$type<number[]>(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }).$type<{
    icon?: string;
    color?: string;
    tags?: string[];
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mood: text("mood"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  aiAnalysis: text("ai_analysis"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("lazer"),
  cost: integer("cost").notNull(),
  claimed: integer("claimed", { mode: "boolean" }).notNull().default(false),
  claimedAt: integer("claimed_at", { mode: "timestamp" }),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const meditationSessions = sqliteTable("meditation_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(),
  type: text("type").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  totalTasks: integer("total_tasks").notNull().default(0),
  completedTasks: integer("completed_tasks").notNull().default(0),
  totalMeditations: integer("total_meditations").notNull().default(0),
  totalJournalEntries: integer("total_journal_entries").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const moodHistory = sqliteTable("mood_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mood: text("mood", {
    enum: ["happy", "calm", "neutral", "sad", "anxious", "angry"],
  }).notNull(),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const psychologistPatients = sqliteTable("psychologist_patients", {
  id: text("id").primaryKey(),
  psychologistId: text("psychologist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  patientId: text("patient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isPrimary: integer("is_primary", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const patientInvites = sqliteTable("patient_invites", {
  id: text("id").primaryKey(),
  psychologistId: text("psychologist_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  birthdate: text("birthdate"),
  gender: text("gender"),
  address: text("address", { mode: "json" }).$type<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>(),
  token: text("token").notNull().unique(),
  status: text("status", { enum: ["pending", "accepted", "expired", "cancelled"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type MeditationSession = typeof meditationSessions.$inferSelect;
export type NewMeditationSession = typeof meditationSessions.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type MoodHistory = typeof moodHistory.$inferSelect;
export type NewMoodHistory = typeof moodHistory.$inferInsert;
export type PsychologistPatient = typeof psychologistPatients.$inferSelect;
export type NewPsychologistPatient = typeof psychologistPatients.$inferInsert;
export type PatientInvite = typeof patientInvites.$inferSelect;
export type NewPatientInvite = typeof patientInvites.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  patientsAsTherapist: many(psychologistPatients, {
    relationName: "psychologist",
  }),
  therapistsAsPatient: many(psychologistPatients, {
    relationName: "patient",
  }),
}));

export const psychologistPatientsRelations = relations(
  psychologistPatients,
  ({ one }) => ({
    psychologist: one(users, {
      fields: [psychologistPatients.psychologistId],
      references: [users.id],
      relationName: "psychologist",
    }),
    patient: one(users, {
      fields: [psychologistPatients.patientId],
      references: [users.id],
      relationName: "patient",
    }),
  })
);

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));
