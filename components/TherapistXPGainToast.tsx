"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTherapistGame } from "@/context/TherapistGameContext";

/**
 * TherapistXPGainToast - Toast flutuante de XP ganho
 *
 * Exibe notificações animadas quando o terapeuta ganha XP,
 * proporcionando feedback visual dopaminérgico imediato.
 */
export function TherapistXPGainToast() {
  const { xpGains } = useTherapistGame();

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {xpGains.map((gain) => (
          <motion.div
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-white shadow-lg shadow-emerald-500/30"
            exit={{
              opacity: 0,
              x: 50,
              scale: 0.8,
              transition: { duration: 0.2 },
            }}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            key={gain.id}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="font-bold">+{gain.amount} XP</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default TherapistXPGainToast;
