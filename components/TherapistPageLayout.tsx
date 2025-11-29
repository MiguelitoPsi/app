"use client";

import type { LucideIcon } from "lucide-react";
import type React from "react";

type TherapistPageLayoutProps = {
  children: React.ReactNode;
  /**
   * Se true, remove todo o padding do container (útil para pages com header próprio)
   */
  noPadding?: boolean;
  /**
   * Classes CSS adicionais para o container
   */
  className?: string;
};

type TherapistPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /**
   * Classes de gradiente Tailwind (ex: "from-violet-600 to-purple-700")
   */
  gradient?: string;
  /**
   * Conteúdo adicional à direita do título
   */
  rightContent?: React.ReactNode;
  /**
   * Seção de estatísticas abaixo do título
   */
  statsSection?: React.ReactNode;
  /**
   * Conteúdo extra abaixo das stats (ex: seletor de paciente)
   */
  extraContent?: React.ReactNode;
};

/**
 * TherapistPageLayout - Layout padronizado para páginas do terapeuta
 *
 * Este componente fornece um container consistente para todas as páginas
 * do terapeuta, com padding responsivo e overflow apropriado.
 *
 * O header (TherapistHeader) e sidebar (TherapistSidebar) já são fornecidos
 * pelo layout pai em app/(specialist)/layout.tsx
 *
 * Padrões de padding:
 * - Mobile: px-4 py-6 pb-28 (pb para dar espaço ao BottomNav)
 * - Tablet: px-6 py-8 pb-32
 * - Desktop: px-8 py-6 pb-8 (sem BottomNav)
 *
 * Exemplo de uso simples:
 * ```tsx
 * <TherapistPageLayout>
 *   <h1>Título da Página</h1>
 *   <p>Conteúdo...</p>
 * </TherapistPageLayout>
 * ```
 *
 * Exemplo com header customizado (dentro do children):
 * ```tsx
 * <TherapistPageLayout noPadding>
 *   <TherapistPageHeader
 *     title="Dashboard"
 *     subtitle="Bem-vindo"
 *     gradient="from-violet-600 to-purple-700"
 *   />
 *   <div className="p-4">conteúdo...</div>
 * </TherapistPageLayout>
 * ```
 */
export function TherapistPageLayout({
  children,
  noPadding = false,
  className = "",
}: TherapistPageLayoutProps) {
  return (
    <div
      className={`h-full overflow-y-auto ${
        noPadding
          ? ""
          : "px-4 py-6 pb-28 pt-safe sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * TherapistPageHeader - Header colorido com gradiente para páginas do terapeuta
 *
 * Pode ser usado dentro de TherapistPageLayout com noPadding=true
 *
 * Exemplo:
 * ```tsx
 * <TherapistPageHeader
 *   title="Relatórios"
 *   subtitle="Documentos e planos"
 *   icon={FileText}
 *   gradient="from-violet-600 to-purple-700"
 *   rightContent={<button>...</button>}
 * />
 * ```
 */
export function TherapistPageHeader({
  title,
  subtitle,
  icon: Icon,
  gradient = "from-violet-600 to-purple-700",
  rightContent,
  statsSection,
  extraContent,
}: TherapistPageHeaderProps) {
  return (
    <header
      className={`relative z-10 bg-gradient-to-br ${gradient} pt-safe text-white`}
    >
      <div className="mx-auto max-w-7xl px-3 pb-3 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {Icon && (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </div>
            )}
            <div className="min-w-0">
              {subtitle && (
                <p className="text-xs text-white/80 sm:text-sm lg:text-base">
                  {subtitle}
                </p>
              )}
              <h1 className="truncate font-bold text-lg sm:text-xl lg:text-2xl">
                {title}
              </h1>
            </div>
          </div>
          {rightContent && (
            <div className="flex flex-shrink-0 items-center gap-2">
              {rightContent}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section - opcional */}
      {statsSection && (
        <div className="mx-auto max-w-7xl px-3 pb-3 sm:px-6 sm:pb-4 lg:px-8">
          {statsSection}
        </div>
      )}

      {/* Extra Content - opcional (ex: seletor de paciente) */}
      {extraContent && (
        <div className="mx-auto max-w-7xl px-3 pb-3 sm:px-6 sm:pb-4 lg:px-8">
          {extraContent}
        </div>
      )}
    </header>
  );
}

/**
 * TherapistPageContent - Container de conteúdo para usar com TherapistPageHeader
 *
 * Deve ser usado junto com TherapistPageLayout noPadding + TherapistPageHeader
 */
export function TherapistPageContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`flex-1 px-3 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32 lg:px-8 lg:pb-8 ${className}`}
    >
      {children}
    </main>
  );
}

export default TherapistPageLayout;
