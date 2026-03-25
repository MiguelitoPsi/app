"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const PATIENT_FEATURES = [
  {
    id: "gamification",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
    title: "Gamificação terapêutica",
    metric: "10 ranks",
    detail:
      "XP, moedas, conquistas e recompensas personalizadas. Cada exercício concluído gera progresso real. Pacientes competem consigo mesmos — e vencem.",
  },
  {
    id: "diary",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    title: "Diário com análise IA",
    metric: "CT-R",
    detail:
      "O paciente registra pensamentos e emoções. A IA valida sentimentos, identifica pontos fortes e oferece uma perspectiva alternativa baseada na Terapia Cognitiva de Recuperação — em tempo real.",
  },
  {
    id: "meditation",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    title: "Meditação personalizada por IA",
    metric: "4 tipos",
    detail:
      "Scripts de meditação guiada gerados sob medida para o momento emocional do paciente. Respiração, body-scan, mindfulness e loving-kindness — com timer interativo.",
  },
  {
    id: "chat",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    title: "Suporte IA entre sessões",
    metric: "24/7",
    detail:
      "Chat terapêutico com IA treinada em CT-R e mindfulness. Detecta crises, mantém histórico e dá suporte emocional quando o paciente mais precisa — sem substituir o profissional.",
  },
  {
    id: "routine",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    title: "Rotina com propósito",
    metric: "+50 XP",
    detail:
      "Tarefas terapêuticas com prioridades, prazos e recompensas. O sistema de penalidades por atraso ensina responsabilidade. Cada tarefa completa é um passo medido rumo à recuperação.",
  },
];

export function PatientSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#a1c797] sm:text-base"
        >
          Para seus pacientes
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-center font-black text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
        >
          Seus pacientes finalmente
          <br />
          <span className="text-[#a1c797]">completam as tarefas</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-center text-sm text-slate-500 sm:text-base lg:text-lg"
        >
          Um app que transforma o acompanhamento terapêutico em uma jornada de
          progresso visível — e viciante no bom sentido.
        </motion.p>

        {/* Accordion-style feature list */}
        <div className="mx-auto mt-14 max-w-3xl sm:mt-20">
          {PATIENT_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="border-t border-slate-200"
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === feature.id ? null : feature.id)
                }
                className="flex w-full items-center gap-4 py-6 text-left transition-colors hover:bg-slate-50 sm:gap-6 sm:py-8"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#a1c797]/10 text-[#6b8f60] sm:h-12 sm:w-12">
                  {feature.icon}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-slate-900 sm:text-lg">
                      {feature.title}
                    </h3>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      {feature.metric}
                    </span>
                  </div>
                </div>

                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                    expanded === feature.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  expanded === feature.id
                    ? "max-h-40 pb-6 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="pl-[60px] text-sm leading-relaxed text-slate-500 sm:pl-[72px] sm:text-base">
                  {feature.detail}
                </p>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-slate-200" />
        </div>

        {/* Bottom stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-14 flex flex-col items-center gap-2 sm:mt-20"
        >
          <div className="flex items-baseline gap-3">
            <span className="font-black text-5xl tracking-tight text-slate-900 sm:text-6xl">
              9
            </span>
            <span className="text-lg font-medium text-slate-500 sm:text-xl">
              categorias de conquistas
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Evolução, tarefas, meditação, diário, humor, streaks, recompensas e
            mais
          </p>
        </motion.div>
      </div>
    </section>
  );
}
