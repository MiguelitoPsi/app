/**
 * Router tRPC para relatórios e insights de pacientes
 */

import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  cognitiveConceptualization,
  journalEntries,
  moodHistory,
  patientTasksFromTherapist,
  psychologistPatients,
  sessionDocuments,
  tasks,
  weeklyReports,
} from "@/lib/db/schema";
import { PUSH_TEMPLATES, sendPushToUser } from "@/lib/push";
import { awardTherapistXP } from "@/lib/xp/therapist";
import { protectedProcedure, router } from "../trpc";

export const therapistReportsRouter = router({
  // ==========================================
  // REGISTROS DE HUMOR
  // ==========================================

  // Obter histórico de humor de um paciente
  getPatientMoodHistory: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar se o paciente pertence ao terapeuta
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a este paciente",
        });
      }

      const conditions = [eq(moodHistory.userId, input.patientId)];

      if (input.startDate) {
        conditions.push(gte(moodHistory.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(moodHistory.createdAt, input.endDate));
      }

      const moods = await db
        .select()
        .from(moodHistory)
        .where(and(...conditions))
        .orderBy(desc(moodHistory.createdAt))
        .limit(input.limit);

      // Registrar visualização (dar XP)
      await awardTherapistXP(db, ctx.user.id, "viewMoodReport");

      return moods;
    }),

  // ==========================================
  // REGISTROS DE PENSAMENTO (DIÁRIO)
  // ==========================================

  // Obter entradas do diário de um paciente
  getPatientJournalEntries: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        mood: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const conditions = [eq(journalEntries.userId, input.patientId)];

      if (input.startDate) {
        conditions.push(gte(journalEntries.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(journalEntries.createdAt, input.endDate));
      }
      if (input.mood) {
        conditions.push(eq(journalEntries.mood, input.mood));
      }

      const entries = await db
        .select()
        .from(journalEntries)
        .where(and(...conditions))
        .orderBy(desc(journalEntries.createdAt))
        .limit(input.limit);

      // Dar XP por visualizar
      await awardTherapistXP(db, ctx.user.id, "viewThoughtRecord");

      return entries;
    }),

  // Obter detalhes de uma entrada específica
  getJournalEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [entry] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, input.entryId))
        .limit(1);

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verificar se o paciente pertence ao terapeuta
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, entry.userId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return entry;
    }),

  // ==========================================
  // RELATÓRIOS SEMANAIS GERADOS POR IA
  // ==========================================

  // Obter relatórios semanais de um paciente
  getWeeklyReports: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        limit: z.number().min(1).max(20).default(4),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const reports = await db
        .select()
        .from(weeklyReports)
        .where(
          and(
            eq(weeklyReports.therapistId, ctx.user.id),
            eq(weeklyReports.patientId, input.patientId)
          )
        )
        .orderBy(desc(weeklyReports.weekStart))
        .limit(input.limit);

      return reports;
    }),

  // Marcar relatório como visualizado
  markReportViewed: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [report] = await db
        .select()
        .from(weeklyReports)
        .where(
          and(
            eq(weeklyReports.id, input.reportId),
            eq(weeklyReports.therapistId, ctx.user.id)
          )
        )
        .limit(1);

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!report.isViewed) {
        await db
          .update(weeklyReports)
          .set({ isViewed: true, viewedAt: new Date() })
          .where(eq(weeklyReports.id, input.reportId));

        // Dar XP por visualizar relatório
        await awardTherapistXP(db, ctx.user.id, "viewWeeklyReport");
      }

      return { success: true };
    }),

  // Gerar relatório semanal (placeholder para integração com IA)
  generateWeeklyReport: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        weekStart: z.date(),
        weekEnd: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Coletar dados da semana
      const moods = await db
        .select()
        .from(moodHistory)
        .where(
          and(
            eq(moodHistory.userId, input.patientId),
            gte(moodHistory.createdAt, input.weekStart),
            lte(moodHistory.createdAt, input.weekEnd)
          )
        );

      const journals = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, input.patientId),
            gte(journalEntries.createdAt, input.weekStart),
            lte(journalEntries.createdAt, input.weekEnd)
          )
        );

      const patientTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, input.patientId),
            gte(tasks.createdAt, input.weekStart),
            lte(tasks.createdAt, input.weekEnd)
          )
        );

      // Análise básica (pode ser substituída por IA)
      const moodCounts = moods.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantMoods = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([mood]) => mood);

      const completedTasksCount = patientTasks.filter(
        (t) => t.completed
      ).length;
      const totalTasksCount = patientTasks.length;

      // TODO: Integrar com serviço de IA para análise mais profunda
      const aiAnalysis = `Resumo da semana: O paciente registrou ${
        moods.length
      } entradas de humor, com predominância de estados ${
        dominantMoods.join(", ") || "não registrados"
      }. Foram criadas ${totalTasksCount} tarefas, das quais ${completedTasksCount} foram concluídas (${
        totalTasksCount > 0
          ? Math.round((completedTasksCount / totalTasksCount) * 100)
          : 0
      }% de conclusão). ${
        journals.length
      } entradas de diário foram registradas.`;

      // Criar relatório
      const [report] = await db
        .insert(weeklyReports)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          patientId: input.patientId,
          weekStart: input.weekStart,
          weekEnd: input.weekEnd,
          moodSummary: `Registros: ${moods.length}. Humor dominante: ${
            dominantMoods[0] || "N/A"
          }`,
          thoughtPatterns: {
            patterns: journals.flatMap((j) => j.tags || []).slice(0, 5),
            frequency: moodCounts,
          },
          emotionalTrends: {
            dominant: dominantMoods,
            improving: [],
            concerning: dominantMoods.filter((m) =>
              ["sad", "anxious", "angry"].includes(m)
            ),
          },
          triggers: journals
            .filter((j) => j.aiAnalysis)
            .map((j) => j.mood || "")
            .filter(Boolean)
            .slice(0, 5),
          interventionSuggestions: [
            {
              suggestion: "Continuar monitorando padrões de humor",
              rationale:
                "Acompanhamento regular permite identificar tendências",
              priority: "medium" as const,
            },
          ],
          aiAnalysis,
          isViewed: false,
        })
        .returning();

      return report;
    }),

  // ==========================================
  // TAREFAS DO PACIENTE (CRIADAS PELO TERAPEUTA)
  // ==========================================

  // Criar tarefa para paciente
  createPatientTask: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().default("terapia"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.date().optional(),
        frequency: z
          .enum(["once", "daily", "weekly", "monthly"])
          .default("once"),
        weekDays: z.array(z.number().min(0).max(6)).optional(),
        xpReward: z.number().min(5).max(100).default(20),
        isAiSuggested: z.boolean().default(false),
        metadata: z
          .object({
            icon: z.string().optional(),
            color: z.string().optional(),
            aiRationale: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [task] = await db
        .insert(patientTasksFromTherapist)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          patientId: input.patientId,
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
          dueDate: input.dueDate,
          frequency: input.frequency,
          weekDays: input.weekDays,
          xpReward: input.xpReward,
          isAiSuggested: input.isAiSuggested,
          metadata: input.metadata,
          status: "pending",
        })
        .returning();

      // Dar XP por criar tarefa
      await awardTherapistXP(db, ctx.user.id, "createPatientTask");

      // Send push notification to patient
      const therapistName = ctx.user.name || "Seu terapeuta";
      await sendPushToUser(
        db,
        input.patientId,
        PUSH_TEMPLATES.therapistTask(therapistName, input.title)
      );

      return task;
    }),

  // Listar tarefas criadas para um paciente
  getPatientTasks: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        status: z
          .enum(["pending", "accepted", "completed", "rejected"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const conditions = [
        eq(patientTasksFromTherapist.therapistId, ctx.user.id),
        eq(patientTasksFromTherapist.patientId, input.patientId),
      ];

      if (input.status) {
        conditions.push(eq(patientTasksFromTherapist.status, input.status));
      }

      const tasksList = await db
        .select()
        .from(patientTasksFromTherapist)
        .where(and(...conditions))
        .orderBy(
          // Data mais próxima primeiro (nulls por último)
          sql`CASE WHEN ${patientTasksFromTherapist.dueDate} IS NULL THEN 1 ELSE 0 END`,
          asc(patientTasksFromTherapist.dueDate),
          // Prioridade alta primeiro
          sql`CASE ${patientTasksFromTherapist.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
        );

      return tasksList;
    }),

  // Enviar feedback para uma tarefa
  sendTaskFeedback: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        feedback: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [task] = await db
        .update(patientTasksFromTherapist)
        .set({
          feedback: input.feedback,
          feedbackAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.therapistId, ctx.user.id)
          )
        )
        .returning();

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Dar XP por enviar feedback
      await awardTherapistXP(db, ctx.user.id, "sendWeeklyFeedback");

      return task;
    }),

  // ==========================================
  // ANÁLISES E INSIGHTS
  // ==========================================

  // Obter resumo geral do paciente
  getPatientSummary: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [moodsLast30, journalsLast30, tasksLast30] = await Promise.all([
        db
          .select()
          .from(moodHistory)
          .where(
            and(
              eq(moodHistory.userId, input.patientId),
              gte(moodHistory.createdAt, thirtyDaysAgo)
            )
          ),
        db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, input.patientId),
              gte(journalEntries.createdAt, thirtyDaysAgo)
            )
          ),
        db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, input.patientId),
              gte(tasks.createdAt, thirtyDaysAgo)
            )
          ),
      ]);

      // Calcular métricas
      const moodFrequency = moodsLast30.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const taskCompletion =
        tasksLast30.length > 0
          ? Math.round(
              (tasksLast30.filter((t) => t.completed).length /
                tasksLast30.length) *
                100
            )
          : 0;

      return {
        last30Days: {
          moodEntries: moodsLast30.length,
          journalEntries: journalsLast30.length,
          tasksCreated: tasksLast30.length,
          tasksCompleted: tasksLast30.filter((t) => t.completed).length,
          taskCompletionRate: taskCompletion,
        },
        moodFrequency,
        recentMoods: moodsLast30.slice(0, 7),
        recentJournals: journalsLast30.slice(0, 5),
      };
    }),

  // Obter tendências emocionais ao longo do tempo
  getEmotionalTrends: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const moods = await db
        .select()
        .from(moodHistory)
        .where(
          and(
            eq(moodHistory.userId, input.patientId),
            gte(moodHistory.createdAt, startDate)
          )
        )
        .orderBy(moodHistory.createdAt);

      // Agrupar por dia
      const dailyMoods = moods.reduce((acc, m) => {
        const dateKey = m.createdAt.toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(m.mood);
        return acc;
      }, {} as Record<string, string[]>);

      // Calcular score médio por dia
      const moodScores: Record<string, number> = {
        happy: 100,
        calm: 80,
        neutral: 60,
        sad: 40,
        anxious: 30,
        angry: 20,
      };

      const dailyScores = Object.entries(dailyMoods).map(([date, dayMoods]) => {
        const avgScore =
          dayMoods.reduce((sum, m) => sum + (moodScores[m] || 50), 0) /
          dayMoods.length;
        return {
          date,
          avgScore: Math.round(avgScore),
          moods: dayMoods,
          count: dayMoods.length,
        };
      });

      const lastScore = dailyScores.at(-1);
      return {
        dailyScores,
        overallTrend:
          dailyScores.length >= 2 && lastScore
            ? lastScore.avgScore - dailyScores[0].avgScore
            : 0,
      };
    }),

  // ==========================================
  // DOCUMENTOS DE SESSÃO
  // ==========================================

  // Upload de documento de sessão (PDF ou imagem)
  uploadSessionDocument: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        fileName: z.string(),
        fileType: z.enum(["pdf", "image"]),
        mimeType: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // Base64 encoded
        description: z.string().optional(),
        sessionDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar se o paciente pertence ao terapeuta
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a este paciente",
        });
      }

      // Validar tamanho do arquivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (input.fileSize > maxSize) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O arquivo deve ter no máximo 10MB",
        });
      }

      const document = await db
        .insert(sessionDocuments)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          patientId: input.patientId,
          fileName: input.fileName,
          fileType: input.fileType,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileData: input.fileData,
          description: input.description,
          sessionDate: input.sessionDate,
        })
        .returning();

      return document[0];
    }),

  // Listar documentos de um paciente
  getPatientDocuments: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verificar acesso
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const documents = await db
        .select({
          id: sessionDocuments.id,
          fileName: sessionDocuments.fileName,
          fileType: sessionDocuments.fileType,
          mimeType: sessionDocuments.mimeType,
          fileSize: sessionDocuments.fileSize,
          description: sessionDocuments.description,
          sessionDate: sessionDocuments.sessionDate,
          createdAt: sessionDocuments.createdAt,
        })
        .from(sessionDocuments)
        .where(
          and(
            eq(sessionDocuments.therapistId, ctx.user.id),
            eq(sessionDocuments.patientId, input.patientId)
          )
        )
        .orderBy(desc(sessionDocuments.createdAt))
        .limit(input.limit);

      return documents;
    }),

  // Obter documento específico (com dados do arquivo)
  getDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const document = await db
        .select()
        .from(sessionDocuments)
        .where(
          and(
            eq(sessionDocuments.id, input.documentId),
            eq(sessionDocuments.therapistId, ctx.user.id)
          )
        )
        .limit(1);

      if (document.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      return document[0];
    }),

  // Excluir documento
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const document = await db
        .select()
        .from(sessionDocuments)
        .where(
          and(
            eq(sessionDocuments.id, input.documentId),
            eq(sessionDocuments.therapistId, ctx.user.id)
          )
        )
        .limit(1);

      if (document.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      await db
        .delete(sessionDocuments)
        .where(eq(sessionDocuments.id, input.documentId));

      return { success: true };
    }),

  // ==========================================
  // COGNITIVE CONCEPTUALIZATION
  // ==========================================

  // Get cognitive conceptualization for a patient
  getCognitiveConceptualization: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify access
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [conceptualization] = await db
        .select()
        .from(cognitiveConceptualization)
        .where(
          and(
            eq(cognitiveConceptualization.therapistId, ctx.user.id),
            eq(cognitiveConceptualization.patientId, input.patientId)
          )
        )
        .limit(1);

      return conceptualization ?? null;
    }),

  // Save or update cognitive conceptualization
  saveCognitiveConceptualization: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        name: z.string().optional(),
        date: z.date().optional(),
        childhoodData: z.string().optional(),
        coreBelief: z.string().optional(),
        conditionalAssumptions: z.string().optional(),
        compensatoryStrategies: z.string().optional(),
        situations: z
          .object({
            situation1: z
              .object({
                situation: z.string(),
                automaticThought: z.string(),
                meaningOfAT: z.string(),
                emotion: z.string(),
                behavior: z.string(),
              })
              .optional(),
            situation2: z
              .object({
                situation: z.string(),
                automaticThought: z.string(),
                meaningOfAT: z.string(),
                emotion: z.string(),
                behavior: z.string(),
              })
              .optional(),
            situation3: z
              .object({
                situation: z.string(),
                automaticThought: z.string(),
                meaningOfAT: z.string(),
                emotion: z.string(),
                behavior: z.string(),
              })
              .optional(),
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify access
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check if already exists
      const [existing] = await db
        .select()
        .from(cognitiveConceptualization)
        .where(
          and(
            eq(cognitiveConceptualization.therapistId, ctx.user.id),
            eq(cognitiveConceptualization.patientId, input.patientId)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(cognitiveConceptualization)
          .set({
            name: input.name,
            date: input.date,
            childhoodData: input.childhoodData,
            coreBelief: input.coreBelief,
            conditionalAssumptions: input.conditionalAssumptions,
            compensatoryStrategies: input.compensatoryStrategies,
            situations: input.situations,
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(cognitiveConceptualization.id, existing.id))
          .returning();

        return updated;
      }

      // Create new
      const [created] = await db
        .insert(cognitiveConceptualization)
        .values({
          id: nanoid(),
          therapistId: ctx.user.id,
          patientId: input.patientId,
          name: input.name,
          date: input.date,
          childhoodData: input.childhoodData,
          coreBelief: input.coreBelief,
          conditionalAssumptions: input.conditionalAssumptions,
          compensatoryStrategies: input.compensatoryStrategies,
          situations: input.situations,
          notes: input.notes,
        })
        .returning();

      return created;
    }),

  // Delete cognitive conceptualization
  deleteCognitiveConceptualization: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [conceptualization] = await db
        .select()
        .from(cognitiveConceptualization)
        .where(
          and(
            eq(cognitiveConceptualization.therapistId, ctx.user.id),
            eq(cognitiveConceptualization.patientId, input.patientId)
          )
        )
        .limit(1);

      if (!conceptualization) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .delete(cognitiveConceptualization)
        .where(eq(cognitiveConceptualization.id, conceptualization.id));

      return { success: true };
    }),

  // Approve cognitive conceptualization
  approveCognitiveConceptualization: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify access
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [conceptualization] = await db
        .select()
        .from(cognitiveConceptualization)
        .where(
          and(
            eq(cognitiveConceptualization.therapistId, ctx.user.id),
            eq(cognitiveConceptualization.patientId, input.patientId)
          )
        )
        .limit(1);

      if (!conceptualization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conceituação cognitiva não encontrada",
        });
      }

      // Check if there's enough data to approve
      const hasRequiredData =
        conceptualization.coreBelief && conceptualization.childhoodData;
      if (!hasRequiredData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A conceituação precisa ter pelo menos a crença central e dados de infância preenchidos para ser aprovada",
        });
      }

      const [updated] = await db
        .update(cognitiveConceptualization)
        .set({
          isApproved: true,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cognitiveConceptualization.id, conceptualization.id))
        .returning();

      return updated;
    }),

  // Save therapeutic plan generated by AI
  saveTherapeuticPlan: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        therapeuticPlan: z.object({
          objectives: z.array(z.string()),
          interventions: z.array(
            z.object({
              technique: z.string(),
              description: z.string(),
              targetBelief: z.string().optional(),
            })
          ),
          suggestedActivities: z.array(z.string()),
          estimatedDuration: z.string(),
          observations: z.string(),
          generatedAt: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify access
      const relationship = await db
        .select()
        .from(psychologistPatients)
        .where(
          and(
            eq(psychologistPatients.psychologistId, ctx.user.id),
            eq(psychologistPatients.patientId, input.patientId)
          )
        )
        .limit(1);

      if (relationship.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [conceptualization] = await db
        .select()
        .from(cognitiveConceptualization)
        .where(
          and(
            eq(cognitiveConceptualization.therapistId, ctx.user.id),
            eq(cognitiveConceptualization.patientId, input.patientId)
          )
        )
        .limit(1);

      if (!conceptualization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conceituação cognitiva não encontrada",
        });
      }

      const [updated] = await db
        .update(cognitiveConceptualization)
        .set({
          therapeuticPlan: input.therapeuticPlan,
          updatedAt: new Date(),
        })
        .where(eq(cognitiveConceptualization.id, conceptualization.id))
        .returning();

      return updated;
    }),
});
