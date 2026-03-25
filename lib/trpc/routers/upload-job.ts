import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { uploadJobs } from '@/lib/db/schema'
import { psychologistProcedure, router } from '@/lib/trpc/trpc'

export const uploadJobRouter = router({
  // Get all upload jobs for a patient
  getByPatient: psychologistProcedure
    .input(
      z.object({
        patientId: z.string(),
        purpose: z.enum(['transcription', 'document']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(uploadJobs.patientId, input.patientId),
        eq(uploadJobs.therapistId, ctx.user.id),
        isNull(uploadJobs.deletedAt),
      ]

      if (input.purpose) {
        conditions.push(eq(uploadJobs.purpose, input.purpose))
      }

      const jobs = await db.query.uploadJobs.findMany({
        where: and(...conditions),
        orderBy: [desc(uploadJobs.createdAt)],
      })

      return jobs
    }),

  // Get a specific upload job by ID
  getById: psychologistProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await db.query.uploadJobs.findFirst({
        where: and(
          eq(uploadJobs.id, input.id),
          eq(uploadJobs.therapistId, ctx.user.id),
          isNull(uploadJobs.deletedAt)
        ),
      })

      return job
    }),

  // Update job status
  updateStatus: psychologistProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'uploading', 'completed', 'processing', 'failed']),
        metadata: z.object({}).passthrough().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(uploadJobs)
        .set({
          status: input.status,
          metadata: input.metadata,
          updatedAt: new Date(),
        })
        .where(and(eq(uploadJobs.id, input.id), eq(uploadJobs.therapistId, ctx.user.id)))
        .returning()

      return updated
    }),

  // Soft delete an upload job
  delete: psychologistProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .update(uploadJobs)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(uploadJobs.id, input.id), eq(uploadJobs.therapistId, ctx.user.id)))
        .returning()

      return { success: true, deleted }
    }),
})
