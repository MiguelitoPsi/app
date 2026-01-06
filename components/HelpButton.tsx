'use client'

import { HelpCircle, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { getIconByKey } from '@/lib/utils/icon-map'

type ScreenId =
  | 'home'
  | 'journal'
  | 'journal-history'
  | 'meditation'
  | 'routine'
  | 'rewards'
  | 'profile'

type TutorialContent = {
  title: string
  sections: {
    heading: string
    label: string
    items: string[]
  }[]
}

const TUTORIALS: Record<ScreenId, TutorialContent> = {
  home: {
    title: 'Início',
    sections: [
      {
        heading: 'happy',
        label: 'Registro de Humor',
        items: [
          'Toque no emoji que representa como você está se sentindo',
          'Ganhe XP a cada registro de humor (1x por hora)',
          'Seu mascote muda de acordo com seu humor',
        ],
      },
      {
        heading: 'excited',
        label: 'Ações Rápidas',
        items: [
          'Acesse o Diário de Pensamento para registrar reflexões',
          'Inicie uma Meditação Rápida para relaxar',
        ],
      },
      {
        heading: 'clinical_productivity',
        label: 'Gráfico Semanal',
        items: [
          'Visualize seu humor dos últimos 7 dias',
          'Acompanhe padrões e tendências emocionais',
        ],
      },
    ],
  },
  journal: {
    title: 'Diário de Pensamento',
    sections: [
      {
        heading: 'journal_writer',
        label: 'Como Escrever',
        items: [
          'Descreva como você está se sentindo no campo de texto',
          'Seja honesto e detalhado em suas reflexões',
          'Não há certo ou errado - escreva livremente',
        ],
      },
      {
        heading: 'thought',
        label: 'Análise com IA',
        items: [
          'Clique em "Analisar" para receber insights da IA',
          'A IA identifica padrões de pensamento e oferece sugestões',
          'Use as dicas para desenvolver pensamentos mais saudáveis',
        ],
      },
      {
        heading: 'success',
        label: 'Salvando',
        items: [
          'Clique em "Salvar" para guardar sua reflexão',
          'Ganhe XP e pontos ao salvar reflexões',
          'Acesse reflexões anteriores no histórico',
        ],
      },
    ],
  },
  'journal-history': {
    title: 'Histórico do Diário',
    sections: [
      {
        heading: 'reports_nav',
        label: 'Navegação',
        items: [
          'Veja todas as suas reflexões anteriores em ordem cronológica',
          'Clique em uma entrada para expandir e ver detalhes',
        ],
      },
      {
        heading: 'routine',
        label: 'Filtros',
        items: [
          'Filtre por tipo de humor para encontrar entradas específicas',
          'Use os emojis para selecionar o humor desejado',
        ],
      },
      {
        heading: 'feedback',
        label: 'Feedbacks',
        items: [
          'Veja os feedbacks deixados pelo seu terapeuta',
          'Entradas com feedback novo são destacadas',
        ],
      },
    ],
  },
  meditation: {
    title: 'Meditação',
    sections: [
      {
        heading: 'meditation',
        label: 'Tipos de Meditação',
        items: [
          'Relaxamento: Alivie o estresse e encontre equilíbrio',
          'Foco: Melhore sua concentração',
          'Sono: Prepare-se para dormir melhor',
        ],
      },
      {
        heading: 'clinical_productivity',
        label: 'Duração',
        items: [
          'Escolha entre 1, 2, 3, 5 ou 10 minutos',
          'Use os botões + e - para ajustar',
          'Comece com sessões curtas e aumente gradualmente',
        ],
      },
      {
        heading: 'behavior',
        label: 'Respiração',
        items: [
          'Siga o círculo que expande (inspirar) e contrai (expirar)',
          'Personalize os tempos de inspiração e expiração',
          'Ganhe XP ao completar uma sessão',
        ],
      },
    ],
  },
  routine: {
    title: 'Rotina',
    sections: [
      {
        heading: 'tasks_created',
        label: 'Gerenciando Tarefas',
        items: [
          'Toque no botão + para criar uma nova tarefa',
          'Defina prioridade: Alta, Média ou Baixa',
          'Configure frequência: Uma vez, Diário, Semanal ou Mensal',
        ],
      },
      {
        heading: 'reports',
        label: 'Visualizações',
        items: [
          'Dia: Veja tarefas de um dia específico',
          'Semana: Visão geral da semana',
          'Mês: Planejamento mensal',
        ],
      },
      {
        heading: 'success',
        label: 'Completando',
        items: [
          'Marque tarefas como concluídas tocando nelas',
          'Tarefas de alta prioridade dão mais XP e pontos',
          'Não é possível completar tarefas futuras antecipadamente',
        ],
      },
    ],
  },
  rewards: {
    title: 'Prêmios',
    sections: [
      {
        heading: 'reward_gift',
        label: 'Criando Prêmios',
        items: [
          'Toque no botão + para criar um novo prêmio',
          'Defina um nome e o custo em pontos',
          'Escolha uma categoria para organizar',
        ],
      },
      {
        heading: 'reward_gem',
        label: 'Pontos',
        items: [
          'Ganhe pontos completando tarefas e usando o app',
          'Tarefas de alta prioridade dão mais pontos',
          'Seu saldo aparece no topo da tela',
        ],
      },
      {
        heading: 'achievements',
        label: 'Resgatando',
        items: [
          'Quando tiver pontos suficientes, toque em "Resgatar"',
          'O prêmio será marcado como resgatado',
          'Use isso para se motivar com recompensas pessoais!',
        ],
      },
    ],
  },
  profile: {
    title: 'Perfil',
    sections: [
      {
        heading: 'clinical_productivity',
        label: 'Progresso',
        items: [
          'Veja seu nível atual e XP acumulado',
          'Acompanhe sua sequência de dias usando o app',
          'Visualize estatísticas gerais de uso',
        ],
      },
      {
        heading: 'achievements',
        label: 'Conquistas',
        items: [
          'Desbloqueie badges completando objetivos',
          'Veja o progresso de cada conquista',
          'Conquistas desbloqueadas ficam destacadas',
        ],
      },
      {
        heading: 'settings',
        label: 'Configurações',
        items: [
          'Altere sua senha de acesso',
          'Ative ou desative o modo escuro',
          'Visualize seu termo de consentimento',
        ],
      },
    ],
  },
}

type HelpButtonProps = {
  screenId: ScreenId
}

export const HelpButton: React.FC<HelpButtonProps> = ({ screenId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const tutorial = TUTORIALS[screenId]

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Help Button */}
      <button
        aria-label='Abrir tutorial de ajuda'
        className='touch-target p-2 text-slate-400 transition-colors hover:text-slate-600 active:scale-95 dark:text-slate-500 dark:hover:text-slate-300'
        onClick={() => setIsOpen(true)}
        type='button'
      >
        <HelpCircle className='sm:hidden' size={22} />
        <HelpCircle className='hidden sm:block' size={24} />
      </button>

      {/* Tutorial Modal */}
      {isOpen && (
        <div className='fade-in fixed inset-0 z-[100] isolate flex animate-in items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm duration-200'>
          <div
            className='zoom-in-95 relative z-10 w-full max-w-md max-h-[85vh] overflow-hidden animate-in rounded-2xl border border-slate-100 bg-white shadow-2xl duration-300 sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800'>
              <h3 className='flex items-center gap-2 font-bold text-base text-slate-800 sm:text-lg dark:text-white'>
                <HelpCircle className='text-sky-500' size={20} />
                Como usar: {tutorial.title}
              </h3>
              <button
                aria-label='Fechar tutorial'
                className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                onClick={() => setIsOpen(false)}
                type='button'
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className='overflow-y-auto p-4 sm:p-5 max-h-[calc(85vh-80px)]'>
              <div className='space-y-5'>
                {tutorial.sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className='mb-2 flex items-center gap-2 font-bold text-sm text-slate-700 sm:text-base dark:text-slate-200'>
                      {(() => {
                        const Icon = getIconByKey(section.heading)
                        return <Icon className='h-4 w-4 text-sky-500' />
                      })()}
                      {section.label}
                    </h4>
                    <ul className='space-y-1.5'>
                      {section.items.map((item, itemIdx) => (
                        <li
                          className='flex items-start gap-2 text-slate-600 text-xs sm:text-sm dark:text-slate-400'
                          key={itemIdx}
                        >
                          <span className='mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-slate-100 p-4 sm:p-5 dark:border-slate-800'>
              <button
                className='w-full rounded-xl bg-sky-600 py-2.5 font-bold text-sm text-white transition-all hover:bg-sky-700 active:scale-[0.98] sm:py-3'
                onClick={() => setIsOpen(false)}
                type='button'
              >
                Entendi!
              </button>
            </div>
          </div>

          {/* Backdrop click to close */}
          <div
            aria-hidden='true'
            className='absolute inset-0 z-0'
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  )
}

