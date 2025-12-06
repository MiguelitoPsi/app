import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifications, patientInvites, psychologistPatients, users } from '@/lib/db/schema'
import { sendInviteEmail, sendNudgeEmail } from '@/lib/email'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'
import { protectedProcedure, publicProcedure, router } from '../trpc'

export const patientRouter = router({
  // Send invite (psychologist only)
  sendInvite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        phone: z.string().optional(),
        birthdate: z.string().optional(),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
        address: z
          .object({
            street: z.string().optional(),
            number: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas psicólogos podem enviar convites',
        })
      }

      // Check if email already registered
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este email já está cadastrado',
        })
      }

      // Check if there's already a pending invite
      const existingInvite = await db.query.patientInvites.findFirst({
        where: and(eq(patientInvites.email, input.email), eq(patientInvites.status, 'pending')),
      })

      if (existingInvite) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Já existe um convite pendente para este email',
        })
      }

      const token = nanoid(32)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const [invite] = await db
        .insert(patientInvites)
        .values({
          id: nanoid(),
          psychologistId: ctx.user.id,
          email: input.email,
          name: input.name,
          phone: input.phone,
          birthdate: input.birthdate,
          gender: input.gender,
          address: input.address,
          token,
          status: 'pending',
          expiresAt,
        })
        .returning()

      // Send email
      try {
        await sendInviteEmail(input.email, input.name, ctx.user.name || 'Seu psicólogo', token)
      } catch (error) {
        console.error('Failed to send invite email:', error)
        // Don't throw - invite is still created
      }

      return { success: true, inviteId: invite.id }
    }),

  // Get all invites (psychologist only)
  getInvites: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return await db.query.patientInvites.findMany({
      where: eq(patientInvites.psychologistId, ctx.user.id),
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    })
  }),

  // Resend invite
  resendInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const invite = await db.query.patientInvites.findFirst({
        where: and(
          eq(patientInvites.id, input.inviteId),
          eq(patientInvites.psychologistId, ctx.user.id)
        ),
      })

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite não encontrado',
        })
      }

      if (invite.status !== 'pending' && invite.status !== 'expired') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Convite não pode ser reenviado',
        })
      }

      const newToken = nanoid(32)
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db
        .update(patientInvites)
        .set({
          token: newToken,
          status: 'pending',
          expiresAt: newExpiresAt,
        })
        .where(eq(patientInvites.id, input.inviteId))

      try {
        await sendInviteEmail(invite.email, invite.name, ctx.user.name || 'Seu psicólogo', newToken)
      } catch (error) {
        console.error('Failed to resend invite email:', error)
      }

      return { success: true }
    }),

  // Cancel invite
  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const invite = await db.query.patientInvites.findFirst({
        where: and(
          eq(patientInvites.id, input.inviteId),
          eq(patientInvites.psychologistId, ctx.user.id)
        ),
      })

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      await db
        .update(patientInvites)
        .set({ status: 'cancelled' })
        .where(eq(patientInvites.id, input.inviteId))

      return { success: true }
    }),

  // Accept invite (public - no auth required)
  getInviteByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invite = await db.query.patientInvites.findFirst({
        where: eq(patientInvites.token, input.token),
        with: {
          psychologist: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Convite não encontrado',
        })
      }

      if (invite.status === 'accepted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite já foi aceito',
        })
      }

      if (invite.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite foi cancelado',
        })
      }

      if (new Date() > invite.expiresAt) {
        await db
          .update(patientInvites)
          .set({ status: 'expired' })
          .where(eq(patientInvites.id, invite.id))
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite expirou',
        })
      }

      return invite
    }),

  // Get my patients (psychologist only)
  getMyPatients: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.psychologistId, ctx.user.id),
      with: {
        patient: {
          with: {
            stats: true,
          },
        },
      },
    })

    // Fetch accepted invites to get additional patient info (phone, address, etc.)
    const acceptedInvites = await db.query.patientInvites.findMany({
      where: and(
        eq(patientInvites.psychologistId, ctx.user.id),
        eq(patientInvites.status, 'accepted')
      ),
    })

    // Create a map of email to invite data for quick lookup
    const inviteByEmail = new Map(acceptedInvites.map((invite) => [invite.email, invite]))

    return relationships
      .filter((rel) => rel.patient)
      .map((rel) => {
        const patient = rel.patient
        if (!patient) return null
        const invite = inviteByEmail.get(patient.email)
        return {
          ...patient,
          isPrimary: rel.isPrimary,
          relationshipId: rel.id,
          // Additional info from invite
          phone: invite?.phone || null,
          birthdate: invite?.birthdate || null,
          gender: invite?.gender || null,
          address: invite?.address || null,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  }),

  // Get all patients linked to this psychologist
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.psychologistId, ctx.user.id),
      with: {
        patient: true,
      },
    })

    return relationships
      .filter(
        (rel): rel is typeof rel & { patient: NonNullable<typeof rel.patient> } =>
          rel.patient !== null && rel.patient !== undefined
      )
      .map((rel) => ({
        id: rel.patient.id,
        name: rel.patient.name,
        email: rel.patient.email,
        image: rel.patient.image,
        isPrimary: rel.isPrimary,
        relationshipId: rel.id,
      }))
  }),

  // Get my psychologists (patient only)
  getMyPsychologists: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'patient') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.patientId, ctx.user.id),
      with: {
        psychologist: true,
      },
    })

    return relationships
      .filter(
        (
          rel
        ): rel is typeof rel & {
          psychologist: NonNullable<typeof rel.psychologist>
        } => rel.psychologist !== null && rel.psychologist !== undefined
      )
      .map((rel) => ({
        ...rel.psychologist,
        isPrimary: rel.isPrimary,
        relationshipId: rel.id,
      }))
  }),

  // Remove patient (psychologist only) - deprecated, use unlinkPatient or dischargePatient
  removePatient: protectedProcedure
    .input(z.object({ relationshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.id, input.relationshipId),
          eq(psychologistPatients.psychologistId, ctx.user.id)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vínculo não encontrado',
        })
      }

      await db.delete(psychologistPatients).where(eq(psychologistPatients.id, input.relationshipId))

      return { success: true }
    }),

  // Desvincular paciente (suspende a conta até novo vínculo ou exclusão pelo admin)
  unlinkPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verificar se existe o vínculo
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.patientId, input.patientId),
          eq(psychologistPatients.psychologistId, ctx.user.id)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vínculo não encontrado',
        })
      }

      // Buscar nome do terapeuta
      const therapist = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      })

      // Deletar o relacionamento
      await db.delete(psychologistPatients).where(eq(psychologistPatients.id, relationship.id))

      // Motivo da desvinculação
      const unlinkReasonText = input.reason || 'Desvinculado pelo terapeuta'

      // Suspender a conta do paciente
      await db
        .update(users)
        .set({
          bannedAt: new Date(),
          banReason: unlinkReasonText,
          unlinkReason: 'unlinked',
          unlinkedByTherapistId: ctx.user.id,
          unlinkedByTherapistName: therapist?.name || 'Terapeuta',
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.patientId))

      // Criar notificação para o paciente
      await db.insert(notifications).values({
        id: nanoid(),
        userId: input.patientId,
        type: 'patient_unlinked',
        title: 'Desvinculação do Terapeuta',
        message: `Você foi desvinculado do terapeuta ${
          therapist?.name || 'seu terapeuta'
        }. Motivo: ${unlinkReasonText}. Sua conta está suspensa até que você se vincule a um novo terapeuta.`,
        metadata: {
          therapistId: ctx.user.id,
          therapistName: therapist?.name,
          reason: 'unlinked',
          unlinkReasonText,
        },
      })

      return { success: true }
    }),

  // Dar alta ao paciente (suspende a conta até novo vínculo ou exclusão pelo admin)
  dischargePatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Verificar se existe o vínculo
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.patientId, input.patientId),
          eq(psychologistPatients.psychologistId, ctx.user.id)
        ),
      })

      if (!relationship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vínculo não encontrado',
        })
      }

      // Buscar nome do terapeuta
      const therapist = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      })

      // NÃO deletar o relacionamento - manter o paciente vinculado ao terapeuta
      // A conta será excluída manualmente por admin

      // Suspender a conta do paciente (mantendo o vínculo)
      await db
        .update(users)
        .set({
          bannedAt: new Date(),
          banReason: 'Alta do tratamento',
          unlinkReason: 'discharged',
          unlinkedByTherapistId: ctx.user.id,
          unlinkedByTherapistName: therapist?.name || 'Terapeuta',
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.patientId))

      // Criar notificação para o paciente
      await db.insert(notifications).values({
        id: nanoid(),
        userId: input.patientId,
        type: 'patient_discharged',
        title: 'Alta do Tratamento',
        message: `Você recebeu alta do terapeuta ${
          therapist?.name || 'seu terapeuta'
        }. Parabéns pela sua jornada!`,
        metadata: {
          therapistId: ctx.user.id,
          therapistName: therapist?.name,
          reason: 'discharged',
        },
      })

      return { success: true }
    }),
  // Transferir paciente para outro terapeuta (Encaminhamento)
  transferPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        newTherapistId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'psychologist') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // 1. Verificar se existe o vínculo atual
      const currentRelationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.patientId, input.patientId),
          eq(psychologistPatients.psychologistId, ctx.user.id)
        ),
      })

      if (!currentRelationship) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vínculo atual não encontrado',
        })
      }

      // 2. Verificar se o novo terapeuta existe e é psicólogo
      const newTherapist = await db.query.users.findFirst({
        where: and(eq(users.id, input.newTherapistId), eq(users.role, 'psychologist')),
      })

      if (!newTherapist) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Novo terapeuta não encontrado',
        })
      }

      // 3. Buscar nome do terapeuta atual
      const currentTherapist = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      })

      // 4. Remover vínculo antigo
      await db
        .delete(psychologistPatients)
        .where(eq(psychologistPatients.id, currentRelationship.id))

      // 5. Criar novo vínculo
      await db.insert(psychologistPatients).values({
        id: nanoid(),
        psychologistId: input.newTherapistId,
        patientId: input.patientId,
        isPrimary: true, // Assumindo que o novo terapeuta será o principal
        createdAt: new Date(),
      })

      // 6. Criar notificação para o paciente
      const reasonText = input.reason ? ` Motivo: ${input.reason}.` : ''
      await db.insert(notifications).values({
        id: nanoid(),
        userId: input.patientId,
        type: 'patient_transferred', // Novo tipo de notificação, pode precisar adicionar ao schema se for enum
        title: 'Novo Terapeuta',
        message: `Você foi encaminhado para o terapeuta ${newTherapist.name} por ${
          currentTherapist?.name || 'seu antigo terapeuta'
        }.${reasonText}`,
        metadata: {
          oldTherapistId: ctx.user.id,
          oldTherapistName: currentTherapist?.name,
          newTherapistId: newTherapist.id,
          newTherapistName: newTherapist.name,
          reason: 'transferred',
        },
      })

      // 7. Criar notificação para o novo terapeuta
      await db.insert(notifications).values({
        id: nanoid(),
        userId: newTherapist.id,
        type: 'new_patient_transfer',
        title: 'Novo Paciente Encaminhado',
        message: `O paciente foi encaminhado para você por ${
          currentTherapist?.name || 'outro terapeuta'
        }.${reasonText}`,
        metadata: {
          patientId: input.patientId,
          referredByTherapistId: ctx.user.id,
          referredByTherapistName: currentTherapist?.name,
          reason: 'transferred',
        },
      })

      return { success: true }
    }),

  // Send nudge to patient
  sendNudge: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log('--- sendNudge started ---')
      console.log('User:', ctx.user.id, ctx.user.role)
      console.log('Target Patient:', input.patientId)

      if (ctx.user.role !== 'psychologist') {
        console.error('sendNudge: Not a psychologist')
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Check relationship
      const relationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.patientId, input.patientId),
          eq(psychologistPatients.psychologistId, ctx.user.id)
        ),
      })

      if (!relationship) {
        console.error('sendNudge: Relationship not found')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vínculo não encontrado',
        })
      }
      console.log('sendNudge: Relationship verified')

      const therapistName = ctx.user.name || 'Seu terapeuta'

      // Send push notification
      try {
        console.log('sendNudge: Attempting to send push')
        await sendPushToUser(db, input.patientId, PUSH_TEMPLATES.inactiveReminder())
        console.log('sendNudge: Push sent successfully (or skipped if no sub)')
      } catch (err) {
        console.error('sendNudge: Push failed', err)
        // Don't block flow for push failure
      }

      // Create internal notification
      try {
        console.log('sendNudge: Creating internal notification')
        await db.insert(notifications).values({
          id: nanoid(),
          userId: input.patientId,
          type: 'inactive_reminder',
          title: 'Sentimos sua falta!',
          message: `${therapistName} enviou um lembrete para você retomar sua rotina de autocuidado.`,
          metadata: {
            therapistId: ctx.user.id,
            therapistName,
          },
        })
        console.log('sendNudge: Internal notification created')
      } catch (err) {
        console.error('sendNudge: Database insert failed', err)
        throw err // This is critical, we should probably throw
      }

      // Send email if patient has one
      try {
        console.log('sendNudge: Fetching patient email')
        const patient = await db.query.users.findFirst({
          where: eq(users.id, input.patientId),
          columns: {
            name: true,
            email: true,
          },
        })
        console.log('sendNudge: Patient found', patient)

        if (patient?.email) {
          console.log('sendNudge: Sending email to', patient.email)
          const emailResult = await sendNudgeEmail(
            patient.email,
            patient.name || 'Paciente',
            therapistName
          )
          console.log('sendNudge: Email result', emailResult)
        } else {
          console.log('sendNudge: No email found for patient')
        }
      } catch (err) {
        console.error('sendNudge: Email flow failed', err)
      }

      console.log('--- sendNudge completed ---')
      return { success: true }
    }),
})
