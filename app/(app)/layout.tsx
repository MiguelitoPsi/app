"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import LevelUpManager from "@/components/LevelUpManager";
import { GameProvider } from "@/context/GameContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <LevelUpManager />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-colors duration-300 dark:from-slate-900 dark:to-slate-800">
        <main className="mx-auto flex h-screen max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950">
          {children}
          <BottomNav />
        </main>
      </div>
    </GameProvider>
  );
}
