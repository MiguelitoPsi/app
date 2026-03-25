"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function FinalCTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl px-6 sm:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-black text-2xl leading-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-[42px]"
        >
          A pergunta não é se a IA vai transformar a psicologia clínica.
          <br />
          <span className="text-[#a1c797]">
            É se você vai liderar essa mudança.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("whitelist")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="group inline-flex items-center gap-2.5 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 sm:text-lg"
          >
            Quero ser um dos primeiros
            <svg
              className="h-4 w-4 text-[#a1c797] transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
