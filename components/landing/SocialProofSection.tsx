"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STATS = [
  { value: "6", label: "agentes de IA especializados", suffix: "" },
  { value: "30", label: "segundos para transcrever uma sessão", suffix: "s" },
  { value: "100", label: "conformidade total com a LGPD", suffix: "%" },
  { value: "0", label: "planilhas necessárias", suffix: "" },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-slate-950 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center font-black text-2xl text-white sm:text-3xl md:text-4xl"
        >
          Construído para quem não tem tempo a perder
        </motion.h2>

        <div className="mt-14 flex flex-wrap justify-center gap-x-12 gap-y-10 sm:mt-16 sm:gap-x-16 lg:gap-x-24">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="text-center"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-black text-5xl tracking-tight text-[#a1c797] sm:text-6xl">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-2xl font-bold text-[#a1c797]/60 sm:text-3xl">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-[160px] text-sm text-slate-400 sm:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* LGPD + Security badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:mt-20"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs font-medium sm:text-sm">
              Dados criptografados
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-xs font-medium sm:text-sm">
              LGPD compliant
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium sm:text-sm">
              Servidores no Brasil
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
