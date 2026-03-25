"use client";

import { Html } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ThoughtBubbleProps {
  position: [number, number, number];
  thoughts: string[];
  label: string;
  delay?: number;
}

export function ThoughtBubble({
  position,
  thoughts,
  label,
  delay = 0,
}: ThoughtBubbleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setVisible(true);

      hideTimeout = setTimeout(() => {
        setVisible(false);

        showTimeout = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % thoughts.length);
          cycle();
        }, 2000); // 2s hidden
      }, 3500); // 3.5s visible
    };

    // Initial delay so bubbles don't all appear at once
    const initialTimeout = setTimeout(cycle, delay);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [thoughts.length, delay]);

  return (
    // No distanceFactor — fixed pixel size regardless of 3D distance
    <Html
      position={position}
      center
      zIndexRange={[5, 0]}
      style={{ pointerEvents: "none" }}
    >
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.75, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 150, userSelect: "none" }}
            className="rounded-2xl border  border-[#a1c797]/25 bg-white/95 px-2.5 py-2.5 shadow-xl shadow-[#a1c797]/15 backdrop-blur-sm"
          >
            <span className="block text-[9px]  sm:text-[10px] font-bold uppercase tracking-wider text-[#a1c797]">
              {label}
            </span>
            <span className="mt-1 block text-[10px] sm:text-[13px] font-medium text-slate-700 leading-snug">
              {thoughts[currentIndex]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}
