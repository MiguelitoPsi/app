"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { THERAPIST_RANKS } from "@/lib/constants/therapist";
import { trpc } from "@/lib/trpc/client";

/* ============================================
 * TYPES
 * ============================================ */

export type TherapistRank = (typeof THERAPIST_RANKS)[number];

export type TherapistXPGain = {
  id: string;
  amount: number;
  action: string;
  timestamp: number;
};

export type TherapistGameStats = {
  name: string;
  level: number;
  experience: number;
  currentStreak: number;
  longestStreak: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  rank: TherapistRank;
  nextRank: TherapistRank | null;
};

export type WeeklyChallengeProgress = {
  id: string;
  title: string;
  currentCount: number;
  targetCount: number;
  progress: number;
  status: "active" | "completed" | "expired";
};

export type TherapistGameContextType = {
  stats: TherapistGameStats;
  challenges: WeeklyChallengeProgress[];
  isLoading: boolean;
  levelUp: { triggered: boolean; newLevel: number };
  xpGains: TherapistXPGain[];
  theme: "light" | "dark";
  refreshStats: () => Promise<void>;
  addXPGain: (amount: number, action: string) => void;
  clearLevelUp: () => void;
  toggleTheme: () => Promise<void>;
};

const defaultStats: TherapistGameStats = {
  name: "",
  level: 1,
  experience: 0,
  currentStreak: 0,
  longestStreak: 0,
  xpForCurrentLevel: 0,
  xpForNextLevel: 150,
  xpInCurrentLevel: 0,
  xpToNextLevel: 150,
  progressPercent: 0,
  rank: THERAPIST_RANKS[0],
  nextRank: THERAPIST_RANKS[1] || null,
};

const TherapistGameContext = createContext<
  TherapistGameContextType | undefined
>(undefined);

/* ============================================
 * PROVIDER
 * ============================================ */

export const TherapistGameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const utils = trpc.useUtils();
  const updateThemeMutation = trpc.user.updateTheme.useMutation();

  // Theme state - initialize from document or localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check if dark class is on document (SSR fallback)
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }
    return "dark"; // Default to dark for therapist
  });

  // Fetch therapist stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = trpc.therapistXp.getStats.useQuery(undefined, {
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
  });

  // Fetch user profile for name and theme
  const { data: userProfile, isLoading: isLoadingProfile } =
    trpc.user.getProfile.useQuery(undefined, {
      staleTime: 2 * 60 * 1000, // 2 minutes
    });

  // Initialize theme from user profile
  useEffect(() => {
    if (userProfile?.preferences) {
      const savedTheme = (userProfile.preferences as Record<string, unknown>)
        ?.theme as "light" | "dark" | undefined;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [userProfile]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Fetch weekly challenges
  const { data: challengesData } =
    trpc.therapistChallenges.getCurrentWeek.useQuery(undefined, {
      staleTime: 60 * 1000, // 1 minute
    });

  // State for level up detection
  const [levelUp, setLevelUp] = useState<{
    triggered: boolean;
    newLevel: number;
  }>({
    triggered: false,
    newLevel: 0,
  });
  const previousLevelRef = useRef<number | null>(null);

  // State for XP gain notifications
  const [xpGains, setXpGains] = useState<TherapistXPGain[]>([]);

  // Detect level up
  useEffect(() => {
    if (!statsData) return;

    const currentLevel = statsData.xpInfo.currentLevel;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > previousLevelRef.current) {
      setLevelUp({ triggered: true, newLevel: currentLevel });
      previousLevelRef.current = currentLevel;
    }
  }, [statsData]);

  // Build stats object
  const stats: TherapistGameStats = useMemo(() => {
    if (!statsData) return { ...defaultStats, name: userProfile?.name || "" };

    const rank = statsData.rank || THERAPIST_RANKS[0];
    const nextRank = statsData.nextRank || null;

    return {
      name: userProfile?.name || "",
      level: statsData.xpInfo.currentLevel,
      experience: statsData.xpInfo.currentXP,
      currentStreak: statsData.xpInfo.currentStreak,
      longestStreak: statsData.xpInfo.longestStreak,
      xpForCurrentLevel: statsData.xpInfo.xpForCurrentLevel,
      xpForNextLevel: statsData.xpInfo.xpForNextLevel,
      xpInCurrentLevel: statsData.xpInfo.xpInCurrentLevel,
      xpToNextLevel: statsData.xpInfo.xpToNextLevel,
      progressPercent: statsData.xpInfo.progressPercent,
      rank,
      nextRank,
    };
  }, [statsData, userProfile?.name]);

  // Build challenges array
  const challenges: WeeklyChallengeProgress[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((c) => ({
      id: c.id,
      title: c.title,
      currentCount: c.currentCount,
      targetCount: c.targetCount,
      progress: c.progress,
      status: c.status as "active" | "completed" | "expired",
    }));
  }, [challengesData]);

  // Refresh stats function
  const refreshStats = useCallback(async () => {
    await utils.therapistXp.getStats.invalidate();
    await utils.therapistChallenges.getCurrentWeek.invalidate();
    await refetchStats();
  }, [utils, refetchStats]);

  // Add XP gain notification
  const addXPGain = useCallback((amount: number, action: string) => {
    const gain: TherapistXPGain = {
      id: `${Date.now()}-${Math.random()}`,
      amount,
      action,
      timestamp: Date.now(),
    };

    setXpGains((prev) => [...prev, gain]);

    // Auto-remove after animation (3 seconds)
    setTimeout(() => {
      setXpGains((prev) => prev.filter((g) => g.id !== gain.id));
    }, 3000);
  }, []);

  // Clear level up trigger
  const clearLevelUp = useCallback(() => {
    setLevelUp({ triggered: false, newLevel: 0 });
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    await updateThemeMutation.mutateAsync({ theme: newTheme });
    utils.user.getProfile.invalidate();
  }, [theme, updateThemeMutation, utils]);

  const value: TherapistGameContextType = {
    stats,
    challenges,
    isLoading: isLoadingStats || isLoadingProfile,
    levelUp,
    xpGains,
    theme,
    refreshStats,
    addXPGain,
    clearLevelUp,
    toggleTheme,
  };

  return (
    <TherapistGameContext.Provider value={value}>
      {children}
    </TherapistGameContext.Provider>
  );
};

/* ============================================
 * HOOK
 * ============================================ */

export function useTherapistGame(): TherapistGameContextType {
  const context = useContext(TherapistGameContext);
  if (context === undefined) {
    throw new Error(
      "useTherapistGame must be used within a TherapistGameProvider"
    );
  }
  return context;
}
