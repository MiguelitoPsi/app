import { TRPCError } from '@trpc/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { psychologistPatients, transcriptions } from '@/lib/db/schema'
import { protectedProcedure, psychologistProcedure, router } from '../trpc'

export const transcriptionRouter = router({
  // Listar transcrições por paciente (psicólogo)
  getByPatient: psychologistProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verificar relacionamento terapeuta-paciente
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para acessar este paciente',
        })
      }

      return ctx.db
        .select()
        .from(transcriptions)
        .where(
          and(
            eq(transcriptions.patientId, input.patientId),
            eq(transcriptions.therapistId, ctx.user.id),
            isNull(transcriptions.deletedAt)
          )
        )
        .orderBy(desc(transcriptions.createdAt))
    }),

  // Obter uma transcrição específica
  getById: psychologistProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [transcription] = await ctx.db
        .select()
        .from(transcriptions)
        .where(
          and(
            eq(transcriptions.id, input.id),
            eq(transcriptions.therapistId, ctx.user.id),
            isNull(transcriptions.deletedAt)
          )
        )
        .limit(1)

      if (!transcription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transcrição não encontrada',
        })
      }

      return transcription
    }),

  // Criar registro local (após upload na API externa)
  create: psychologistProcedure
    .input(
      z.object({
        jobId: z.string(),
        patientId: z.string(),
        originalFilename: z.string(),
        status: z.enum(['queued', 'processing', 'completed', 'failed']).default('queued'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar relacionamento terapeuta-paciente
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para acessar este paciente',
        })
      }

      const id = nanoid()

      await ctx.db.insert(transcriptions).values({
        id,
        jobId: input.jobId,
        patientId: input.patientId,
        therapistId: ctx.user.id,
        originalFilename: input.originalFilename,
        status: input.status,
      })

      return { id, jobId: input.jobId }
    }),

  // Atualizar status/texto (webhook da API externa)
  updateByJobId: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        status: z.enum(['queued', 'processing', 'completed', 'failed']),
        text: z.string().optional(),
        segments: z
          .array(
            z.object({
              start: z.number().optional(),
              end: z.number().optional(),
              text: z.string(),
              isTherapist: z.boolean(),
              emotion: z.string(),
            })
          )
          .optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(transcriptions)
        .set({
          status: input.status,
          text: input.text,
          segments: input.segments,
          language: input.language,
          updatedAt: new Date(),
        })
        .where(eq(transcriptions.jobId, input.jobId))

      return { success: true }
    }),

  // Soft delete
  delete: psychologistProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [transcription] = await ctx.db
        .select()
        .from(transcriptions)
        .where(and(eq(transcriptions.id, input.id), eq(transcriptions.therapistId, ctx.user.id)))
        .limit(1)

      if (!transcription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transcrição não encontrada',
        })
      }

      await ctx.db
        .update(transcriptions)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(transcriptions.id, input.id))

      return { success: true }
    }),
})
