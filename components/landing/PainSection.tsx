"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const PAINS = [
  {
    text: "Horas transcrevendo sessões que poderiam ser investidas em estudo de caso",
    highlight: "Horas transcrevendo sessões",
  },
  {
    text: "Relatórios clínicos que consomem fins de semana inteiros",
    highlight: "Relatórios clínicos",
  },
  {
    text: "Pacientes que abandonam o tratamento entre consultas por falta de engajamento",
    highlight: "Pacientes que abandonam",
  },
  {
    text: "Gestão financeira improvisada que gera ansiedade no profissional",
    highlight: "Gestão financeira improvisada",
  },
  {
    text: "Conceituação Cognitiva de Beck que toma sessões inteiras para ser preenchida",
    highlight: "Conceituação Cognitiva",
  },
];

export function PainSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 lg:py-40"
    >
      {/* Subtle grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' fill='white'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#a1c797] sm:text-base"
        >
          Chega de trabalhar contra o relógio
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-5 text-center font-black text-[28px] leading-[1.1] text-white sm:text-4xl md:text-5xl lg:text-[52px]"
        >
          Você não estudou 5 anos
          <br />
          <span className="text-slate-500">pra preencher planilha.</span>
        </motion.h2>

        <div className="mt-16 space-y-0 sm:mt-20">
          {PAINS.map((pain, i) => (
            <motion.div
              key={pain.highlight}
              initial={{ opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
              className="group relative border-t border-slate-800/60 py-5 sm:py-6"
            >
              <div className="flex items-start gap-4 sm:gap-6">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-400 sm:h-7 sm:w-7 sm:text-sm">
                  {i + 1}
                </span>
                <p className="text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
                  <span className="font-semibold text-white">
                    {pain.highlight}
                  </span>
                  {pain.text.replace(pain.highlight, "")}
                </p>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-slate-800/60" />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 text-center text-lg font-medium text-slate-500 sm:mt-16 sm:text-xl md:text-2xl"
        >
          E se tudo isso{" "}
          <span className="font-bold text-[#a1c797]">
            simplesmente acontecesse
          </span>{" "}
          sem você precisar fazer nada?
        </motion.p>
      </div>
    </section>
  );
}
