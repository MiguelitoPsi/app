"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
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
  const { stats, isLoading } = useTherapistGame();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <header className="relative z-10 pt-safe">
        <div className="px-4 pb-4 pt-4 sm:px-6">
          <div className="animate-pulse rounded-xl bg-slate-200 p-4 sm:rounded-2xl sm:p-6 dark:bg-slate-700/50">
            <div className="h-20 rounded bg-slate-300 dark:bg-slate-600/50" />
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
        </section>
      </div>
    </header>
  );
}

export default TherapistHeader;
