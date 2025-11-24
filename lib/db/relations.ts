import { relations } from 'drizzle-orm'
import { patientInvites, psychologistPatients, userStats, users } from './schema'

export const usersRelations = relations(users, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  patientsAsTherapist: many(psychologistPatients, {
    relationName: 'psychologist',
  }),
  therapistsAsPatient: many(psychologistPatients, {
    relationName: 'patient',
  }),
  invitesSent: many(patientInvites),
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
