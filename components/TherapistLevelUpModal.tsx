"use client";

import { Award, Crown, Sparkles, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TherapistRankDefinition } from "@/lib/constants/therapist";

type TherapistLevelUpModalProps = {
  newLevel: number;
  rank: TherapistRankDefinition;
  onClose: () => void;
};

/**
 * TherapistLevelUpModal - Modal celebratório de level up para terapeutas
 *
 * Exibe:
 * - Animação de celebração
 * - Novo nível alcançado
 * - Novo rank com ícone
 * - Benefícios desbloqueados
 */
export function TherapistLevelUpModal({
  newLevel,
  rank,
  onClose,
}: TherapistLevelUpModalProps) {
  const [show, setShow] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for exit animation
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    setShow(true);
    // Focus the close button when modal opens
    setTimeout(() => closeButtonRef.current?.focus(), 100);

    // Add escape key listener
    document.addEventListener("keydown", handleKeyDown);

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  if (!(show || newLevel)) return null;

  return (
    <div
      aria-describedby="therapist-levelup-description"
      aria-labelledby="therapist-levelup-title"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-500 ${
          show ? "translate-y-0 scale-100" : "translate-y-4 scale-90"
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 p-8 text-center shadow-2xl shadow-emerald-500/20">
          {/* Background Effects */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -left-24 -top-24 h-48 w-48 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-24 h-48 w-48 animate-pulse rounded-full bg-teal-500/20 blur-3xl"
          />

          {/* Icon */}
          <div className="relative mb-6 inline-block">
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-emerald-500 opacity-50 blur-xl"
            />
            <div className="animate-float relative rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-4 shadow-lg">
              <Crown aria-hidden="true" className="h-12 w-12 text-white" />
            </div>
            <div aria-hidden="true" className="absolute -right-2 -top-2">
              <Sparkles className="h-6 w-6 animate-bounce text-emerald-200" />
            </div>
            <div aria-hidden="true" className="absolute -bottom-2 -left-2">
              <Star className="animate-spin-slow h-6 w-6 text-teal-200" />
            </div>
          </div>

          {/* Text */}
          <h2
            className="animate-scale-up mb-2 text-3xl font-bold text-white"
            id="therapist-levelup-title"
          >
            Level Up!
          </h2>
          <p className="mb-4 text-slate-300" id="therapist-levelup-description">
            Você alcançou o nível{" "}
            <span className="text-xl font-bold text-emerald-400">
              {newLevel}
            </span>
          </p>

          {/* New Rank Badge */}
          <div className="mb-6 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 p-4">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span aria-label={rank.name} className="text-3xl" role="img">
                {rank.icon}
              </span>
              <h3 className="text-xl font-bold text-emerald-300">
                {rank.name}
              </h3>
            </div>
            <p className="mb-3 text-sm text-slate-400">{rank.description}</p>

            {/* Benefits */}
            {rank.benefits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Benefícios desbloqueados
                </p>
                <ul className="space-y-1">
                  {rank.benefits.map((benefit, index) => (
                    <li
                      className="flex items-center justify-center gap-2 text-sm text-white"
                      key={index}
                    >
                      <Award
                        aria-hidden="true"
                        className="h-4 w-4 text-emerald-400"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Level Progress */}
          <div
            aria-hidden="true"
            className="mb-8 flex items-center justify-center gap-4"
          >
            <div className="text-sm font-medium text-slate-500">
              Nível {newLevel - 1}
            </div>
            <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-700">
              <div className="animate-shine h-full w-full bg-emerald-500" />
            </div>
            <div className="text-lg font-bold text-emerald-400">
              Nível {newLevel}
            </div>
          </div>

          {/* Button */}
          <button
            className="w-full transform rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:from-emerald-400 hover:to-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
            onClick={handleClose}
            ref={closeButtonRef}
            type="button"
          >
            Continuar Evoluindo
          </button>
        </div>
      </div>
    </div>
  );
}

export default TherapistLevelUpModal;
