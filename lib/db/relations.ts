import { relations } from 'drizzle-orm'
import {
  cognitiveConceptualization,
  notifications,
  patientInvites,
  patientTasksFromTherapist,
  psychologistPatients,
  psychologistSubscriptions,
  sessionDocuments,
  therapistAchievements,
  therapistChallenges,
  therapistFinancial,
  therapistGoals,
  therapistProfiles,
  therapistStats,
  therapistTasks,
  therapySessions,
  userStats,
  users,
  weeklyReports,
} from './schema'

export const usersRelations = relations(users, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  therapistStats: one(therapistStats, {
    fields: [users.id],
    references: [therapistStats.therapistId],
  }),
  therapistProfile: one(therapistProfiles, {
    fields: [users.id],
    references: [therapistProfiles.therapistId],
  }),
  patientsAsTherapist: many(psychologistPatients, {
    relationName: 'psychologist',
  }),
  therapistsAsPatient: many(psychologistPatients, {
    relationName: 'patient',
  }),
  invitesSent: many(patientInvites),
  therapistAchievements: many(therapistAchievements),
  therapistTasks: many(therapistTasks),
  therapistChallenges: many(therapistChallenges),
  therapistFinancial: many(therapistFinancial),
  therapistGoals: many(therapistGoals),
  therapySessionsAsPatient: many(therapySessions, { relationName: 'patient' }),
  therapySessionsAsTherapist: many(therapySessions, { relationName: 'therapist' }),
  sessionDocumentsAsPatient: many(sessionDocuments, { relationName: 'patient' }),
  sessionDocumentsAsTherapist: many(sessionDocuments, { relationName: 'therapist' }),
  cognitiveConceptualizationAsPatient: many(cognitiveConceptualization, { relationName: 'patient' }),
  cognitiveConceptualizationAsTherapist: many(cognitiveConceptualization, { relationName: 'therapist' }),
  psychologistSubscriptions: many(psychologistSubscriptions),
  notifications: many(notifications),
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

export const patientInvitesRelations = relations(patientInvites, ({ one }) => ({
  psychologist: one(users, {
    fields: [patientInvites.psychologistId],
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
    relationName: 'therapist',
  }),
  patient: one(users, {
    fields: [therapySessions.patientId],
    references: [users.id],
    relationName: 'patient',
  }),
}))

export const therapistProfilesRelations = relations(therapistProfiles, ({ one }) => ({
  therapist: one(users, {
    fields: [therapistProfiles.therapistId],
    references: [users.id],
  }),
}))

export const sessionDocumentsRelations = relations(sessionDocuments, ({ one }) => ({
  therapist: one(users, {
    fields: [sessionDocuments.therapistId],
    references: [users.id],
    relationName: 'therapist',
  }),
  patient: one(users, {
    fields: [sessionDocuments.patientId],
    references: [users.id],
    relationName: 'patient',
  }),
}))

export const cognitiveConceptualizationRelations = relations(
  cognitiveConceptualization,
  ({ one }) => ({
    therapist: one(users, {
      fields: [cognitiveConceptualization.therapistId],
      references: [users.id],
      relationName: 'therapist',
    }),
    patient: one(users, {
      fields: [cognitiveConceptualization.patientId],
      references: [users.id],
      relationName: 'patient',
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))
