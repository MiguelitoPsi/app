"use client";

import { Flame, Target, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTherapistGame } from "@/context/TherapistGameContext";

/**
 * TherapistHeader - Header de XP e gamificação para terapeutas
 *
 * Exibe:
 * - Nome e rank atual do terapeuta
 * - Nível e XP total
 * - Barra de progresso para próximo nível
 * - Mini-badge de desafio semanal ativo
 * - Streak de dias consecutivos
 */
export function TherapistHeader() {
  const { stats, challenges, isLoading } = useTherapistGame();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find active challenge with most progress
  const activeChallenge = useMemo(() => {
    const active = challenges.filter((c) => c.status === "active");
    if (active.length === 0) return null;

    // Return the one with highest progress
    return active.reduce((prev, curr) =>
      curr.progress > prev.progress ? curr : prev
    );
  }, [challenges]);

  // Count completed challenges this week
  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.status === "completed").length,
    [challenges]
  );

  if (isLoading) {
    return (
      <header className="relative z-10 pt-safe">
        <div className="px-4 pb-4 pt-4 sm:px-6">
          <div className="animate-pulse rounded-xl bg-slate-700/50 p-4 sm:rounded-2xl sm:p-6">
            <div className="h-20 rounded bg-slate-600/50" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-10 pt-safe">
      <div
        className={`px-4 transition-all duration-300 sm:px-6 ${
          isScrolled ? "pb-3 pt-3 sm:pb-4 sm:pt-4" : "pb-4 pt-4 sm:pb-6"
        }`}
      >
        <section
          aria-label="Seu progresso profissional"
          className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6"
        >
          {/* Main Stats Row */}
          <div className="mb-3 flex items-start justify-between sm:mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-emerald-100 sm:text-sm">
                {stats.name || "Terapeuta"}
              </p>
              <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                {stats.rank?.name || "Terapeuta Iniciante"}
                {stats.currentStreak >= 3 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium"
                    title={`${stats.currentStreak} dias consecutivos`}
                  >
                    <Flame
                      aria-hidden="true"
                      className="h-3 w-3 text-orange-300"
                    />
                    {stats.currentStreak}
                  </span>
                )}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-100 sm:text-sm">
                Nível {stats.level}
              </p>
              <p className="text-xl font-bold sm:text-2xl">
                {stats.experience} XP
                <span className="sr-only"> pontos de experiência</span>
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div
            aria-label="Progresso para o próximo nível"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(stats.progressPercent)}
            className="h-2.5 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm sm:h-3"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-emerald-100">
            {stats.xpToNextLevel} XP para o próximo nível
          </p>

          {/* Weekly Challenge Mini-Badge */}
          {(activeChallenge || completedChallenges > 0) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
              {activeChallenge ? (
                <>
                  <Target
                    aria-hidden="true"
                    className="h-4 w-4 flex-shrink-0 text-yellow-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">
                      {activeChallenge.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${activeChallenge.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-emerald-100">
                        {activeChallenge.currentCount}/
                        {activeChallenge.targetCount}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Trophy
                    aria-hidden="true"
                    className="h-4 w-4 flex-shrink-0 text-yellow-300"
                  />
                  <p className="text-xs font-medium text-white">
                    {completedChallenges} desafio
                    {completedChallenges !== 1 ? "s" : ""} completado
                    {completedChallenges !== 1 ? "s" : ""} esta semana!
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </header>
  );
}

export default TherapistHeader;
