import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { patientInvites, psychologistPatients, users } from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email";
import { protectedProcedure, router } from "../trpc";

export const patientRouter = router({
  // Send invite (psychologist only)
  sendInvite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        phone: z.string().optional(),
        birthdate: z.string().optional(),
        gender: z
          .enum(["male", "female", "other", "prefer_not_to_say"])
          .optional(),
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
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas psicólogos podem enviar convites",
        });
      }

      // Check if email already registered
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este email já está cadastrado",
        });
      }

      // Check if there's already a pending invite
      const existingInvite = await db.query.patientInvites.findFirst({
        where: and(
          eq(patientInvites.email, input.email),
          eq(patientInvites.status, "pending")
        ),
      });

      if (existingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe um convite pendente para este email",
        });
      }

      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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
          status: "pending",
          expiresAt,
        })
        .returning();

      // Send email
      try {
        await sendInviteEmail(
          input.email,
          input.name,
          ctx.user.name || "Seu psicólogo",
          token
        );
      } catch (error) {
        console.error("Failed to send invite email:", error);
        // Don't throw - invite is still created
      }

      return { success: true, inviteId: invite.id };
    }),

  // Get all invites (psychologist only)
  getInvites: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "psychologist") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return db.query.patientInvites.findMany({
      where: eq(patientInvites.psychologistId, ctx.user.id),
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    });
  }),

  // Resend invite
  resendInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const invite = await db.query.patientInvites.findFirst({
        where: and(
          eq(patientInvites.id, input.inviteId),
          eq(patientInvites.psychologistId, ctx.user.id)
        ),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Convite não encontrado",
        });
      }

      if (invite.status !== "pending" && invite.status !== "expired") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Convite não pode ser reenviado",
        });
      }

      const newToken = nanoid(32);
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db
        .update(patientInvites)
        .set({
          token: newToken,
          status: "pending",
          expiresAt: newExpiresAt,
        })
        .where(eq(patientInvites.id, input.inviteId));

      try {
        await sendInviteEmail(
          invite.email,
          invite.name,
          ctx.user.name || "Seu psicólogo",
          newToken
        );
      } catch (error) {
        console.error("Failed to resend invite email:", error);
      }

      return { success: true };
    }),

  // Cancel invite
  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const invite = await db.query.patientInvites.findFirst({
        where: and(
          eq(patientInvites.id, input.inviteId),
          eq(patientInvites.psychologistId, ctx.user.id)
        ),
      });

      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .update(patientInvites)
        .set({ status: "cancelled" })
        .where(eq(patientInvites.id, input.inviteId));

      return { success: true };
    }),

  // Accept invite (public - no auth required)
  getInviteByToken: protectedProcedure
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
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Convite não encontrado",
        });
      }

      if (invite.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este convite já foi aceito",
        });
      }

      if (invite.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este convite foi cancelado",
        });
      }

      if (new Date() > invite.expiresAt) {
        await db
          .update(patientInvites)
          .set({ status: "expired" })
          .where(eq(patientInvites.id, invite.id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este convite expirou",
        });
      }

      return invite;
    }),

  // Get my patients (psychologist only)
  getMyPatients: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "psychologist") {
      throw new TRPCError({ code: "FORBIDDEN" });
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
    });

    return relationships.map((rel) => ({
      ...rel.patient,
      isPrimary: rel.isPrimary,
      relationshipId: rel.id,
    }));
  }),

  // Get my psychologists (patient only)
  getMyPsychologists: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "patient") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const relationships = await db.query.psychologistPatients.findMany({
      where: eq(psychologistPatients.patientId, ctx.user.id),
      with: {
        psychologist: true,
      },
    });

    return relationships.map((rel) => ({
      ...rel.psychologist,
      isPrimary: rel.isPrimary,
      relationshipId: rel.id,
    }));
  }),
});
