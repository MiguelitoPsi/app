"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function MethodologySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40"
    >
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a1c797] sm:text-base">
            Fundamentação científica
          </p>
          <h2 className="mt-4 font-black text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Não é mais uma ferramenta genérica.
            <br />
            <span className="text-slate-400">É CT-R aplicada em código.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 sm:mt-20"
        >
          <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 sm:p-12">
            {/* Decorative quote mark */}
            <span className="absolute -top-4 left-8 font-black text-7xl leading-none text-[#a1c797]/10 sm:left-12 sm:text-8xl">
              &ldquo;
            </span>

            <div className="relative space-y-6 text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>
                Toda a inteligência artificial da Nepsis é treinada em{" "}
                <strong className="text-slate-900">
                  Terapia Cognitiva Baseada em Recuperação (CT-R)
                </strong>{" "}
                — a abordagem do Instituto Beck que foca nos{" "}
                <strong className="text-slate-900">pontos fortes</strong>,{" "}
                recursos e crenças adaptativas do paciente, não apenas nos
                sintomas.
              </p>
              <p>
                Quando seu paciente escreve no diário, a IA não dá conselhos
                genéricos. Ela{" "}
                <strong className="text-slate-900">
                  valida o sentimento, identifica forças
                </strong>{" "}
                que o paciente demonstrou e oferece uma perspectiva alternativa
                construtiva — exatamente como você faria.
              </p>
              <p>
                O Diagrama de Conceituação Cognitiva de Beck é preenchido
                automaticamente a partir das sessões, diários e registros de
                humor — economizando{" "}
                <strong className="text-slate-900">
                  sessões inteiras de avaliação
                </strong>
                . Você revisa, ajusta e aplica.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Conceituação Cognitiva de Beck",
                "CT-R (Recovery-Oriented)",
                "Validação emocional",
                "Detecção de crise",
                "Foco em forças",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#a1c797]/20 bg-[#a1c797]/5 px-3 py-1.5 text-xs font-semibold text-[#6b8f60]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
