'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const BENEFITS = [
  {
    number: '01',
    title: 'Conceituação Cognitiva preenchida por IA',
    description:
      'O Diagrama de Beck completo — infância, crenças centrais, suposições, estratégias compensatórias e situações — sugerido automaticamente a partir dos diários, transcrições e dados do paciente. Você só revisa e ajusta.',
    accent: 'Economize sessões inteiras',
  },
  {
    number: '02',
    title: 'Plano terapêutico gerado automaticamente',
    description:
      'Com base na Conceituação Cognitiva, a IA gera objetivos, intervenções e atividades alinhados à abordagem CT-R — focando nos pontos fortes e recursos do paciente. Um plano que antes levava horas, pronto em segundos.',
    accent: 'Horas → segundos',
  },
  {
    number: '03',
    title: 'Transcrição inteligente de sessões',
    description:
      'Envie a gravação e receba a transcrição completa com separação de falas (terapeuta vs paciente), detecção de emoções e resumo clínico. Tudo indexado e pesquisável no prontuário digital.',
    accent: 'Prontuário inteligente',
  },
  {
    number: '04',
    title: 'Relatórios semanais com análise de IA',
    description:
      'A cada semana, receba um panorama de cada paciente: tendências emocionais, padrões de pensamento, evolução de humor, conclusão de tarefas e alertas de risco. Tudo consolidado em uma única tela.',
    accent: 'Visão 360° do paciente',
  },
  {
    number: '05',
    title: 'Financeiro no piloto automático',
    description:
      'Receitas por sessão, despesas operacionais, faturamento PJ ou CPF — registrado, categorizado e com relatório mensal. Chega de planilha no Excel. Chega de ansiedade com dinheiro.',
    accent: 'Zero planilhas',
  },
  {
    number: '06',
    title: 'Pacientes 3x mais engajados',
    description:
      'Gamificação com XP, moedas, ranks, conquistas e recompensas mantém seus pacientes ativos entre as sessões. Diário com análise IA, meditação guiada personalizada e chat terapêutico disponível 24h.',
    accent: 'Aderência que transforma',
  },
]

export function TransformSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className='relative overflow-hidden bg-[#f8faf7] py-24 sm:py-32 lg:py-40' ref={ref}>
      {/* Decorative circles */}
      <div className='pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[#a1c797]/5 blur-3xl' />
      <div className='pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#a1c797]/5 blur-3xl' />

      <div className='mx-auto max-w-4xl px-6 sm:px-8'>
        <motion.p
          animate={inView ? { opacity: 1 } : {}}
          className='text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#a1c797] sm:text-base'
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Para o psicólogo
        </motion.p>
        <motion.h2
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className='mt-4 text-center font-black text-[28px] leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          O que muda na sua rotina
        </motion.h2>

        {/* Stacked benefits — alternating layout */}
        <div className='mt-16 sm:mt-20'>
          {BENEFITS.map((benefit, i) => (
            <BenefitRow benefit={benefit} index={i} key={benefit.number} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BenefitRow({ benefit, index }: { benefit: (typeof BENEFITS)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      animate={inView ? { opacity: 1, y: 0 } : {}}
      className='relative border-t border-slate-200 py-10 sm:py-14'
      initial={{ opacity: 0, y: 40 }}
      ref={ref}
      transition={{ duration: 0.6, delay: index * 0.05 }}
    >
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8'>
        {/* Number */}
        <span className='shrink-0 font-black text-5xl tracking-tight text-[#a1c797]/20 sm:text-6xl lg:text-7xl'>
          {benefit.number}
        </span>

        {/* Content */}
        <div className='flex-1'>
          <div className='flex flex-wrap items-center gap-3'>
            <h3 className='font-bold text-xl text-slate-900 sm:text-2xl'>{benefit.title}</h3>
            <span className='rounded-full bg-[#a1c797]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#6b8f60]'>
              {benefit.accent}
            </span>
          </div>

          <p className='mt-3 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg'>
            {benefit.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
