"use client";

import { motion } from "framer-motion";
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiGamepadLine,
  RiHeartPulseLine,
  RiMoonLine,
  RiGroupLine,
  RiCupLine,
  RiShoppingBagLine,
  RiFilmLine,
  RiRunLine,
  RiPaletteLine,
  RiLeafLine,
} from "@remixicon/react";
import type React from "react";
import { useState } from "react";
import { useSound } from "@/hooks/useSound";
import { useGame } from "@/context/GameContext";
import type { RewardCategory } from "@/types";

const PRIMARY = "#a1c797";

const ENTER_TRANSITION = {
  type: "spring" as const,
  damping: 28,
  stiffness: 280,
  mass: 0.9,
};

const EXIT_TRANSITION_FAST = { duration: 0.28, ease: [0.4, 0, 1, 1] as const };
const EXIT_TRANSITION_CARD = { duration: 0.5, ease: [0.4, 0, 1, 1] as const };

const categories: {
  id: RewardCategory;
  label: string;
  hsl: string;
  icon: React.ElementType;
}[] = [
  { id: "lazer", label: "Lazer", hsl: "hsl(200 40% 69%)", icon: RiGamepadLine },
  {
    id: "autocuidado",
    label: "Autocuidado",
    hsl: "hsl(330 40% 69%)",
    icon: RiHeartPulseLine,
  },
  {
    id: "descanso",
    label: "Descanso",
    hsl: "hsl(230 40% 69%)",
    icon: RiMoonLine,
  },
  { id: "social", label: "Social", hsl: "hsl(160 40% 69%)", icon: RiGroupLine },
  {
    id: "alimentacao",
    label: "Alimentação",
    hsl: "hsl(30 40% 69%)",
    icon: RiCupLine,
  },
  {
    id: "compras",
    label: "Compras",
    hsl: "hsl(290 40% 69%)",
    icon: RiShoppingBagLine,
  },
];

interface RewardPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RewardPopup: React.FC<RewardPopupProps> = ({
  isVisible,
  onClose,
}) => {
  const { addRewardRequest } = useGame();
  const { playClick } = useSound();

  const [isExiting, setIsExiting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RewardCategory>("lazer");

  const handleClose = () => {
    setIsExiting(true);
  };

  const handleAnimationComplete = () => {
    if (isExiting) {
      setIsExiting(false);
      setTitle("");
      setCategory("lazer");
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playClick();
    addRewardRequest(title, category);
    setIsExiting(true);
  };

  if (!isVisible && !isExiting) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col mx-auto overflow-hidden max-w-md"
      style={{ backgroundColor: PRIMARY }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: "-100%" }}
        animate={isExiting ? { y: "-100%" } : { y: 0 }}
        transition={isExiting ? EXIT_TRANSITION_FAST : ENTER_TRANSITION}
        className="flex items-center h-[10vh] px-5 pt-safe"
      >
        <div className="flex w-full items-center">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center transition-all active:scale-95"
          >
            <RiArrowLeftLine className="text-white" size={20} />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-white pr-9">
            Nova Recompensa
          </h1>
        </div>
      </motion.div>

      {/* White Card */}
      <motion.div
        initial={{ y: "100%" }}
        animate={isExiting ? { y: "100%" } : { y: 0 }}
        transition={isExiting ? EXIT_TRANSITION_CARD : ENTER_TRANSITION}
        onAnimationComplete={handleAnimationComplete}
        className="flex-1 overflow-y-auto h-[90vh] rounded-t-[2rem] bg-white dark:bg-slate-800"
      >
        <form onSubmit={handleSubmit} className="p-5 pt-7 pb-10">
          {/* Título */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-400 dark:text-slate-500">
              O que você deseja?
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cinema, Jantar fora, Skin..."
              className="w-full border-b-2 border-slate-200 focus-visible:outline-none outline-none bg-transparent pb-2.5 text-base font-medium text-slate-800 transition-colors placeholder:text-slate-300 focus:border-[#a1c797] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-[#a1c797]"
            />
          </div>

          {/* Categoria */}
          <div className="mb-8">
            <label className="mb-3 block text-xs font-medium text-slate-400 dark:text-slate-500">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 aspect-square transition-all active:scale-95 ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-white dark:ring-offset-slate-800"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: cat.hsl,
                      ...(isSelected ? { ringColor: "white" } : {}),
                    }}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                    <span className="text-[9px] font-bold text-white leading-tight text-center">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim()}
            className={`w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              !title.trim()
                ? "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
                : "text-white hover:opacity-90"
            }`}
            style={
              title.trim()
                ? {
                    backgroundColor: PRIMARY,
                    boxShadow: `0 8px 24px ${PRIMARY}40`,
                  }
                : undefined
            }
          >
            Criar Recompensa
            <RiArrowRightSLine size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
