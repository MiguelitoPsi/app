"use client";

import { Flame } from "lucide-react";
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-48 border-r border-slate-700 bg-slate-900/95 backdrop-blur lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-12 items-center gap-2 border-b border-slate-700 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
              <span className="text-sm">🧠</span>
            </div>
            <span className="text-sm font-bold text-white">Terapeuta</span>
          </div>

          {/* XP Mini Header */}
          <div className="border-b border-slate-700 p-3">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="mb-2 h-4 w-24 rounded bg-slate-700" />
                <div className="h-2 w-full rounded bg-slate-700" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {stats.rank?.name || "Terapeuta"}
                    </p>
                    <p className="text-xs font-bold text-white">
                      Nível {stats.level}
                    </p>
                  </div>
                  {stats.currentStreak >= 3 && (
                    <span
                      className="flex items-center gap-0.5 rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-medium text-orange-400"
                      title={`${stats.currentStreak} dias consecutivos`}
                    >
                      <Flame className="h-3 w-3" />
                      {stats.currentStreak}
                    </span>
                  )}
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                    <span>{stats.experience} XP</span>
                    <span>{stats.xpToNextLevel} para subir</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  href={item.path}
                  key={item.path}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700 p-2">
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              onClick={handleLogout}
              type="button"
            >
              <span className="text-sm">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>
    );
  }
);
