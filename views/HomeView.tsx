"use client";

import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Heart,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COIN_REWARDS, XP_REWARDS } from "@/lib/xp";
import { Avatar } from "../components/Avatar";
import { RANKS, useGame } from "../context/GameContext";
import type { Mood } from "../types";

// Dynamically import Recharts components to avoid SSR issues
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export const HomeView: React.FC = () => {
  const router = useRouter();
  const { stats, currentMood, setMood, tasks } = useGame();
  const [isXPAvailable, setIsXPAvailable] = useState(false);
  const [xpFeedback, setXpFeedback] = useState<{
    id: number;
    amount: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  // Local state for immediate UI feedback
  const [selectedMood, setSelectedMood] = useState<Mood>(currentMood);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll detection
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollContainer.scrollTop > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync local mood with context mood
  useEffect(() => {
    setSelectedMood(currentMood);
  }, [currentMood]);

  useEffect(() => {
    const lastXP = stats.lastMoodXPTimestamp || 0;
    const COOLDOWN = 60 * 60 * 1000;

    const checkAvailability = () => {
      const now = Date.now();
      setIsXPAvailable(now - lastXP >= COOLDOWN);
    };

    checkAvailability();

    const interval = setInterval(checkAvailability, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, [stats.lastMoodXPTimestamp]);

  const handleMoodChange = (mood: Mood) => {
    // Update local state immediately for instant UI feedback
    setSelectedMood(mood);
    
    if (isXPAvailable) {
      setXpFeedback({ id: Date.now(), amount: 10 });
      setTimeout(() => setXpFeedback(null), 2000);
    }
    
    // Update backend asynchronously
    setMood(mood);
  };

  // Check for High Priority Tasks due Today
  const urgentTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(
      (t) =>
        t.priority === "high" &&
        !t.completed &&
        new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
    );
  }, [tasks]);

  // Determine current rank
  const currentRank = RANKS.find((r) => r.level === stats.level) || RANKS[0];

  // Mock data for the weekly chart
  const moodData = [
    { name: "Seg", score: 0 },
    { name: "Ter", score: 0 },
    { name: "Qua", score: 0 },
    { name: "Qui", score: 0 },
    { name: "Sex", score: 0 },
    { name: "Sáb", score: 0 },
    { name: "Dom", score: 0 },
  ];

  const moods: { id: Mood; label: string; emoji: string }[] = [
    { id: "happy", label: "Feliz", emoji: "😄" },
    { id: "calm", label: "Calmo", emoji: "😌" },
    { id: "neutral", label: "Neutro", emoji: "😐" },
    { id: "sad", label: "Triste", emoji: "😔" },
    { id: "anxious", label: "Ansioso", emoji: "😰" },
    { id: "angry", label: "Bravo", emoji: "😡" },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      {/* Floating XP Feedback Animation */}
      {xpFeedback && (
        <div
          className="-translate-x-1/2 -translate-y-1/2 fade-out slide-out-to-top-10 pointer-events-none fixed top-1/2 left-1/2 z-[100] flex transform animate-out flex-col items-center justify-center fill-mode-forwards duration-1000"
          key={xpFeedback.id}
        >
          <span
            className="stroke-white font-black text-5xl text-violet-600 drop-shadow-xl filter dark:text-violet-400"
            style={{ textShadow: "0 2px 10px rgba(139, 92, 246, 0.5)" }}
          >
            +{xpFeedback.amount} XP
          </span>
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 rounded-b-[2rem] bg-white shadow-sm dark:bg-slate-900">
        {/* Greeting - Hidden on scroll */}
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            isScrolled ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
          }`}
        >
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-2xl text-slate-800 tracking-tight dark:text-white">
                  Olá, {stats.name}
                </h2>
                <p className="font-medium text-slate-500 text-sm dark:text-slate-400">
                  Vamos cuidar de você hoje?
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl dark:border-slate-700 dark:bg-slate-800">
                👋
              </div>
            </div>
          </div>
        </div>

        {/* Rank/Stats Card - Becomes sticky */}
        <div className={`px-6 transition-all duration-300 ${
          isScrolled ? 'pb-4 pt-4' : 'pb-6'
        }`}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-violet-100">{stats.name}</p>
                <h2 className="font-bold text-2xl">{currentRank.name}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-violet-100">Nível {stats.level}</p>
                <p className="font-bold text-2xl">{stats.xp} XP</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${stats.xp % 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-violet-100">
              {100 - (stats.xp % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 pb-24">
        {/* Urgent Tasks Alert */}
        {urgentTasks.length > 0 && (
          <button
            className="slide-in-from-top-4 flex w-full animate-in items-center justify-between rounded-3xl border border-red-100 bg-red-50 p-4 shadow-sm dark:border-red-900/30 dark:bg-red-900/10"
            onClick={() => router.push("/routine")}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="animate-pulse rounded-2xl bg-red-100 p-2.5 text-red-500 dark:bg-red-900/40">
                <AlertCircle size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-red-700 text-sm dark:text-red-300">
                  Atenção Necessária
                </h3>
                <p className="font-medium text-red-600/80 text-xs dark:text-red-400/80">
                  Você tem {urgentTasks.length} tarefa
                  {urgentTasks.length > 1 ? "s" : ""} de alta prioridade hoje.
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <ArrowRight
                className="text-red-500 dark:text-red-400"
                size={16}
              />
            </div>
          </button>
        )}

        {/* Avatar Section */}
        <div className="flex justify-center py-2">
          <Avatar config={stats.avatarConfig} mood={selectedMood} size="lg" />
        </div>

        {/* Quick Mood Check-in */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800 text-sm dark:text-white">
            Como você se sente?
            {isXPAvailable && (
              <span className="animate-pulse rounded-full bg-violet-100 px-2 py-0.5 font-bold text-[10px] text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                +{XP_REWARDS.mood} XP
              </span>
            )}
          </h3>
          <div className="flex justify-between">
            {moods.map((m) => (
              <button
                className={`flex flex-col items-center gap-1 rounded-2xl p-2 transition-all duration-300 ${
                  selectedMood === m.id
                    ? "scale-110 bg-violet-50 shadow-sm ring-2 ring-violet-100 dark:bg-violet-900/20 dark:ring-violet-900/30"
                    : "hover:scale-105 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                key={m.id}
                onClick={() => handleMoodChange(m.id)}
                type="button"
              >
                <span className="text-3xl drop-shadow-sm filter">
                  {m.emoji}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            className="group flex flex-col items-start gap-3 rounded-3xl bg-violet-600 p-5 text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 active:scale-[0.98] dark:shadow-none"
            onClick={() => router.push("/journal")}
            type="button"
          >
            <div className="rounded-2xl bg-white/20 p-2.5 transition-transform group-hover:scale-110">
              <BookOpen size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm leading-tight">
                Diário de
                <br />
                Pensamento
              </div>
              <div className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 font-bold text-[10px] opacity-70">
                +{XP_REWARDS.journal} XP & Pts
              </div>
            </div>
          </button>

          <button
            className="group flex flex-col items-start gap-3 rounded-3xl border border-slate-100 bg-white p-5 text-slate-800 shadow-sm transition-all hover:border-teal-200 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-teal-900/50"
            onClick={() => router.push("/meditation")}
            type="button"
          >
            <div className="rounded-2xl bg-teal-50 p-2.5 text-teal-600 transition-transform group-hover:scale-110 dark:bg-teal-900/20 dark:text-teal-400">
              <Heart size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm leading-tight">
                Meditação
                <br />
                Rápida
              </div>
              <div className="mt-1 inline-block rounded-full bg-slate-50 px-2 py-0.5 font-bold text-[10px] text-slate-400 dark:bg-slate-800">
                +{XP_REWARDS.meditation} XP & Pts
              </div>
            </div>
          </button>
        </div>

        {/* Weekly Mood Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
              <BarChart2 size={18} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              Humor Semanal
            </h3>
          </div>
          {isMounted && (
            <div className="h-40 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={moodData}>
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    dy={10}
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "#fff",
                      padding: "12px",
                    }}
                    cursor={{ fill: "#f8fafc", opacity: 0.5 }}
                    labelStyle={{
                      color: "#1e293b",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  />
                  <Bar
                    barSize={24}
                    dataKey="score"
                    fill="#8b5cf6"
                    radius={[6, 6, 6, 6]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
