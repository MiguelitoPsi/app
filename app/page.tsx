"use client";

import {
  ArrowRight,
  Award,
  Brain,
  Check,
  ChevronRight,
  Heart,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  Activity,
  Lock,
  Smartphone,
  FileText,
  BarChart,
  Bell,
  Calendar,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Mariana Costa",
      role: "Paciente",
      avatar: "👩‍💼",
      text: "O sistema de gamificação torna o processo de autoconhecimento mais leve. Sinto que estou progredindo dia após dia.",
      rating: 5,
    },
    {
      name: "Dr. Ricardo Almeida",
      role: "Psicólogo Clínico (CRP 06/12345)",
      avatar: "👨‍⚕️",
      text: "Uma ferramenta excelente para aumentar a adesão dos pacientes às tarefas de casa e monitorar o estado emocional entre sessões.",
      rating: 5,
    },
    {
      name: "Felipe Santos",
      role: "Paciente",
      avatar: "👨‍💻",
      text: "O diário emocional me ajudou a identificar padrões que eu não percebia. Levo os relatórios para minha terapia e discutimos sobre eles.",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000); // Mais tempo para leitura
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30">
      {/* Header Profissional */}
      <header className="fixed top-0 z-40 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Nepsis</span>
          </div>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#recursos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Recursos
            </Link>
            <Link href="#profissionais" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Para Terapeutas
            </Link>
            <Link href="#depoimentos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Depoimentos
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block"
              href="/auth/signin"
            >
              Entrar
            </Link>
            <Link
              className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-sm text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
              href="/auth/signup"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Foco em Apoio e Ciência */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20">
        {/* Background Effects - Mais sutis */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="font-medium text-violet-300 text-sm">
              Tecnologia e Psicologia unidas pelo seu bem-estar
            </span>
          </div>

          <h1 className="mb-6 font-bold text-4xl tracking-tight text-white sm:text-5xl md:text-6xl lg:leading-tight">
            Sua jornada de saúde mental <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              mais engajadora e eficiente
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            O Nepsis é uma ferramenta complementar que utiliza gamificação e Inteligência Artificial 
            para auxiliar no monitoramento de humor, registro de pensamentos e adesão a hábitos saudáveis.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-lg text-slate-900 shadow-xl shadow-violet-500/10 transition-all hover:bg-slate-100 hover:shadow-violet-500/20 sm:w-auto"
              href="/auth/signup"
            >
              Criar Conta Gratuita
              <ArrowRight className="h-5 w-5 text-violet-600 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-600 sm:w-auto"
              href="#profissionais"
            >
              Sou Terapeuta
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Dados Criptografados</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Baseado em TCC</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Monitoramento Diário</span>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="relative px-4 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm shadow-2xl">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-950 relative flex items-center justify-center">
               <DataFlowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="px-4 py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="mb-4 font-bold text-3xl text-white sm:text-4xl">
              Recursos projetados para o seu progresso
            </h2>
            <p className="text-slate-400 text-lg">
              Ferramentas baseadas em evidências científicas, adaptadas para uma experiência digital envolvente e segura.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Brain className="h-6 w-6 text-violet-400" />}
              title="Registro de Pensamentos"
              description="Baseado no modelo da Terapia Cognitivo-Comportamental (TCC), ajuda a identificar e reestruturar distorções cognitivas."
            />
            <FeatureCard
              icon={<Trophy className="h-6 w-6 text-amber-400" />}
              title="Gamificação Terapêutica"
              description="Sistema de recompensas que incentiva a constância no autocuidado, transformando hábitos saudáveis em conquistas."
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6 text-emerald-400" />}
              title="Monitoramento de Humor"
              description="Acompanhe as flutuações do seu estado emocional ao longo do tempo e identifique gatilhos importantes."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-blue-400" />}
              title="Conexão com Terapeuta"
              description="Compartilhe seus registros e relatórios diretamente com seu psicólogo para sessões mais produtivas."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-rose-400" />}
              title="Metas e Rotinas"
              description="Organize sua rotina de autocuidado com lembretes gentis e metas alcançáveis."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-slate-400" />}
              title="Privacidade em Primeiro Lugar"
              description="Seus pensamentos e registros são privados e protegidos. Você decide o que compartilhar."
            />
          </div>
        </div>
      </section>

      {/* Section for Therapists (B2B) */}
      <section id="profissionais" className="px-4 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-violet-950/20" />
        <div className="mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-400 mb-6">
                <Users className="h-4 w-4" />
                Para Psicólogos e Terapeutas
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Potencialize seus atendimentos clínicos
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                O Nepsis funciona como uma extensão do consultório, permitindo que você acompanhe a evolução do paciente entre as sessões.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Acesso ao diário e registros de humor do paciente (com consentimento)",
                  "Visualização gráfica da evolução do quadro",
                  "Prescrição de tarefas e atividades psicoeducativas",
                  "Maior engajamento do paciente com o tratamento"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-violet-400" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup?role=specialist"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/50 bg-violet-500/10 px-6 py-3 font-semibold text-violet-300 transition-all hover:bg-violet-500/20"
              >
                Cadastrar como Profissional
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent rounded-2xl blur-2xl" />
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                {/* Mockup de Dashboard do Terapeuta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Users className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Painel do Especialista</p>
                        <p className="text-xs text-slate-500">Visão Geral dos Pacientes</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-700" />
                          <div>
                            <div className="h-2 w-24 bg-slate-700 rounded mb-1" />
                            <div className="h-2 w-16 bg-slate-700/50 rounded" />
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-emerald-500/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="px-4 py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl text-white">
              Relatos da Comunidade
            </h2>
            <p className="text-slate-400">
              Experiências reais de quem utiliza o Nepsis como ferramenta de apoio.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-3xl border border-slate-700">
                {testimonials[activeTestimonial].avatar}
              </div>
              <div className="mb-6 flex gap-1">
                {[...new Array(testimonials[activeTestimonial].rating)].map((_, j) => (
                  <Star key={j} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <blockquote className="mb-6 text-xl text-slate-200 font-medium leading-relaxed">
                "{testimonials[activeTestimonial].text}"
              </blockquote>
              <div>
                <cite className="not-italic font-semibold text-white block">
                  {testimonials[activeTestimonial].name}
                </cite>
                <span className="text-slate-500 text-sm">
                  {testimonials[activeTestimonial].role}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial ? "w-8 bg-violet-500" : "w-2 bg-slate-700 hover:bg-slate-600"
                  }`}
                  aria-label={`Ver depoimento ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Pricing Simplified */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 to-slate-900 p-8 md:p-16 text-center border border-violet-500/30">
            <div className="relative z-10">
              <h2 className="mb-6 font-bold text-3xl text-white sm:text-4xl">
                Comece a cuidar de você hoje
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-violet-100/80">
                O Nepsis oferece um plano gratuito completo para você iniciar sua jornada de autoconhecimento com suporte da tecnologia.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-lg text-violet-900 shadow-lg transition-all hover:bg-slate-100 hover:scale-105"
                  href="/auth/signup"
                >
                  Criar Conta Gratuita
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-violet-200/60">
                Não exigimos cartão de crédito para o plano gratuito.
              </p>
            </div>
            
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 border-t border-slate-800/50">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-bold text-2xl text-white">
            Dúvidas Frequentes
          </h2>
          <div className="space-y-4">
            <FaqItem 
              question="O Nepsis substitui a terapia?" 
              answer="Não. O Nepsis é uma ferramenta de apoio e autoconhecimento. Ele não substitui o acompanhamento profissional de um psicólogo ou psiquiatra. Recomendamos o uso do app em conjunto com a terapia."
            />
            <FaqItem 
              question="Como a IA é utilizada?" 
              answer="Nossa IA auxilia na identificação de padrões de pensamento e sugere reflexões baseadas em técnicas da TCC. Ela não realiza diagnósticos nem fornece aconselhamento médico."
            />
            <FaqItem 
              question="Meus dados são compartilhados com meu terapeuta?" 
              answer="Apenas se você autorizar explicitamente. Você tem total controle sobre quais informações deseja compartilhar através da funcionalidade de vinculação de conta."
            />
            <FaqItem 
              question="O app é gratuito?" 
              answer="Sim, oferecemos um plano gratuito robusto que permite acesso às principais funcionalidades de diário e gamificação. Planos premium oferecem recursos adicionais e relatórios mais detalhados."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-800 p-1.5">
                <Brain className="h-5 w-5 text-slate-200" />
              </div>
              <span className="font-bold text-white">Nepsis</span>
            </div>
            
            <div className="text-slate-500 text-sm text-center md:text-right">
              <p>© {new Date().getFullYear()} Nepsis. Todos os direitos reservados.</p>
              <p className="mt-1 text-xs">
                Atenção: Em caso de crise ou emergência, ligue para o CVV (188) ou procure o hospital mais próximo.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700 hover:bg-slate-800/50">
      <div className="mb-4 inline-flex rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-sm group-hover:border-slate-700 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-lg text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <details className="group rounded-xl border border-slate-800 bg-slate-900/30 open:bg-slate-900/50 transition-all">
      <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200 hover:text-white">
        {question}
        <ChevronRight className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-4 pb-4 pt-0 text-slate-400 text-sm leading-relaxed border-t border-transparent group-open:border-slate-800/50 group-open:pt-4">
        {answer}
      </div>
    </details>
  );
}

function DataFlowAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 perspective-1000">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950 to-slate-950" />
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* 3D Container */}
      <motion.div 
        className="relative w-full max-w-4xl h-[60%] flex items-center justify-center"
        initial={{ rotateX: 10 }}
        animate={{ rotateX: [10, 15, 10] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        
        {/* Central Hub - AI */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <motion.div 
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30"
            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 30px rgba(124, 58, 237, 0.3)", "0 0 60px rgba(124, 58, 237, 0.6)", "0 0 30px rgba(124, 58, 237, 0.3)"] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Brain className="w-16 h-16 text-white" />
            
            {/* Rotating Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-violet-400/30"
                style={{ width: `${100 + i * 40}%`, height: `${100 + i * 40}%`, left: `-${i * 20}%`, top: `-${i * 20}%` }}
                animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                transition={{ duration: 10 + i * 5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-violet-400 rounded-full shadow-glow" />
              </motion.div>
            ))}
          </motion.div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center w-40">
            <span className="text-lg font-bold text-white block">Nepsis AI</span>
            <span className="text-xs text-violet-400">Processamento Seguro</span>
          </div>
        </div>

        {/* Left Node - Patient */}
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4">
          <motion.div 
            className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xl shadow-violet-500/10"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Smartphone className="w-10 h-10 text-slate-300" />
          </motion.div>
          <span className="text-sm font-medium text-slate-400">Paciente</span>
          
          {/* Satellite Nodes */}
          <motion.div 
            className="absolute -top-12 -left-8 bg-slate-800 p-2 rounded-lg border border-slate-700"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
          >
            <Heart className="w-4 h-4 text-rose-500" />
          </motion.div>
          <motion.div 
            className="absolute -bottom-8 -right-8 bg-slate-800 p-2 rounded-lg border border-slate-700"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
          >
            <FileText className="w-4 h-4 text-blue-500" />
          </motion.div>
        </div>

        {/* Right Node - Therapist */}
        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4">
          <motion.div 
            className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xl shadow-emerald-500/10"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2.5 }}
          >
            <Users className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <span className="text-sm font-medium text-slate-400">Terapeuta</span>

          {/* Satellite Nodes */}
          <motion.div 
            className="absolute -top-10 -right-6 bg-slate-800 p-2 rounded-lg border border-slate-700"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
          >
            <BarChart className="w-4 h-4 text-emerald-500" />
          </motion.div>
          <motion.div 
            className="absolute -bottom-6 -left-6 bg-slate-800 p-2 rounded-lg border border-slate-700"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
          </motion.div>
        </div>

        {/* Connecting Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <title>Data Flow Connections</title>
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            
            {/* Left to Center Lines */}
            <path d="M 15% 50% Q 32% 40% 50% 50%" stroke="url(#grad1)" strokeWidth="2" fill="none" className="opacity-30" />
            <path d="M 15% 50% Q 32% 60% 50% 50%" stroke="url(#grad1)" strokeWidth="2" fill="none" className="opacity-30" />
            
            {/* Center to Right Lines */}
            <path d="M 50% 50% Q 68% 40% 85% 50%" stroke="url(#grad2)" strokeWidth="2" fill="none" className="opacity-30" />
            <path d="M 50% 50% Q 68% 60% 85% 50%" stroke="url(#grad2)" strokeWidth="2" fill="none" className="opacity-30" />

            {/* Animated Particles */}
            <circle r="3" fill="#a78bfa">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 15% 50% Q 32% 40% 50% 50%" />
            </circle>
            <circle r="3" fill="#a78bfa">
                <animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M 15% 50% Q 32% 60% 50% 50%" />
            </circle>
            
            <circle r="3" fill="#34d399">
                <animateMotion dur="3s" repeatCount="indefinite" begin="0.5s" path="M 50% 50% Q 68% 40% 85% 50%" />
            </circle>
            <circle r="3" fill="#34d399">
                <animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M 50% 50% Q 68% 60% 85% 50%" />
            </circle>
        </svg>

        {/* Floating Data Cards - More Dynamic */}
        {[
            { icon: <Activity className="w-3 h-3 text-emerald-400" />, text: "Humor: Estável", top: "20%", left: "20%", delay: 0 },
            { icon: <Target className="w-3 h-3 text-amber-400" />, text: "Meta Atingida", bottom: "20%", right: "20%", delay: 2 },
            { icon: <Bell className="w-3 h-3 text-blue-400" />, text: "Lembrete Enviado", top: "15%", right: "30%", delay: 4 },
            { icon: <MessageCircle className="w-3 h-3 text-violet-400" />, text: "Insight Gerado", bottom: "25%", left: "30%", delay: 6 },
        ].map((item, i) => (
            <motion.div 
                key={i}
                className="absolute bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-full border border-slate-700 shadow-lg flex items-center gap-2 z-30"
                style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8], y: [10, 0, 0, -10] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: item.delay, times: [0, 0.1, 0.9, 1] }}
            >
                {item.icon}
                <span className="text-[10px] font-medium text-slate-200 whitespace-nowrap">{item.text}</span>
            </motion.div>
        ))}

      </motion.div>
    </div>
  );
}
