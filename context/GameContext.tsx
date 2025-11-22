"use client";

import type React from "react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { AvatarConfig, GameContextType, Mood, UserStats } from "../types";

const GameContext = createContext<GameContextType | undefined>(undefined);

export const RANKS = [
  { level: 1, name: "Iniciante", xpRequired: 0, description: "O começo de uma grande jornada." },
  { level: 2, name: "Aprendiz", xpRequired: 100, description: "Aprendendo os fundamentos." },
  { level: 3, name: "Explorador", xpRequired: 250, description: "Descobrindo novos horizontes." },
  { level: 4, name: "Aventureiro", xpRequired: 500, description: "Enfrentando desafios maiores." },
  { level: 5, name: "Veterano", xpRequired: 1000, description: "Experiência acumulada." },
  { level: 6, name: "Mestre", xpRequired: 2000, description: "Domínio sobre a mente." },
  { level: 7, name: "Lenda", xpRequired: 5000, description: "Um exemplo para todos." },
];

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const utils = trpc.useUtils();

  // Fetch user profile
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Fetch tasks
  const { data: tasksData = [] } = trpc.task.getAll.useQuery();

  // Fetch journal entries
  const { data: journalData = [] } = trpc.journal.getAll.useQuery();

  // Fetch badges
  const { data: badgesData = [] } = trpc.badge.getAll.useQuery();

  // Fetch rewards
  const { data: rewardsData = [] } = trpc.reward.getAll.useQuery();

  // Convert user profile to UserStats format
  const stats: UserStats = useMemo(() => {
    if (!userProfile) {
      return {
        name: "",
        xp: 0,
        level: 1,
        points: 0,
        streak: 0,
        longestStreak: 0,
        badges: [],
        avatarConfig: { accessory: "none", shirtColor: "bg-blue-500" },
        theme: "light",
        totalMeditationMinutes: 0,
        dailyMeditationCount: 0,
        lastMeditationDate: 0,
        totalTasksCompleted: 0,
        totalJournals: 0,
        tutorialCompleted: false,
        lastMoodXPTimestamp: undefined,
        rewards: [],
        completedTasksHigh: 0,
        completedTasksMedium: 0,
        completedTasksLow: 0,
        totalMoodLogs: 0,
        redeemedRewards: 0,
        engagement: 0,
      };
    }

    const avatarConfig = (
      userProfile.preferences as Record<string, unknown> | null
    )?.avatar_config as AvatarConfig | undefined;
    const theme = (userProfile.preferences as Record<string, unknown> | null)
      ?.theme as "light" | "dark" | undefined;

    // Cast userProfile to any to access extendedStats since type inference might lag
    // biome-ignore lint/suspicious/noExplicitAny: extendedStats added in router
    const extendedStats = (userProfile as any).extendedStats || {};
    const dbStats = (userProfile as any).stats || {};

    // Calculate engagement for today
    const now = new Date();
    const isSameDay = (d1: number, d2: Date) => {
      if (!d1) return false;
      const date1 = new Date(d1);
      return date1.getDate() === d2.getDate() && 
             date1.getMonth() === d2.getMonth() && 
             date1.getFullYear() === d2.getFullYear();
    };

    const lastTaskDate = userProfile.lastTaskXpDate ? new Date(userProfile.lastTaskXpDate).getTime() : 0;
    const lastJournalDate = userProfile.lastJournalXpDate ? new Date(userProfile.lastJournalXpDate).getTime() : 0;
    const lastMeditationDate = userProfile.lastMeditationXpDate ? new Date(userProfile.lastMeditationXpDate).getTime() : 0;

    const hasTaskToday = isSameDay(lastTaskDate, now);
    const hasJournalToday = isSameDay(lastJournalDate, now);
    const hasMeditationToday = isSameDay(lastMeditationDate, now);
    
    const engagementScore = (hasTaskToday ? 1 : 0) + (hasJournalToday ? 1 : 0) + (hasMeditationToday ? 1 : 0);
    const isEngaged = engagementScore >= 3 ? 1 : 0;

    return {
      name: userProfile.name || "",
      xp: userProfile.experience || 0,
      level: userProfile.level || 1,
      points: userProfile.coins || 0,
      streak: userProfile.streak || 0,
      longestStreak: dbStats.longestStreak || userProfile.streak || 0,
      badges: badgesData.map((b) => ({
        id: b.badgeId,
        date: b.unlockedAt ? new Date(b.unlockedAt).getTime() : Date.now(),
      })),
      avatarConfig: avatarConfig || {
        accessory: "none",
        shirtColor: "bg-blue-500",
      },
      theme: theme || "light",
      totalMeditationMinutes: extendedStats.totalMeditationMinutes || 0,
      dailyMeditationCount: 0,
      lastMeditationDate: lastMeditationDate,
      totalTasksCompleted: dbStats.completedTasks || 0,
      totalJournals: journalData.length,
      tutorialCompleted: true,
      lastMoodXPTimestamp: userProfile.lastMoodXpDate
        ? new Date(userProfile.lastMoodXpDate).getTime()
        : undefined,
      rewards: rewardsData.map((r) => ({
        id: r.id,
        title: r.title,
        category: (r.category as any) || "lazer",
        cost: r.cost,
        status: r.claimed
          ? "redeemed"
          : r.cost > 0
          ? "approved"
          : "pending",
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
      })),
      completedTasksHigh: extendedStats.completedTasksHigh || 0,
      completedTasksMedium: extendedStats.completedTasksMedium || 0,
      completedTasksLow: extendedStats.completedTasksLow || 0,
      totalMoodLogs: extendedStats.totalMoodLogs || 0,
      redeemedRewards: extendedStats.redeemedRewards || 0,
      engagement: isEngaged,
    };
  }, [userProfile, journalData, rewardsData, badgesData]);

  // Convert tasks to the expected format
  const tasks = useMemo(
    () =>
      tasksData.map((task) => ({
        id: task.id,
        title: task.title,
        priority: (task.priority || "medium") as "high" | "medium" | "low",
        completed: Boolean(task.completed),
        dueDate: task.dueDate ? new Date(task.dueDate).getTime() : Date.now(),
        frequency: (task.frequency || "once") as "once" | "daily" | "weekly" | "monthly",
        weekDays: task.weekDays as number[] | undefined,
        monthDays: task.monthDays as number[] | undefined,
      })),
    [tasksData]
  );

  // Convert journal entries to the expected format
  const journal = useMemo(
    () =>
      journalData.map((entry) => ({
        id: entry.id,
        timestamp: new Date(entry.createdAt).getTime(),
        emotion: (entry.mood || "neutral") as Mood,
        intensity: 5,
        thought: entry.content || "",
        aiAnalysis: entry.aiAnalysis || undefined,
      })),
    [journalData]
  );

  // Get current mood (most recent from journal)
  const currentMood: Mood = useMemo(() => {
    if (journal.length === 0) return "neutral";
    return journal[0]?.emotion || "neutral";
  }, [journal]);

  // Use BADGE_DEFINITIONS directly
  const allBadges = BADGE_DEFINITIONS;

  // Helper functions that use tRPC mutations
  const addXP = (amount: number) => {
    // XP is now managed by backend mutations
    console.log("XP awarded:", amount);
  };

  const addPoints = (amount: number) => {
    // Points/coins are now managed by backend mutations
    console.log("Points awarded:", amount);
  };

  const toggleTask = async (id: string) => {
    try {
      await utils.client.task.complete.mutate({ id });
      await utils.task.getAll.invalidate();
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const addTask = async (taskData: {
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    dueDate?: number;
    frequency?: "once" | "daily" | "weekly" | "monthly";
    weekDays?: number[];
    monthDays?: number[];
  }) => {
    try {
      await utils.client.task.create.mutate({
        title: taskData.title,
        description: taskData.description,
        category: "general",
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        frequency: taskData.frequency,
        weekDays: taskData.weekDays,
        monthDays: taskData.monthDays,
      });
      await utils.task.getAll.invalidate();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await utils.client.task.delete.mutate({ id });
      await utils.task.getAll.invalidate();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const addJournalEntry = async (entryData: {
    emotion: Mood;
    intensity: number;
    thought: string;
    aiAnalysis?: string;
  }) => {
    try {
      await utils.client.journal.create.mutate({
        content: entryData.thought,
        mood: entryData.emotion,
        aiAnalysis: entryData.aiAnalysis,
      });
      await utils.journal.getAll.invalidate();
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error creating journal entry:", error);
    }
  };

  const setMood = async (mood: string) => {
    try {
      await utils.client.user.trackMood.mutate({ mood });
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error tracking mood:", error);
    }
  };

  const completeMeditation = async (minutes: number) => {
    try {
      await utils.client.meditation.create.mutate({
        duration: minutes,
        type: "guided",
      });
      await utils.meditation.getHistory.invalidate();
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error completing meditation:", error);
    }
  };

  const updateAvatarConfig = async (config: AvatarConfig) => {
    try {
      await utils.client.user.updateAvatar.mutate({
        accessory: config.accessory,
        shirtColor: config.shirtColor,
      });
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const toggleTheme = async () => {
    try {
      // Get current user to toggle theme
      const user = await utils.client.user.getProfile.fetch();
      const newTheme = user.preferences?.theme === "light" ? "dark" : "light";
      await utils.client.user.updateTheme.mutate({ theme: newTheme });
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  };

  const addRewardRequest = async (title: string, category: string) => {
    try {
      await utils.client.reward.create.mutate({
        title,
        description: "",
        category,
        cost: 0,
      });
      await utils.reward.getAll.invalidate();
    } catch (error) {
      console.error("Error creating reward:", error);
    }
  };

  const redeemReward = async (id: string) => {
    try {
      await utils.client.reward.claim.mutate({ id });
      await utils.reward.getAll.invalidate();
      await utils.user.getProfile.invalidate();
    } catch (error) {
      console.error("Error redeeming reward:", error);
    }
  };

  const deleteReward = async (id: string) => {
    try {
      await utils.client.reward.delete.mutate({ id });
      await utils.reward.getAll.invalidate();
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  const updateReward = async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      cost?: number;
      status?: string;
    }
  ) => {
    try {
      await utils.client.reward.updateCost.mutate({
        rewardId: id,
        cost: updates.cost || 0,
      });
      await utils.reward.getAll.invalidate();
    } catch (error) {
      console.error("Error updating reward:", error);
    }
  };

  return (
    <GameContext.Provider
      value={{
        stats,
        tasks,
        journal,
        currentMood,
        allBadges,
        addXP,
        addPoints,
        toggleTask,
        addTask,
        deleteTask,
        addJournalEntry,
        setMood,
        completeMeditation,
        updateAvatarConfig,
        toggleTheme,
        addRewardRequest,
        redeemReward,
        deleteReward,
        updateReward,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
