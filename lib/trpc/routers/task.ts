import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TASK_LIMITS } from "@/lib/constants";
import { tasks, users, userStats } from "@/lib/db/schema";
import { getStartOfDay } from "@/lib/utils/timezone";
import { awardXPAndCoins, COIN_REWARDS, XP_REWARDS } from "@/lib/xp";
import { protectedProcedure, router } from "../trpc";
import { autoCheckBadges } from "./badge";

export const taskRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) =>
    ctx.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, ctx.user.id), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.createdAt))
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
      // Validate task limits for the due date
      const targetDate = input.dueDate || new Date();
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

        const coinReward = COIN_REWARDS.task[task.priority];
        let xpToDeduct = 0;
        let shouldResetXpDate = false;

        // Heuristic to check if this task awarded XP:
        // If the user's lastTaskXpDate is close to this task's completedAt
        if (user.lastTaskXpDate && task.completedAt) {
          const xpDate = new Date(user.lastTaskXpDate).getTime();
          const completedDate = new Date(task.completedAt).getTime();
          // Allow a small time difference (e.g., 5 seconds) because updates happen sequentially
          if (Math.abs(completedDate - xpDate) < 5000) {
            xpToDeduct = XP_REWARDS.task[task.priority];
            shouldResetXpDate = true;
          }
        }

        // Update user stats (remove rewards)
        const newCoins = Math.max(0, user.coins - coinReward);
        const newExperience = Math.max(0, user.experience - xpToDeduct);
        // Recalculate level based on new XP
        const newLevel = Math.floor(newExperience / 100) + 1;

        const updateData: any = {
          coins: newCoins,
          experience: newExperience,
          level: newLevel,
          updatedAt: now,
        };

        if (shouldResetXpDate) {
          // Reset to null so they can earn again today if they complete another task
          updateData.lastTaskXpDate = null;
        }

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
          status: "uncompleted"
        };
      }

      // If task is not completed, complete it (award rewards)
      // Award XP and Coins using centralized system
      const result = await awardXPAndCoins(
        ctx.db,
        ctx.user.id,
        "task",
        task.priority
      );

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
      const [stats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1);

      if (stats) {
        await ctx.db
          .update(userStats)
          .set({
            completedTasks: stats.completedTasks + 1,
            updatedAt: now,
          })
          .where(eq(userStats.userId, ctx.user.id));
      }

      // Check for new badges
      const newBadges = await autoCheckBadges(ctx.user.id, ctx.db);

      return {
        xp: xpAwarded,
        coins: coinsAwarded,
        levelUp,
        newBadges,
        status: "completed"
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
});
