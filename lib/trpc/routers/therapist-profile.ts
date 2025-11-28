/**
 * Router tRPC para gerenciamento do perfil profissional do terapeuta
 */

import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { therapistProfiles, users } from '@/lib/db/schema'
import { protectedProcedure, router } from '../trpc'

// Validation schemas
const attendanceTypeSchema = z.enum(['online', 'presential', 'both'])

const profileInputSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)'),
  birthDate: z.date(),
  crp: z.string().min(4, 'CRP deve ter pelo menos 4 caracteres'),
  education: z.string().min(3, 'Formação deve ter pelo menos 3 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  attendanceType: attendanceTypeSchema,
  clinicAddress: z.string().optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
})

export const therapistProfileRouter = router({
  // Check if profile is complete
  checkProfileComplete: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      return { needsProfile: false }
    }

    const [profile] = await ctx.db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.therapistId, ctx.user.id))
      .limit(1)

    return {
      needsProfile: !profile,
      profile: profile || null,
    }
  }),

  // Get therapist profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem acessar seu perfil profissional',
      })
    }

    const [profile] = await ctx.db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.therapistId, ctx.user.id))
      .limit(1)

    return profile || null
  }),

  // Check if username is available
  checkUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ therapistId: therapistProfiles.therapistId })
        .from(therapistProfiles)
        .where(eq(therapistProfiles.username, input.username))
        .limit(1)

      // If no existing username, it's available
      if (!existing) {
        return { available: true }
      }

      // If existing username belongs to current user, it's available
      return { available: existing.therapistId === ctx.user.id }
    }),

  // Create therapist profile
  createProfile: protectedProcedure.input(profileInputSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem criar perfil profissional',
      })
    }

    // Check if profile already exists
    const [existingProfile] = await ctx.db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.therapistId, ctx.user.id))
      .limit(1)

    if (existingProfile) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Perfil já existe. Use a atualização de perfil.',
      })
    }

    // Check if username is available
    const [existingUsername] = await ctx.db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.username, input.username))
      .limit(1)

    if (existingUsername) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Nome de usuário já está em uso',
      })
    }

    // Validate clinic address if attendance type is presential or both
    if (
      (input.attendanceType === 'presential' || input.attendanceType === 'both') &&
      !input.clinicAddress
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Endereço da clínica é obrigatório para atendimento presencial',
      })
    }

    await ctx.db.insert(therapistProfiles).values({
      therapistId: ctx.user.id,
      fullName: input.fullName,
      username: input.username,
      cpf: input.cpf,
      birthDate: input.birthDate,
      crp: input.crp,
      education: input.education,
      city: input.city,
      attendanceType: input.attendanceType,
      clinicAddress: input.clinicAddress || null,
      phone: input.phone,
    })

    // Also update the user name to match
    await ctx.db
      .update(users)
      .set({
        name: input.fullName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id))

    return { success: true }
  }),

  // Update therapist profile
  updateProfile: protectedProcedure.input(profileInputSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'psychologist') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas terapeutas podem atualizar perfil profissional',
      })
    }

    // Check if profile exists
    const [existingProfile] = await ctx.db
      .select()
      .from(therapistProfiles)
      .where(eq(therapistProfiles.therapistId, ctx.user.id))
      .limit(1)

    if (!existingProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Perfil não encontrado. Crie um perfil primeiro.',
      })
    }

    // Check if username is available (if changed)
    if (input.username !== existingProfile.username) {
      const [existingUsername] = await ctx.db
        .select()
        .from(therapistProfiles)
        .where(eq(therapistProfiles.username, input.username))
        .limit(1)

      if (existingUsername) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Nome de usuário já está em uso',
        })
      }
    }

    // Validate clinic address if attendance type is presential or both
    if (
      (input.attendanceType === 'presential' || input.attendanceType === 'both') &&
      !input.clinicAddress
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Endereço da clínica é obrigatório para atendimento presencial',
      })
    }

    await ctx.db
      .update(therapistProfiles)
      .set({
        fullName: input.fullName,
        username: input.username,
        cpf: input.cpf,
        birthDate: input.birthDate,
        crp: input.crp,
        education: input.education,
        city: input.city,
        attendanceType: input.attendanceType,
        clinicAddress: input.clinicAddress || null,
        phone: input.phone,
        updatedAt: new Date(),
      })
      .where(eq(therapistProfiles.therapistId, ctx.user.id))

    // Also update the user name to match
    await ctx.db
      .update(users)
      .set({
        name: input.fullName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id))

    return { success: true }
  }),
})
