"use client";

import { Calendar, Gift, Home, Plus, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItemClass = (path: string) => `
    relative flex flex-col items-center justify-center w-full h-full space-y-1
    ${
      isActive(path)
        ? "text-violet-600 dark:text-violet-400"
        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
    }
    transition-all duration-300 group
  `;

  const activeIndicator = (
    <span className="-top-3 fade-in zoom-in absolute h-1 w-8 animate-in rounded-b-full bg-violet-600 shadow-[0_2px_8px_rgba(139,92,246,0.5)] duration-300 dark:bg-violet-400 dark:shadow-[0_2px_8px_rgba(167,139,250,0.3)]" />
  );

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto h-[5.5rem] max-w-md rounded-t-[2rem] border-slate-100 border-t bg-white/90 px-6 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="relative flex h-full items-center justify-between">
        <button
          className={navItemClass("/home")}
          onClick={() => router.push("/home")}
          type="button"
        >
          {isActive("/home") && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${
              isActive("/home") ? "bg-violet-50 dark:bg-violet-900/20" : ""
            }`}
          >
            <Home
              className="transition-transform duration-300 group-active:scale-90"
              size={24}
              strokeWidth={isActive("/home") ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${
              isActive("/home")
                ? "translate-y-0 opacity-100"
                : "hidden translate-y-2 opacity-0"
            }`}
          >
            Início
          </span>
        </button>

        <button
          className={navItemClass("/routine")}
          onClick={() => router.push("/routine")}
          type="button"
        >
          {isActive("/routine") && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${
              isActive("/routine") ? "bg-violet-50 dark:bg-violet-900/20" : ""
            }`}
          >
            <Calendar
              className="transition-transform duration-300 group-active:scale-90"
              size={24}
              strokeWidth={isActive("/routine") ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${
              isActive("/routine")
                ? "translate-y-0 opacity-100"
                : "hidden translate-y-2 opacity-0"
            }`}
          >
            Rotina
          </span>
        </button>

        {/* Central Floating Action Button */}
        <div className="-top-8 group relative">
          <div className="absolute inset-0 rounded-full bg-violet-600 opacity-40 blur-lg transition-opacity duration-300 group-hover:opacity-60" />
          <button
            className="hover:-translate-y-1 relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-violet-300/50 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:border-slate-900 dark:shadow-none"
            onClick={() => router.push("/journal")}
            type="button"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>

        <button
          className={navItemClass("/rewards")}
          onClick={() => router.push("/rewards")}
          type="button"
        >
          {isActive("/rewards") && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${
              isActive("/rewards") ? "bg-violet-50 dark:bg-violet-900/20" : ""
            }`}
          >
            <Gift
              className="transition-transform duration-300 group-active:scale-90"
              size={24}
              strokeWidth={isActive("/rewards") ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${
              isActive("/rewards")
                ? "translate-y-0 opacity-100"
                : "hidden translate-y-2 opacity-0"
            }`}
          >
            Prêmios
          </span>
        </button>

        <button
          className={navItemClass("/profile")}
          onClick={() => router.push("/profile")}
          type="button"
        >
          {isActive("/profile") && activeIndicator}
          <div
            className={`rounded-xl p-2 transition-all duration-300 ${
              isActive("/profile") ? "bg-violet-50 dark:bg-violet-900/20" : ""
            }`}
          >
            <User
              className="transition-transform duration-300 group-active:scale-90"
              size={24}
              strokeWidth={isActive("/profile") ? 2.5 : 2}
            />
          </div>
          <span
            className={`font-bold text-[10px] transition-all duration-300 ${
              isActive("/profile")
                ? "translate-y-0 opacity-100"
                : "hidden translate-y-2 opacity-0"
            }`}
          >
            Perfil
          </span>
        </button>
      </div>
    </div>
  );
};
