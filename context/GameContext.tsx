"use client";

import type React from "react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import type { AvatarConfig, GameContextType, Mood, UserStats } from "../types";

const GameContext = createContext<GameContextType | undefined>(undefined);

export const RANKS = [
  { level: 1, name: "Iniciante", xpRequired: 0 },
  { level: 2, name: "Aprendiz", xpRequired: 100 },
  { level: 3, name: "Explorador", xpRequired: 250 },
  { level: 4, name: "Aventureiro", xpRequired: 500 },
  { level: 5, name: "Veterano", xpRequired: 1000 },
  { level: 6, name: "Mestre", xpRequired: 2000 },
  { level: 7, name: "Lenda", xpRequired: 5000 },
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

  // Convert user profile to UserStats format
  const stats: UserStats = useMemo(() => {
    if (!userProfile) {
      return {
        name: "",
        xp: 0,
        level: 1,
        points: 0,
        streak: 0,
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
      };
    }

    const avatarConfig = (
      userProfile.preferences as Record<string, unknown> | null
    )?.avatar_config as AvatarConfig | undefined;
    const theme = (userProfile.preferences as Record<string, unknown> | null)
      ?.theme as "light" | "dark" | undefined;

    return {
      name: userProfile.name || "",
      xp: userProfile.experience || 0,
      level: userProfile.level || 1,
      points: userProfile.coins || 0,
      streak: userProfile.streak || 0,
      badges: [], // Will be populated from badgesData
      avatarConfig: avatarConfig || {
        accessory: "none",
        shirtColor: "bg-blue-500",
      },
      theme: theme || "light",
      totalMeditationMinutes: 0,
      dailyMeditationCount: 0,
      lastMeditationDate: userProfile.lastMoodXpDate
        ? new Date(userProfile.lastMoodXpDate).getTime()
        : 0,
      totalTasksCompleted: 0,
      totalJournals: journalData.length,
      tutorialCompleted: true,
      lastMoodXPTimestamp: userProfile.lastMoodXpDate
        ? new Date(userProfile.lastMoodXpDate).getTime()
        : undefined,
      rewards: [],
    };
  }, [userProfile, journalData]);

  // Convert tasks to the expected format
  const tasks = useMemo(
    () =>
      tasksData.map((task) => ({
        id: task.id,
        title: task.title,
        priority: (task.priority || "medium") as "high" | "medium" | "low",
        completed: Boolean(task.completed),
        dueDate: task.dueDate ? new Date(task.dueDate).getTime() : Date.now(),
        frequency: undefined,
        weekDays: undefined,
        monthDays: undefined,
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

  // Convert badges to the expected format
  const allBadges = useMemo(
    () =>
      badgesData.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon || "🏆",
        requirement: 1,
        metric: "auto" as const,
      })),
    [badgesData]
  );

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

  const addRewardRequest = async (title: string, _category: string) => {
    try {
      await utils.client.reward.create.mutate({
        title,
        description: "",
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
