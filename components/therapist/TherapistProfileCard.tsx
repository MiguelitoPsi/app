"use client";

import { CheckCircle2, FileText, Flame, TrendingUp, Users } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { Avatar } from "@/components/Avatar";
import { useTherapistGame } from "@/context/TherapistGameContext";
import { trpc } from "@/lib/trpc/client";

export const TherapistProfileCard: React.FC = memo(
  function TherapistProfileCardComponent() {
    const { stats, isLoading: isLoadingGame } = useTherapistGame();

    const { data: statsData, isLoading: isLoadingStats } =
      trpc.therapistXp.getStats.useQuery(undefined, {
        staleTime: 2 * 60 * 1000,
      });

    const isLoading = isLoadingGame || isLoadingStats;

    if (isLoading) {
      return (
        <div className="flex h-full flex-col">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="mx-auto h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mx-auto h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      );
    }

    const therapistStats = statsData?.stats;

    return (
      <div className="flex h-full flex-col">
        {/* Header com fundo decorativo */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-violet-500 to-purple-600 px-6 pb-12 pt-6">
          {/* Decoração de fundo */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative text-center">
            <p className="text-sm font-medium text-white/80">
              Seu guia de bem-estar
            </p>
          </div>
        </div>

        {/* Avatar sobreposto */}
        <div className="relative -mt-10 px-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-100 to-purple-100 shadow-lg dark:border-slate-800 dark:from-violet-900/50 dark:to-purple-900/50">
            <Avatar mood="happy" size="lg" />
          </div>
        </div>

        {/* Info do terapeuta */}
        <div className="px-6 pt-3 text-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {stats.name || "Terapeuta"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {stats.rank?.name || "Terapeuta"}
          </p>
        </div>

        {/* XP Progress */}
        <div className="px-6 pt-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
                  {stats.level}
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nível {stats.level}
                </span>
              </div>
              {stats.currentStreak >= 3 && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Flame className="h-3 w-3" />
                  {stats.currentStreak} dias
                </span>
              )}
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{stats.experience} XP</span>
                <span>
                  {stats.xpToNextLevel} para nível {stats.level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 px-6 pt-4">
          <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Pacientes
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {therapistStats?.totalPatientsManaged || 0}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Sessões
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">
              {therapistStats?.totalSessionsCompleted || 0}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Relatórios
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
              {therapistStats?.totalReportsViewed || 0}
            </p>
          </div>

          <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs text-rose-600 dark:text-rose-400">
                Streak
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-300">
              {stats.currentStreak || 0}
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    );
  }
);
