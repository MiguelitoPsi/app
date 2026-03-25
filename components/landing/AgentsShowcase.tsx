"use client";

import { Canvas } from "@react-three/fiber";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Suspense, useRef, useState, useCallback } from "react";
import { AgentModel } from "./AgentModel";

const AGENTS = [
  {
    id: "transcricao",
    name: "Transcrição",
    modelPath: "/3d/transcricao.glb",
    headline: "Suas sessões transcritas e analisadas automaticamente",
    description:
      "Grave ou envie o vídeo da sessão. O agente extrai o áudio, transcreve cada fala — identificando terapeuta e paciente — e ainda mapeia as emoções predominantes. Você recebe um resumo pronto para o prontuário.",
    capabilities: [
      "Transcrição automática com separação de falas",
      "Detecção de emoções em tempo real",
      "Resumo clínico da sessão gerado por IA",
      "Integrado ao diagrama de Conceituação Cognitiva",
    ],
  },
  {
    id: "tarefas",
    name: "Tarefas",
    modelPath: "/3d/tarefa.glb",
    headline: "Rotina terapêutica organizada no piloto automático",
    description:
      "Crie exercícios e tarefas para seus pacientes diretamente da plataforma. O agente monitora o progresso, envia lembretes e ajusta prioridades — mantendo o plano terapêutico vivo entre as sessões.",
    capabilities: [
      "Criação e atribuição de tarefas por prioridade",
      "Acompanhamento de conclusão em tempo real",
      "Lembretes automáticos via push notification",
      "Gamificação que triplica o engajamento",
    ],
  },
  {
    id: "agenda",
    name: "Agenda",
    modelPath: "/3d/agenda.glb",
    headline: "Agenda inteligente que se organiza sozinha",
    description:
      "Sessões agendadas, confirmadas e lembradas sem intervenção. O agente sincroniza seu calendário, envia lembretes aos pacientes e reorganiza horários automaticamente quando há mudanças.",
    capabilities: [
      "Sincronização automática de calendário",
      "Lembretes para terapeuta e paciente",
      "Confirmação de presença automatizada",
      "Reagendamento inteligente com sugestões",
    ],
  },
  {
    id: "financeiro",
    name: "Financeiro",
    modelPath: "/3d/financeiro.glb",
    headline: "Suas finanças clínicas sob controle total",
    description:
      "Receitas, despesas, faturamento PJ ou CPF — tudo registrado automaticamente. O agente gera relatórios financeiros mensais, categoriza gastos e mantém seu fluxo de caixa sempre visível.",
    capabilities: [
      "Registro automático de receitas por sessão",
      "Categorização inteligente de despesas",
      "Relatórios mensais de faturamento",
      "Visão de fluxo de caixa em tempo real",
    ],
  },
];

function AgentCanvas({ modelPath }: { modelPath: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <directionalLight position={[-2, 3, 4]} intensity={0.6} />
      <Suspense fallback={null}>
        <AgentModel modelPath={modelPath} position={[0, 0, 0]} scale={0.8} />
      </Suspense>
    </Canvas>
  );
}

export function AgentsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const agent = AGENTS[activeIndex];

  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <section
      ref={ref}
      id="agentes"
      className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#a1c797] sm:text-base"
        >
          Inteligência artificial especializada
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-center font-black text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
        >
          Conheça seus agentes
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-500 sm:text-base"
        >
          Cada agente é treinado em uma função específica da sua clínica.
          Selecione para ver como trabalha.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 lg:mt-20"
        >
          {/* Agent tabs — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:justify-center sm:gap-3 scrollbar-hide">
            {AGENTS.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelect(i)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 sm:px-6 sm:py-3 sm:text-base ${
                  i === activeIndex
                    ? "bg-slate-900 text-white "
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="mt-10 flex flex-col items-center gap-10 lg:mt-14 lg:flex-row lg:items-start lg:gap-16">
            {/* 3D Agent render */}
            <div className="relative h-[320px] w-full max-w-[320px] shrink-0 sm:h-[400px] sm:max-w-[400px] lg:h-[460px] lg:max-w-[440px]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#a1c797]/10 via-transparent to-[#a1c797]/5" />
              <div className="absolute bottom-0 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-slate-900/5 blur-lg" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  <AgentCanvas modelPath={agent.modelPath} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Agent info */}
            <div className="flex-1 text-center lg:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="inline-block rounded-full bg-[#a1c797]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6b8f60]">
                    Agente {agent.name}
                  </span>

                  <h3 className="mt-4 font-black text-2xl leading-tight text-slate-900 sm:text-3xl md:text-[34px]">
                    {agent.headline}
                  </h3>

                  <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
                    {agent.description}
                  </p>

                  <ul className="mt-8 space-y-3 text-left">
                    {agent.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-3">
                        <svg
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#a1c797]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm font-medium text-slate-700 sm:text-base">
                          {cap}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
