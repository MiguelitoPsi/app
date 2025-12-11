import { and, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { MOOD_SCORE_MAP } from "@/lib/constants";
import {
  badges,
  journalEntries,
  meditationSessions,
  moodHistory,
  rewards,
  tasks,
  userStats,
  users,
} from "@/lib/db/schema";
import { formatDateSP } from "@/lib/utils/timezone";
import { addCoins, addRawXP, awardXPAndCoins } from "@/lib/xp";
import { protectedProcedure, router, suspensionCheckProcedure } from "../trpc";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Get user stats
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1);

    // Get task counts by priority
    const tasksHigh = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, ctx.user.id),
          eq(tasks.completed, true),
          eq(tasks.priority, "high")
        )
      );

    const tasksMedium = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, ctx.user.id),
          eq(tasks.completed, true),
          eq(tasks.priority, "medium")
        )
      );

    const tasksLow = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, ctx.user.id),
          eq(tasks.completed, true),
          eq(tasks.priority, "low")
        )
      );

    // Get total mood logs
    const moodLogsResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id));

    // Get redeemed rewards
    const rewardsResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(rewards)
      .where(and(eq(rewards.userId, ctx.user.id), eq(rewards.claimed, true)));

    // Get total meditation minutes
    const meditationMinutesResult = await ctx.db
      .select({ total: sum(meditationSessions.duration) })
      .from(meditationSessions)
      .where(eq(meditationSessions.userId, ctx.user.id));

    return {
      ...user,
      stats: stats || {
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: 0,
      },
      extendedStats: {
        completedTasksHigh: Number(tasksHigh[0]?.count || 0),
        completedTasksMedium: Number(tasksMedium[0]?.count || 0),
        completedTasksLow: Number(tasksLow[0]?.count || 0),
        totalMoodLogs: Number(moodLogsResult[0]?.count || 0),
        redeemedRewards: Number(rewardsResult[0]?.count || 0),
        totalMeditationMinutes: Number(meditationMinutesResult[0]?.total || 0),
      },
    };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1);

    if (!stats) {
      // Create stats if they don't exist
      const newStats = {
        userId: ctx.user.id,
        totalTasks: 0,
        completedTasks: 0,
        totalMeditations: 0,
        totalJournalEntries: 0,
        longestStreak: 0,
      };
      await ctx.db.insert(userStats).values(newStats);
      return newStats;
    }

    return stats;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        preferences: z
          .object({
            notifications: z.boolean().optional(),
            theme: z.enum(["light", "dark"]).optional(),
            language: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  addExperience: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(({ ctx, input }) => addRawXP(ctx.db, ctx.user.id, input.amount)),

  addCoins: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(({ ctx, input }) => addCoins(ctx.db, ctx.user.id, input.amount)),

  updateAvatar: protectedProcedure
    .input(
      z.object({
        accessory: z.string(),
        shirtColor: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const currentPreferences = user.preferences || {};

      await ctx.db
        .update(users)
        .set({
          preferences: {
            ...currentPreferences,
            avatar_config: input,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  updateTheme: protectedProcedure
    .input(z.object({ theme: z.enum(["light", "dark"]) }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const currentPreferences = user.preferences || {};

      await ctx.db
        .update(users)
        .set({
          preferences: {
            ...currentPreferences,
            theme: input.theme,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  trackMood: protectedProcedure
    .input(
      z.object({
        mood: z.enum(["happy", "calm", "neutral", "sad", "anxious", "angry"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, "mood");
      const xpAwarded = result.xpAwarded;

      // Always save mood
      await ctx.db.insert(moodHistory).values({
        id: nanoid(),
        userId: ctx.user.id,
        mood: input.mood,
        xpAwarded,
      });

      // Update lastActiveAt on user action
      await ctx.db
        .update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { xp: xpAwarded, saved: true };
    }),

  getMoodHistory: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const moods = await ctx.db
        .select()
        .from(moodHistory)
        .where(eq(moodHistory.userId, ctx.user.id))
        .orderBy(desc(moodHistory.createdAt))
        .limit(input.days * 5); // Get more to account for multiple entries per day

      // Group by day and calculate average score
      const moodsByDay = new Map<string, number[]>();

      for (const mood of moods) {
        const day = formatDateSP(mood.createdAt);
        const score =
          MOOD_SCORE_MAP[mood.mood as keyof typeof MOOD_SCORE_MAP] || 60;

        if (!moodsByDay.has(day)) {
          moodsByDay.set(day, []);
        }
        moodsByDay.get(day)?.push(score);
      }

      // Calculate averages
      const result = Array.from(moodsByDay.entries())
        .map(([day, scores]) => ({
          date: day,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }))
        .slice(0, input.days)
        .reverse();

      return result;
    }),

  getLatestMood: protectedProcedure.query(async ({ ctx }) => {
    const [latestMood] = await ctx.db
      .select()
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id))
      .orderBy(desc(moodHistory.createdAt))
      .limit(1);

    return latestMood?.mood ?? null;
  }),

  hasRecentAnxiety: protectedProcedure.query(async ({ ctx }) => {
    // Check if the LATEST mood is anxious (not just any recent anxious mood)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get the most recent mood entry
    const [latestMood] = await ctx.db
      .select()
      .from(moodHistory)
      .where(eq(moodHistory.userId, ctx.user.id))
      .orderBy(desc(moodHistory.createdAt))
      .limit(1);

    // Check if latest mood is anxious and within last 24 hours
    const hasAnxiousMood =
      latestMood &&
      latestMood.mood === "anxious" &&
      latestMood.createdAt >= oneDayAgo;

    // Check journal entries for anxious mood in last 24 hours
    const [anxiousJournal] = await ctx.db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, ctx.user.id),
          eq(journalEntries.mood, "anxious"),
          gte(journalEntries.createdAt, oneDayAgo)
        )
      )
      .limit(1);

    return {
      hasAnxiety: Boolean(hasAnxiousMood || anxiousJournal),
      source: hasAnxiousMood ? "mood" : anxiousJournal ? "journal" : null,
    };
  }),

  checkTermsAccepted: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ termsAcceptedAt: users.termsAcceptedAt, role: users.role })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Both psychologists and patients need to accept terms
    if (user.role !== "psychologist" && user.role !== "patient") {
      return { needsToAcceptTerms: false, termsAcceptedAt: null };
    }

    return {
      needsToAcceptTerms: !user.termsAcceptedAt,
      termsAcceptedAt: user.termsAcceptedAt,
    };
  }),

  acceptTerms: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "psychologist" && user.role !== "patient") {
      throw new Error("Only psychologists and patients need to accept terms");
    }

    await ctx.db
      .update(users)
      .set({
        termsAcceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  // Verificar se a conta está suspensa ou deletada - usa procedimento especial que NÃO bloqueia suspensos
  checkSuspension: suspensionCheckProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        bannedAt: users.bannedAt,
        banReason: users.banReason,
        suspendedByTherapistId: users.suspendedByTherapistId,
        role: users.role,
        unlinkReason: users.unlinkReason,
        unlinkedByTherapistId: users.unlinkedByTherapistId,
        unlinkedByTherapistName: users.unlinkedByTherapistName,
        deletedAt: users.deletedAt,
        deletedReason: users.deletedReason,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      return { isSuspended: false, isDeleted: false };
    }

    return {
      isSuspended: Boolean(user.bannedAt),
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      suspendedByTherapistId: user.suspendedByTherapistId,
      role: user.role,
      unlinkReason: user.unlinkReason,
      unlinkedByTherapistId: user.unlinkedByTherapistId,
      unlinkedByTherapistName: user.unlinkedByTherapistName,
      isDeleted: Boolean(user.deletedAt),
      deletedAt: user.deletedAt,
      deletedReason: user.deletedReason,
    };
  }),

  // ============================================
  // LGPD - Direitos do Titular
  // ============================================

  // Exportar todos os dados do usuário (Portabilidade - Art. 18, V LGPD)
  exportMyData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Buscar dados do usuário
    const [user] = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        level: users.level,
        experience: users.experience,
        streak: users.streak,
        coins: users.coins,
        preferences: users.preferences,
        termsAcceptedAt: users.termsAcceptedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar tarefas
    const userTasks = await ctx.db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        category: tasks.category,
        completed: tasks.completed,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        frequency: tasks.frequency,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)));

    // Buscar entradas do diário
    const userJournals = await ctx.db
      .select({
        id: journalEntries.id,
        content: journalEntries.content,
        mood: journalEntries.mood,
        tags: journalEntries.tags,
        aiAnalysis: journalEntries.aiAnalysis,
        therapistFeedback: journalEntries.therapistFeedback,
        createdAt: journalEntries.createdAt,
      })
      .from(journalEntries)
      .where(
        and(eq(journalEntries.userId, userId), isNull(journalEntries.deletedAt))
      );

    // Buscar histórico de humor
    const userMoods = await ctx.db
      .select({
        id: moodHistory.id,
        mood: moodHistory.mood,
        createdAt: moodHistory.createdAt,
      })
      .from(moodHistory)
      .where(eq(moodHistory.userId, userId));

    // Buscar sessões de meditação
    const userMeditations = await ctx.db
      .select({
        id: meditationSessions.id,
        duration: meditationSessions.duration,
        type: meditationSessions.type,
        completed: meditationSessions.completed,
        createdAt: meditationSessions.createdAt,
      })
      .from(meditationSessions)
      .where(eq(meditationSessions.userId, userId));

    // Buscar recompensas
    const userRewards = await ctx.db
      .select({
        id: rewards.id,
        title: rewards.title,
        description: rewards.description,
        category: rewards.category,
        cost: rewards.cost,
        claimed: rewards.claimed,
        claimedAt: rewards.claimedAt,
        createdAt: rewards.createdAt,
      })
      .from(rewards)
      .where(and(eq(rewards.userId, userId), isNull(rewards.deletedAt)));

    // Buscar conquistas (badges)
    const userBadges = await ctx.db
      .select({
        id: badges.id,
        badgeId: badges.badgeId,
        title: badges.title,
        description: badges.description,
        unlockedAt: badges.unlockedAt,
      })
      .from(badges)
      .where(eq(badges.userId, userId));

    // Buscar estatísticas
    const [stats] = await ctx.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "LGPD_PORTABILITY_v1",
      user: {
        ...user,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
        termsAcceptedAt: user.termsAcceptedAt?.toISOString(),
      },
      statistics: stats || null,
      tasks: userTasks.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString(),
        completedAt: t.completedAt?.toISOString(),
        createdAt: t.createdAt?.toISOString(),
      })),
      journalEntries: userJournals.map((j) => ({
        ...j,
        createdAt: j.createdAt?.toISOString(),
      })),
      moodHistory: userMoods.map((m) => ({
        ...m,
        createdAt: m.createdAt?.toISOString(),
      })),
      meditationSessions: userMeditations.map((med) => ({
        ...med,
        createdAt: med.createdAt?.toISOString(),
      })),
      rewards: userRewards.map((r) => ({
        ...r,
        claimedAt: r.claimedAt?.toISOString(),
        createdAt: r.createdAt?.toISOString(),
      })),
      badges: userBadges.map((b) => ({
        ...b,
        unlockedAt: b.unlockedAt?.toISOString(),
      })),
    };

    return exportData;
  }),

  // Solicitar exclusão de conta (Eliminação - Art. 18, VI LGPD)
  requestAccountDeletion: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verificar se o email de confirmação está correto
      const [user] = await ctx.db
        .select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      if (user.email.toLowerCase() !== input.confirmEmail.toLowerCase()) {
        throw new Error(
          "E-mail de confirmação não corresponde ao e-mail da conta"
        );
      }

      // Se for terapeuta, não permitir exclusão se tiver pacientes vinculados
      // (eles precisam primeiro desvincular todos os pacientes)
      if (user.role === "psychologist") {
        const { psychologistPatients } = await import("@/lib/db/schema");
        const linkedPatients = await ctx.db
          .select({ id: psychologistPatients.id })
          .from(psychologistPatients)
          .where(eq(psychologistPatients.psychologistId, userId))
          .limit(1);

        if (linkedPatients.length > 0) {
          throw new Error(
            "Você possui pacientes vinculados. Desvincule todos os pacientes antes de excluir sua conta."
          );
        }
      }

      // Realizar soft delete
      const now = new Date();
      const deletionReason =
        input.reason || "Solicitação do titular (LGPD Art. 18, VI)";

      await ctx.db
        .update(users)
        .set({
          deletedAt: now,
          deletedReason: deletionReason,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message:
          "Sua conta foi marcada para exclusão. Você será deslogado automaticamente. Seus dados serão anonimizados/excluídos em até 30 dias, conforme nossa política de privacidade.",
      };
    }),
});
