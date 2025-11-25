"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { GameProvider } from "@/context/GameContext";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Usuários", icon: "👥" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      // Limpar o cookie de role via API
      await fetch("/api/auth/clear-role-cookie", { method: "POST" });
      router.push("/auth/signin");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <GameProvider>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-900/95 backdrop-blur">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
                  <span className="text-lg">🛡️</span>
                </div>
                <span className="font-bold text-white">Admin Panel</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                      href={item.href}
                      key={item.href}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-slate-700 p-4">
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  <span>🚪</span>
                  Sair
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="ml-64 flex-1 p-8">{children}</main>
        </div>
      </RoleGuard>
    </GameProvider>
  );
}
