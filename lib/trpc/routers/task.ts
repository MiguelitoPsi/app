import { and, asc, eq, isNull, lt, ne, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TASK_LIMITS } from "@/lib/constants";
import {
  patientTasksFromTherapist,
  psychologistPatients,
  tasks,
  userStats,
  users,
} from "@/lib/db/schema";
import { PUSH_TEMPLATES, sendPushToUser } from "@/lib/push";
import { getStartOfDay, nowInSP } from "@/lib/utils/timezone";
import {
  awardXPAndCoins,
  COIN_REWARDS,
  getOverduePenaltyMultiplier,
  XP_REWARDS,
} from "@/lib/xp";
import { awardTherapistXP } from "@/lib/xp/therapist";
import { protectedProcedure, router } from "../trpc";
import { autoCheckBadges } from "./badge";

export const taskRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) =>
    ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, ctx.user.id), isNull(tasks.deletedAt)))
      .orderBy(
        // Data mais próxima primeiro (nulls por último)
        sql`CASE WHEN ${tasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
        asc(tasks.dueDate),
        // Prioridade alta primeiro
        sql`CASE ${tasks.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
      )
  ),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.userId, ctx.user.id),
            isNull(tasks.deletedAt)
          )
        )
        .limit(1);

      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.date().optional(),
        frequency: z
          .enum(["once", "daily", "weekly", "monthly"])
          .default("once"),
        weekDays: z.array(z.number()).optional(),
        monthDays: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate that the date is not in the past
      const targetDate = input.dueDate || new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputTaskDate = new Date(targetDate);
      inputTaskDate.setHours(0, 0, 0, 0);

      if (inputTaskDate < today) {
        throw new Error(
          "Não é possível criar tarefas para datas que já passaram"
        );
      }

      // Validate task limits for the due date
      const dayStart = getStartOfDay(targetDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existingTasks = await ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, ctx.user.id),
            isNull(tasks.deletedAt),
            eq(tasks.priority, input.priority)
          )
        );

      const tasksOnDate = existingTasks.filter((t) => {
        if (!t.dueDate) {
          return false;
        }
        const taskDate = new Date(t.dueDate);
        return taskDate >= dayStart && taskDate < dayEnd;
      });

      // Check limits
      if (input.priority === "high" && tasksOnDate.length >= TASK_LIMITS.high) {
        throw new Error(
          `Limite de ${TASK_LIMITS.high} tarefas urgentes atingido para esta data`
        );
      }

      if (
        input.priority === "medium" &&
        tasksOnDate.length >= TASK_LIMITS.medium
      ) {
        throw new Error(
          `Limite de ${TASK_LIMITS.medium} tarefas médias atingido para esta data`
        );
      }

      const id = nanoid();
      const xpReward = XP_REWARDS.task[input.priority];
      const coinReward = COIN_REWARDS.task[input.priority];

      await ctx.db.insert(tasks).values({
        id,
        userId: ctx.user.id,
        ...input,
        experience: xpReward,
        coins: coinReward,
      });

      // Update stats
      const [stats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1);

      if (stats) {
        await ctx.db
          .update(userStats)
          .set({
            totalTasks: stats.totalTasks + 1,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, ctx.user.id));
      }

      return { id };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.id),
            eq(tasks.userId, ctx.user.id),
            isNull(tasks.deletedAt)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date();

      // If task is already completed, undo it (remove rewards)
      if (task.completed) {
        const [user] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (!user) throw new Error("User not found");

        // Calculate days overdue for penalty calculation (same logic as when completing)
        let daysOverdueForUndo = 0;
        const originalDateForUndo = task.originalDueDate || task.dueDate;
        if (originalDateForUndo && task.completedAt) {
          // Use completedAt date to calculate overdue days at the time of completion
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          const originalDueDateForUndo = new Date(originalDateForUndo);
          originalDueDateForUndo.setHours(0, 0, 0, 0);
          daysOverdueForUndo = Math.max(
            0,
            Math.floor(
              (completedDate.getTime() - originalDueDateForUndo.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
        }

        // Apply penalty multiplier to calculate actual rewards that were given
        const penaltyMultiplier = getOverduePenaltyMultiplier(
          daysOverdueForUndo,
          task.priority
        );
        const coinReward = Math.round(
          COIN_REWARDS.task[task.priority] * penaltyMultiplier
        );
        let xpToDeduct = 0;
        let shouldResetXpDate = false;

        // Heuristic to check if this task awarded XP:
        // If the user's lastTaskXpDate is close to this task's completedAt
        if (user.lastTaskXpDate && task.completedAt) {
          const xpDate = new Date(user.lastTaskXpDate).getTime();
          const completedDate = new Date(task.completedAt).getTime();
          // Allow a small time difference (e.g., 5 seconds) because updates happen sequentially
          if (Math.abs(completedDate - xpDate) < 5000) {
            // Apply the same penalty that was applied when task was completed
            xpToDeduct = Math.round(
              XP_REWARDS.task[task.priority] * penaltyMultiplier
            );
            shouldResetXpDate = true;
          }
        }

        // Update user stats (remove rewards)
        const newCoins = Math.max(0, user.coins - coinReward);
        const newExperience = Math.max(0, user.experience - xpToDeduct);
        // Recalculate level based on new XP
        const newLevel = Math.floor(newExperience / 100) + 1;

        const updateData = {
          coins: newCoins,
          experience: newExperience,
          level: newLevel,
          updatedAt: now,
          ...(shouldResetXpDate && { lastTaskXpDate: null }),
        };

        await ctx.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));

        // Mark task as incomplete
        await ctx.db
          .update(tasks)
          .set({
            completed: false,
            completedAt: null,
            updatedAt: now,
          })
          .where(eq(tasks.id, input.id));

        // Update stats
        const [stats] = await ctx.db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, ctx.user.id))
          .limit(1);

        if (stats) {
          await ctx.db
            .update(userStats)
            .set({
              completedTasks: Math.max(0, stats.completedTasks - 1),
              updatedAt: now,
            })
            .where(eq(userStats.userId, ctx.user.id));
        }

        return {
          xp: -xpToDeduct,
          coins: -coinReward,
          levelUp: false,
          newBadges: [],
          status: "uncompleted",
        };
      }

      // If task is not completed, complete it (award rewards)
      // Calculate days overdue for transferred tasks
      let daysOverdue = 0;
      const originalDate = task.originalDueDate || task.dueDate;
      if (originalDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const originalDueDate = new Date(originalDate);
        originalDueDate.setHours(0, 0, 0, 0);
        daysOverdue = Math.max(
          0,
          Math.floor(
            (today.getTime() - originalDueDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
      }

      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(ctx.db, ctx.user.id, "task", {
        priority: task.priority,
        daysOverdue,
      });

      const { xpAwarded, coinsAwarded, levelUp } = result;

      // Mark task as complete
      await ctx.db
        .update(tasks)
        .set({
          completed: true,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(tasks.id, input.id));

      // Update stats
      const [currentStats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1);

      if (currentStats) {
        await ctx.db
          .update(userStats)
          .set({
            completedTasks: currentStats.completedTasks + 1,
            updatedAt: now,
          })
          .where(eq(userStats.userId, ctx.user.id));
      }

      // Check for new badges
      const newBadges = await autoCheckBadges(ctx.user.id, ctx.db);

      // Update lastActiveAt on user action
      await ctx.db
        .update(users)
        .set({ lastActiveAt: now })
        .where(eq(users.id, ctx.user.id));

      return {
        xp: xpAwarded,
        coins: coinsAwarded,
        levelUp,
        newBadges,
        status: "completed",
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db
        .update(tasks)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));

      return { success: true };
    }),

  // ================== PATIENT VIEW - TASKS FROM THERAPIST ==================

  // Get tasks assigned to the current patient by their therapist
  getMyTasksFromTherapist: protectedProcedure.query(({ ctx }) => {
    // This is for patients to see tasks assigned to them by their therapist
    return ctx.db
      .select()
      .from(patientTasksFromTherapist)
      .where(
        and(
          eq(patientTasksFromTherapist.patientId, ctx.user.id),
          ne(patientTasksFromTherapist.status, "rejected")
        )
      )
      .orderBy(
        // Data mais próxima primeiro (nulls por último)
        sql`CASE WHEN ${patientTasksFromTherapist.dueDate} IS NULL THEN 1 ELSE 0 END`,
        asc(patientTasksFromTherapist.dueDate),
        // Prioridade alta primeiro
        sql`CASE ${patientTasksFromTherapist.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
      );
  }),

  // Complete a task assigned by therapist
  completeTherapistTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the task belongs to this patient
      const [task] = await ctx.db
        .select()
        .from(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.patientId, ctx.user.id)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date();

      if (task.status === "completed") {
        // Task is already completed, so we uncomplete it (toggle)
        const [user] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (!user) throw new Error("User not found");

        // Calculate XP/Coins to deduct
        // Sessões dão 40 XP/coins, outras tarefas baseadas na prioridade
        const isSession = task.category === "sessao";
        let xpToDeduct = 0;
        let coinReward = 0;

        if (isSession) {
          xpToDeduct = 40;
          coinReward = 40;
        } else {
          const xpRewards: Record<string, number> = {
            high: 30,
            medium: 10,
            low: 5,
          };
          const coinRewards: Record<string, number> = {
            high: 30,
            medium: 10,
            low: 5,
          };
          const priority = task.priority || "medium";
          xpToDeduct = xpRewards[priority] || 10;
          coinReward = coinRewards[priority] || 10;
        }

        // Update user stats (remove rewards)
        const newCoins = Math.max(0, user.coins - coinReward);
        const newExperience = Math.max(0, user.experience - xpToDeduct);
        // Recalculate level based on new XP
        const newLevel = Math.floor(newExperience / 100) + 1;

        await ctx.db
          .update(users)
          .set({
            coins: newCoins,
            experience: newExperience,
            level: newLevel,
            updatedAt: now,
          })
          .where(eq(users.id, ctx.user.id));

        // Mark task as pending
        await ctx.db
          .update(patientTasksFromTherapist)
          .set({
            status: "pending",
            completedAt: null,
            updatedAt: now,
          })
          .where(eq(patientTasksFromTherapist.id, input.taskId));

        return {
          success: true,
          xp: -xpToDeduct,
          coins: -coinReward,
          levelUp: false,
          status: "pending",
        };
      }

      // Task is not completed, so we complete it
      // Verificar se é uma tarefa de sessão (categoria 'sessao')
      const isSession = task.category === "sessao";

      // Award XP and coins - sessões dão 40 XP/coins, outras tarefas baseadas na prioridade
      const result = isSession
        ? await awardXPAndCoins(ctx.db, ctx.user.id, "session")
        : await awardXPAndCoins(ctx.db, ctx.user.id, "task", {
            priority: task.priority as "low" | "medium" | "high",
          });

      // Update task status
      await ctx.db
        .update(patientTasksFromTherapist)
        .set({
          status: "completed",
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(patientTasksFromTherapist.id, input.taskId));

      // Update lastActiveAt on user action
      await ctx.db
        .update(users)
        .set({ lastActiveAt: now })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        xp: result.xpAwarded,
        coins: result.coinsAwarded,
        levelUp: result.levelUp,
        status: "completed",
      };
    }),

  // Reject (delete from patient view) a task assigned by therapist
  rejectTherapistTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the task belongs to this patient
      const [task] = await ctx.db
        .select()
        .from(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.patientId, ctx.user.id)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date();

      if (task.status === "completed") {
        // Reuse logic to remove rewards
        const [user] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (user) {
          const isSession = task.category === "sessao";
          let xpToDeduct = 0;
          let coinReward = 0;

          if (isSession) {
            xpToDeduct = 40;
            coinReward = 40;
          } else {
            const xpRewards: Record<string, number> = {
              high: 30,
              medium: 10,
              low: 5,
            };
            const coinRewards: Record<string, number> = {
              high: 30,
              medium: 10,
              low: 5,
            };
            const priority = task.priority || "medium";
            xpToDeduct = xpRewards[priority] || 10;
            coinReward = coinRewards[priority] || 10;
          }

          const newCoins = Math.max(0, user.coins - coinReward);
          const newExperience = Math.max(0, user.experience - xpToDeduct);
          const newLevel = Math.floor(newExperience / 100) + 1;

          await ctx.db
            .update(users)
            .set({
              coins: newCoins,
              experience: newExperience,
              level: newLevel,
              updatedAt: now,
            })
            .where(eq(users.id, ctx.user.id));
        }
      }

      await ctx.db
        .update(patientTasksFromTherapist)
        .set({
          status: "rejected",
          updatedAt: now,
        })
        .where(eq(patientTasksFromTherapist.id, input.taskId));

      return { success: true };
    }),

  // Toggle completion of a task assigned by therapist (Psychologist only)
  togglePatientTaskByTherapist: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can toggle patient tasks");
      }

      const [task] = await ctx.db
        .select()
        .from(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.therapistId, ctx.user.id)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error("Task not found or not created by you");
      }

      const newStatus = task.status === "completed" ? "pending" : "completed";
      const now = new Date();

      await ctx.db
        .update(patientTasksFromTherapist)
        .set({
          status: newStatus,
          completedAt: newStatus === "completed" ? now : null,
          updatedAt: now,
        })
        .where(eq(patientTasksFromTherapist.id, input.taskId));

      return { success: true, status: newStatus };
    }),

  // ================== THERAPIST TASK MANAGEMENT ==================

  // Get tasks created by therapist for a specific patient
  getPatientTasksFromTherapist: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can access this");
      }

      // Verify therapist-patient relationship
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      });

      if (!relationship) {
        throw new Error("Patient not found or not linked to you");
      }

      return ctx.db
        .select()
        .from(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.therapistId, ctx.user.id),
            eq(patientTasksFromTherapist.patientId, input.patientId)
          )
        )
        .orderBy(
          // Data mais próxima primeiro (nulls por último)
          sql`CASE WHEN ${patientTasksFromTherapist.dueDate} IS NULL THEN 1 ELSE 0 END`,
          asc(patientTasksFromTherapist.dueDate),
          // Prioridade alta primeiro
          sql`CASE ${patientTasksFromTherapist.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`
        );
    }),

  // Create a task for a patient
  createForPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "once"]).default("daily"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can create tasks for patients");
      }

      // Verify therapist-patient relationship
      const relationship = await ctx.db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.psychologistId, ctx.user.id),
          eq(psychologistPatients.patientId, input.patientId)
        ),
      });

      if (!relationship) {
        throw new Error("Patient not found or not linked to you");
      }

      let parsedDueDate: Date | null = null;
      if (input.dueDate) {
        const [year, month, day] = input.dueDate.split("-").map(Number);
        parsedDueDate = new Date(year, month - 1, day);
        parsedDueDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone edge cases

        const today = nowInSP();
        const todayStr = formatDateSP(today);

        if (input.dueDate < todayStr) {
          throw new Error(
            "Não é possível criar tarefas para datas que já passaram"
          );
        }

        // Validate task limits for the due date
        // Limit: 2 High Priority, 5 Medium Priority
        // This must count tasks from BOTH 'tasks' (patient self-assigned) and 'patientTasksFromTherapist' (therapist assigned)

        const dayStart = new Date(taskDateForValidation);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // 1. Count from patient's personal tasks
        const personalTasks = await ctx.db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, input.patientId),
              isNull(tasks.deletedAt),
              eq(tasks.priority, input.priority),
              gte(tasks.dueDate, dayStart),
              lt(tasks.dueDate, dayEnd)
            )
          );

        // 2. Count from therapist assigned tasks (exclude rejected ones)
        const therapistAssignedTasks = await ctx.db
          .select()
          .from(patientTasksFromTherapist)
          .where(
            and(
              eq(patientTasksFromTherapist.patientId, input.patientId),
              ne(patientTasksFromTherapist.status, "rejected"),
              eq(patientTasksFromTherapist.priority, input.priority),
              gte(patientTasksFromTherapist.dueDate, dayStart),
              lt(patientTasksFromTherapist.dueDate, dayEnd)
            )
          );

        const totalTasks = personalTasks.length + therapistAssignedTasks.length;

        if (input.priority === "high" && totalTasks >= TASK_LIMITS.high) {
          throw new Error(
            `O paciente já possui ${totalTasks} tarefas de prioridade ALTA para esta data (Limite: ${TASK_LIMITS.high}).`
          );
        }

        if (input.priority === "medium" && totalTasks >= TASK_LIMITS.medium) {
          throw new Error(
            `O paciente já possui ${totalTasks} tarefas de prioridade MÉDIA para esta data (Limite: ${TASK_LIMITS.medium}).`
          );
        }
      }

      const id = nanoid();
      await ctx.db.insert(patientTasksFromTherapist).values({
        id,
        therapistId: ctx.user.id,
        patientId: input.patientId,
        title: input.title,
        description: input.description,
        frequency: input.frequency,
        priority: input.priority,
        dueDate: parsedDueDate,
        status: "pending",
      });

      // Award XP to therapist for creating task
      await awardTherapistXP(ctx.db, ctx.user.id, "createPatientTask");

      // Send push notification to patient
      const therapistName = ctx.user.name || "Seu terapeuta";
      await sendPushToUser(
        ctx.db,
        input.patientId,
        PUSH_TEMPLATES.therapistTask(therapistName, input.title)
      );

      return { id };
    }),

  // Delete a task for a patient
  deletePatientTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can delete these tasks");
      }

      await ctx.db
        .delete(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.therapistId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Send feedback on a completed task
  sendTaskFeedback: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can send feedback");
      }

      const [task] = await ctx.db
        .select()
        .from(patientTasksFromTherapist)
        .where(
          and(
            eq(patientTasksFromTherapist.id, input.taskId),
            eq(patientTasksFromTherapist.therapistId, ctx.user.id)
          )
        )
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      await ctx.db
        .update(patientTasksFromTherapist)
        .set({
          feedback: input.feedback,
          feedbackAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patientTasksFromTherapist.id, input.taskId));

      // Award XP for giving feedback
      await awardTherapistXP(ctx.db, ctx.user.id, "reviewPatientTask");

      return { success: true };
    }),

  // Get AI-suggested tasks for a patient (placeholder)
  getAISuggestedTasks: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(({ ctx, input: _input }) => {
      if (ctx.user.role !== "psychologist") {
        throw new Error("Only psychologists can access this");
      }

      // For now, return template suggestions
      // In the future, this could analyze patient data and generate personalized suggestions
      const suggestions = [
        {
          title: "Praticar respiração diafragmática",
          description:
            "Realizar 3 ciclos de respiração profunda, 5 segundos inspirando, 5 segundos expirando",
          frequency: "daily",
          priority: "medium",
        },
        {
          title: "Registro de pensamentos",
          description:
            "Anotar 1 pensamento automático identificado durante o dia e aplicar reestruturação cognitiva",
          frequency: "daily",
          priority: "high",
        },
        {
          title: "Exercício de mindfulness",
          description:
            "Praticar 10 minutos de atenção plena focada na respiração",
          frequency: "daily",
          priority: "medium",
        },
        {
          title: "Caminhada ao ar livre",
          description:
            "Caminhar por 20 minutos em ambiente natural, focando nas sensações do momento",
          frequency: "weekly",
          priority: "low",
        },
      ];

      return suggestions;
    }),

  // ================== OVERDUE TASK MANAGEMENT ==================

  // Transfer overdue tasks to today and return tasks that need urgent attention (2+ days overdue)
  transferOverdueTasks: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Calculate 2 days ago for urgent alerts
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Get all incomplete tasks that are overdue (due date before today)
    const overdueTasks = await ctx.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, ctx.user.id),
          isNull(tasks.deletedAt),
          eq(tasks.completed, false),
          lt(tasks.dueDate, today)
        )
      );

    const transferredTasks: string[] = [];
    const urgentTasks: {
      id: string;
      title: string;
      priority: string;
      originalDueDate: Date | null;
      daysOverdue: number;
    }[] = [];

    for (const task of overdueTasks) {
      if (!task.dueDate) continue;

      const taskDueDate = new Date(task.dueDate);
      const originalDate = task.originalDueDate || task.dueDate;

      // Calculate days overdue based on original due date
      const originalDueDate = new Date(originalDate);
      originalDueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor(
        (today.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Transfer task to today
      await ctx.db
        .update(tasks)
        .set({
          dueDate: today,
          // Only set originalDueDate if not already set
          originalDueDate: task.originalDueDate || taskDueDate,
          updatedAt: now,
        })
        .where(eq(tasks.id, task.id));

      transferredTasks.push(task.id);

      // Check if task is 2+ days overdue (based on original due date)
      if (daysOverdue >= 2) {
        urgentTasks.push({
          id: task.id,
          title: task.title,
          priority: task.priority,
          originalDueDate: task.originalDueDate || taskDueDate,
          daysOverdue,
        });
      }
    }

    return {
      transferredCount: transferredTasks.length,
      transferredTaskIds: transferredTasks,
      urgentTasks,
    };
  }),

  // Get overdue tasks that are 2+ days past their original due date
  getUrgentOverdueTasks: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Get all incomplete tasks
    const incompleteTasks = await ctx.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, ctx.user.id),
          isNull(tasks.deletedAt),
          eq(tasks.completed, false)
        )
      );

    const urgentTasks = incompleteTasks
      .filter((task) => {
        // Use originalDueDate if set, otherwise use dueDate
        const originalDate = task.originalDueDate || task.dueDate;
        if (!originalDate) return false;

        const originalDueDate = new Date(originalDate);
        originalDueDate.setHours(0, 0, 0, 0);

        // Check if 2+ days overdue
        const daysOverdue = Math.floor(
          (today.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue >= 2;
      })
      .map((task) => {
        const originalDate = task.originalDueDate || task.dueDate;
        const originalDueDate = new Date(originalDate as Date);
        originalDueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          (today.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: task.id,
          title: task.title,
          priority: task.priority,
          originalDueDate: originalDate,
          daysOverdue,
        };
      });

    return urgentTasks;
  }),
});
