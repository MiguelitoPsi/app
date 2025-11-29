"use client";

import { Flame, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { memo } from "react";
import { useTherapistGame } from "@/context/TherapistGameContext";
import { authClient } from "@/lib/auth-client";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/therapist-routine", label: "Rotina", icon: "📅" },
  { path: "/reports", label: "Relatórios", icon: "📈" },
  { path: "/financial", label: "Financeiro", icon: "💰" },
  { path: "/achievements", label: "Conquistas", icon: "🏆" },
] as const;

export const TherapistSidebar: React.FC = memo(
  function TherapistSidebarComponent() {
    const pathname = usePathname();
    const router = useRouter();
    const { stats, isLoading } = useTherapistGame();

    const handleLogout = async () => {
      try {
        await authClient.signOut();
        // Limpar o cookie de role via API
        await fetch("/api/auth/clear-role-cookie", { method: "POST" });
        router.push("/auth/signin");
        router.refresh();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    };

    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-slate-200 bg-white/95 backdrop-blur transition-colors duration-300 lg:block dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-slate-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <span className="text-base">🧠</span>
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-white">
              Nepsis
            </span>
          </div>

          {/* XP Mini Header */}
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="mb-2 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                      {stats.rank?.name || "Terapeuta"}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      Nível {stats.level}
                    </p>
                  </div>
                  {stats.currentStreak >= 3 && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400"
                      title={`${stats.currentStreak} dias consecutivos`}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      {stats.currentStreak}
                    </span>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{stats.experience} XP</span>
                    <span>{stats.xpToNextLevel} para subir</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                  href={item.path}
                  key={item.path}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Card promocional */}
          <div className="p-3">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-4 dark:from-violet-900/20 dark:to-purple-900/20">
              {/* Decoração */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-200/50 dark:bg-violet-700/20" />
              <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-purple-200/50 dark:bg-purple-700/20" />

              <div className="relative">
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Dica do dia
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Complete suas tarefas para ganhar XP e subir de nível!
                </p>
              </div>

              {/* Mascote */}
              <div className="mt-3 flex justify-center">
                <Image
                  alt="Mascote meditando"
                  className="h-16 w-16 object-contain opacity-80"
                  height={64}
                  src="/mascote/meditando.png"
                  width={64}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-3 dark:border-slate-700">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={handleLogout}
              type="button"
            >
              <span className="text-base">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>
    );
  }
);
