'use client'

import { useState } from 'react'
import AchievementModal from '@/components/AchievementModal'

const testBadges = [
  {
    name: 'Primeira Jornada',
    description: 'Complete sua primeira tarefa no app',
    icon: '🎯',
  },
  {
    name: 'Mestre da Meditação',
    description: 'Medite por 7 dias consecutivos',
    icon: '🧘',
  },
  {
    name: 'Escritor de Emoções',
    description: 'Escreva 10 entradas no diário',
    icon: '📝',
  },
  {
    name: 'Estrela em Ascensão',
    description: 'Alcance o nível 5',
    icon: '⭐',
  },
  {
    name: 'Guerreiro Mental',
    description: 'Mantenha uma sequência de 30 dias',
    icon: '🏆',
  },
]

export default function TestAchievementPage() {
  const [showModal, setShowModal] = useState(false)
  const [currentBadge, setCurrentBadge] = useState(testBadges[0])

  const showAchievement = (badge: (typeof testBadges)[0]) => {
    setCurrentBadge(badge)
    setShowModal(true)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8'>
      <div className='mx-auto max-w-md'>
        <h1 className='mb-2 text-center text-3xl font-bold text-white'>🎮 Teste de Conquistas</h1>
        <p className='mb-8 text-center text-slate-400'>
          Clique em um badge para ver o popup de comemoração
        </p>

        <div className='space-y-4'>
          {testBadges.map((badge, index) => (
            <button
              className='flex w-full items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-all hover:border-sky-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-500/10'
              key={index}
              onClick={() => showAchievement(badge)}
              type='button'
            >
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-2xl'>
                {badge.icon}
              </div>
              <div>
                <h3 className='font-bold text-white'>{badge.name}</h3>
                <p className='text-sm text-slate-400'>{badge.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className='mt-8 rounded-xl border border-slate-700 bg-slate-800/30 p-4'>
          <h2 className='mb-2 font-semibold text-sky-400'>ℹ️ Como funciona</h2>
          <ul className='space-y-1 text-sm text-slate-400'>
            <li>• O modal aparece automaticamente quando você conquista um badge</li>
            <li>• Pressione ESC ou clique fora para fechar</li>
            <li>• Se houver múltiplas conquistas, elas aparecem em sequência</li>
          </ul>
        </div>
      </div>

      {showModal && <AchievementModal badge={currentBadge} onClose={() => setShowModal(false)} />}
    </div>
  )
}
