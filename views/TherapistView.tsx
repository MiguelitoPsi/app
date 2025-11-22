'use client'

import {
  Activity,
  BarChart2,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Gift,
  LogOut,
  Save,
  Users,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useGame } from '../context/GameContext'
import type { Mood, Reward } from '../types'

type TherapistViewProps = {
  goBack: () => void
}

// Mock data for a second patient to demonstrate switching
const DEMO_PATIENT = {
  name: 'Ana (Demo)',
  stats: {
    level: 5,
    streak: 12,
    totalMeditationMinutes: 145,
    totalTasksCompleted: 32,
    totalJournals: 8,
    points: 450,
  },
  moodData: [
    { name: 'Seg', score: 40 },
    { name: 'Ter', score: 50 },
    { name: 'Qua', score: 30 },
    { name: 'Qui', score: 60 },
    { name: 'Sex', score: 55 },
    { name: 'Sáb', score: 70 },
    { name: 'Dom', score: 80 },
  ],
  journal: [
    {
      id: 'demo1',
      timestamp: Date.now() - 86_400_000 * 2,
      emotion: 'anxious' as Mood,
      intensity: 8,
      thought: 'Sinto que não vou conseguir entregar o projeto a tempo.',
      aiAnalysis:
        'Pensamento catastrófico identificado. Tente focar nas etapas pequenas que você já concluiu.',
    },
  ],
}

export const TherapistView: React.FC<TherapistViewProps> = ({ goBack }) => {
  const { stats: realStats, journal: realJournal, updateReward } = useGame()
  const [selectedPatientId, setSelectedPatientId] = useState<'real' | 'demo'>('real')
  const [activeSection, setActiveSection] = useState<'overview' | 'journal' | 'rewards'>('overview')

  // Reward Management State
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [rewardCost, setRewardCost] = useState<string>('')
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)

  const openCostModal = (reward: Reward) => {
    setEditingReward(reward)
    setRewardCost(reward.cost > 0 ? reward.cost.toString() : '')
    setIsCostModalOpen(true)
  }

  const saveRewardCost = () => {
    if (!editingReward) {
      return
    }
    const cost = Number.parseInt(rewardCost, 10)
    if (Number.isNaN(cost) || cost < 0) {
      return
    }

    updateReward(editingReward.id, {
      cost,
      status: 'approved',
    })

    setIsCostModalOpen(false)
    setEditingReward(null)
    setRewardCost('')
  }

  // Determine which data to show
  const _patientName = selectedPatientId === 'real' ? realStats.name : DEMO_PATIENT.name
  const stats = selectedPatientId === 'real' ? realStats : DEMO_PATIENT.stats

  const journalData = selectedPatientId === 'real' ? realJournal : DEMO_PATIENT.journal
  const rewardsData = selectedPatientId === 'real' ? realStats.rewards : [] // Demo patient has no rewards for now

  // Format data for chart (using real data or demo data)
  const chartData =
    selectedPatientId === 'real'
      ? [
          { name: 'Seg', score: 0 },
          { name: 'Ter', score: 0 },
          { name: 'Qua', score: 0 },
          { name: 'Qui', score: 0 },
          { name: 'Sex', score: 0 },
          { name: 'Sáb', score: 0 },
          { name: 'Dom', score: 0 },
        ]
      : DEMO_PATIENT.moodData

  const getMoodColor = (mood: Mood) => {
    switch (mood) {
      case 'happy':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
      case 'sad':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
      case 'anxious':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
      case 'angry':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
      case 'calm':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const getMoodEmoji = (mood: Mood) => {
    const map: Record<string, string> = {
      happy: '😄',
      sad: '😔',
      anxious: '😰',
      angry: '😡',
      calm: '😌',
      neutral: '😐',
    }
    return map[mood] || '😐'
  }

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <div className='z-10 rounded-b-[2rem] border-slate-100 border-b bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='rounded-2xl bg-indigo-600 p-3 text-white shadow-indigo-200 shadow-lg dark:shadow-none'>
              <Activity size={24} />
            </div>
            <div>
              <h1 className='font-black text-slate-800 text-xl tracking-tight dark:text-white'>
                Portal do Especialista
              </h1>
              <p className='font-medium text-slate-500 text-xs dark:text-slate-400'>
                Acompanhamento de Pacientes
              </p>
            </div>
          </div>
          <button
            className='rounded-xl bg-slate-100 p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
            onClick={goBack}
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Patient Selector */}
        <div className='group relative'>
          <label className='mb-2 ml-1 block font-bold text-slate-400 text-xs uppercase tracking-wider'>
            Paciente Selecionado
          </label>
          <div className='relative'>
            <select
              className='w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 font-bold text-slate-700 outline-none transition-all hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50'
              onChange={(e) => setSelectedPatientId(e.target.value as 'real' | 'demo')}
              value={selectedPatientId}
            >
              <option value='real'>{realStats.name} (Ativo)</option>
              <option value='demo'>Ana (Demo)</option>
            </select>
            <div className='-translate-y-1/2 absolute top-1/2 left-4 rounded-lg bg-white p-1.5 shadow-sm dark:bg-slate-700'>
              <Users className='text-indigo-500 dark:text-indigo-400' size={16} />
            </div>
            <ChevronDown
              className='-translate-y-1/2 absolute top-1/2 right-4 text-slate-400 transition-colors group-hover:text-indigo-500'
              size={20}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='px-6 pt-6'>
        <div className='flex rounded-xl border border-slate-100 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <button
            className={`flex-1 rounded-lg py-3 font-bold text-sm transition-all duration-300 ${activeSection === 'overview' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            onClick={() => setActiveSection('overview')}
          >
            Visão Geral
          </button>
          <button
            className={`flex-1 rounded-lg py-3 font-bold text-sm transition-all duration-300 ${activeSection === 'journal' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            onClick={() => setActiveSection('journal')}
          >
            Diário ({journalData.length})
          </button>
          <button
            className={`flex-1 rounded-lg py-3 font-bold text-sm transition-all duration-300 ${activeSection === 'rewards' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            onClick={() => setActiveSection('rewards')}
          >
            Recompensas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 space-y-6 overflow-y-auto p-6 pb-24'>
        {activeSection === 'overview' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-6 duration-500'>
            {/* Key Metrics */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900'>
                <div className='mb-3 flex items-center gap-2 text-slate-400'>
                  <div className='rounded-lg bg-teal-50 p-2 text-teal-500 dark:bg-teal-900/20'>
                    <Clock size={18} />
                  </div>
                  <span className='font-bold text-[10px] uppercase tracking-wider'>Meditação</span>
                </div>
                <p className='font-black text-3xl text-slate-800 dark:text-white'>
                  {stats.totalMeditationMinutes}{' '}
                  <span className='font-medium text-slate-400 text-sm'>min</span>
                </p>
              </div>
              <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900'>
                <div className='mb-3 flex items-center gap-2 text-slate-400'>
                  <div className='rounded-lg bg-violet-50 p-2 text-violet-500 dark:bg-violet-900/20'>
                    <FileText size={18} />
                  </div>
                  <span className='font-bold text-[10px] uppercase tracking-wider'>Registros</span>
                </div>
                <p className='font-black text-3xl text-slate-800 dark:text-white'>
                  {stats.totalJournals}
                </p>
              </div>
              <div className='relative col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-indigo-200 shadow-lg dark:shadow-none'>
                <div className='-mr-10 -mt-10 absolute top-0 right-0 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl' />

                <div className='relative z-10 mb-4 flex items-center gap-2 text-indigo-100'>
                  <Activity size={18} />
                  <span className='font-bold text-xs uppercase tracking-wider'>Engajamento</span>
                </div>
                <div className='relative z-10 flex items-end justify-between'>
                  <div>
                    <p className='mb-1 font-black text-3xl'>Nível {stats.level}</p>
                    <div className='flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-indigo-100 text-sm'>
                      <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-400' />
                      Ofensiva de {stats.streak} dias
                    </div>
                  </div>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/20 font-bold text-xl'>
                    {Math.min(100, stats.streak * 10)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Mood Chart */}
            <div className='rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <h3 className='mb-6 flex items-center gap-3 font-bold text-slate-800 dark:text-white'>
                <div className='rounded-xl bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-900/20'>
                  <BarChart2 size={20} />
                </div>
                Variação de Humor
              </h3>
              <div className='h-56 w-full'>
                <ResponsiveContainer height='100%' width='100%'>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      opacity={0.5}
                      stroke='#e2e8f0'
                      strokeDasharray='3 3'
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey='name'
                      dy={10}
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        padding: '12px',
                      }}
                      cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                      activeDot={{ r: 8, fill: '#4f46e5' }}
                      dataKey='score'
                      dot={{ r: 6, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }}
                      stroke='#6366f1'
                      strokeWidth={4}
                      type='monotone'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'journal' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-4 duration-500'>
            {journalData.length === 0 ? (
              <div className='flex flex-col items-center justify-center rounded-3xl border-2 border-slate-200 border-dashed bg-slate-50/50 py-16 text-center dark:border-slate-800 dark:bg-slate-900/50'>
                <div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'>
                  <Brain size={40} />
                </div>
                <h4 className='mb-1 font-bold text-slate-700 dark:text-slate-300'>
                  Nenhum registro
                </h4>
                <p className='text-slate-400 text-sm dark:text-slate-500'>
                  O paciente ainda não fez anotações.
                </p>
              </div>
            ) : (
              journalData.map((entry, index) => (
                <div
                  className='slide-in-from-bottom-2 animate-in rounded-3xl border border-slate-100 bg-white fill-mode-backwards p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                  key={entry.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='mb-4 flex items-start justify-between'>
                    <div
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-2 ${getMoodColor(entry.emotion)}`}
                    >
                      <span className='text-2xl drop-shadow-sm filter'>
                        {getMoodEmoji(entry.emotion)}
                      </span>
                      <div>
                        <span className='block font-black text-xs uppercase opacity-80'>
                          {entry.emotion}
                        </span>
                        <span className='font-bold text-[10px] opacity-60'>
                          Intensidade: {entry.intensity}
                        </span>
                      </div>
                    </div>
                    <span className='rounded-full bg-slate-50 px-3 py-1 font-bold text-slate-400 text-xs dark:bg-slate-800'>
                      {new Date(entry.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className='mb-5 border-slate-100 border-l-2 pl-2 dark:border-slate-800'>
                    <p className='mb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider'>
                      Pensamento Automático
                    </p>
                    <p className='text-slate-700 text-sm italic leading-relaxed dark:text-slate-300'>
                      "{entry.thought}"
                    </p>
                  </div>

                  {entry.aiAnalysis && (
                    <div className='relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                      <div className='-mr-8 -mt-8 absolute top-0 right-0 h-16 w-16 rounded-full bg-indigo-200/20' />
                      <div className='relative z-10 mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400'>
                        <Brain size={16} />
                        <span className='font-black text-xs uppercase tracking-wider'>
                          Análise do Sistema
                        </span>
                      </div>
                      <p className='relative z-10 font-medium text-indigo-800 text-xs leading-relaxed dark:text-indigo-200'>
                        {entry.aiAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === 'rewards' && (
          <div className='fade-in slide-in-from-bottom-4 animate-in space-y-8 duration-500'>
            {/* Points Summary */}
            <div className='relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg dark:bg-black'>
              <div className='-mr-16 -mt-16 pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl' />
              <div className='relative z-10 flex items-center justify-between'>
                <div>
                  <p className='mb-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                    Saldo do Paciente
                  </p>
                  <p className='font-black text-4xl'>
                    {stats.points} <span className='font-bold text-lg text-slate-500'>pts</span>
                  </p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10'>
                  <Gift className='text-indigo-300' size={24} />
                </div>
              </div>
            </div>

            {/* Pending Rewards */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-amber-500' />
                Pendentes de Aprovação
              </h3>
              <div className='space-y-3'>
                {rewardsData.filter((r) => r.status === 'pending').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhuma solicitação pendente.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'pending')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-amber-900/30 dark:bg-slate-900'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-slate-800 dark:text-white'>
                            {reward.title}
                          </h4>
                          <span className='mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 font-bold text-[10px] text-slate-400 uppercase dark:bg-slate-800'>
                            {reward.category}
                          </span>
                        </div>
                        <button
                          className='rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white text-xs shadow-indigo-200 shadow-sm transition-colors hover:bg-indigo-700 dark:shadow-none'
                          onClick={() => openCostModal(reward)}
                        >
                          Definir Custo
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Approved Rewards */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-emerald-500' />
                Aprovadas
              </h3>
              <div className='space-y-3'>
                {rewardsData.filter((r) => r.status === 'approved').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhuma recompensa ativa.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'approved')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/30 dark:bg-slate-900'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-slate-800 dark:text-white'>
                            {reward.title}
                          </h4>
                          <div className='mt-1 flex items-center gap-2'>
                            <span className='rounded-md bg-slate-100 px-2 py-1 font-bold text-[10px] text-slate-400 uppercase dark:bg-slate-800'>
                              {reward.category}
                            </span>
                            <span className='font-bold text-emerald-600 text-xs dark:text-emerald-400'>
                              {reward.cost} pts
                            </span>
                          </div>
                        </div>
                        <button
                          className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20'
                          onClick={() => openCostModal(reward)}
                          title='Editar custo'
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Redeemed History */}
            <div>
              <h3 className='mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white'>
                <div className='h-2 w-2 rounded-full bg-slate-300' />
                Histórico de Resgates
              </h3>
              <div className='space-y-3 opacity-60'>
                {rewardsData.filter((r) => r.status === 'redeemed').length === 0 ? (
                  <p className='text-slate-400 text-sm italic'>Nenhum resgate realizado ainda.</p>
                ) : (
                  rewardsData
                    .filter((r) => r.status === 'redeemed')
                    .map((reward) => (
                      <div
                        className='flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50'
                        key={reward.id}
                      >
                        <div>
                          <h4 className='font-bold text-slate-700 line-through dark:text-slate-300'>
                            {reward.title}
                          </h4>
                          <span className='font-bold text-[10px] text-slate-400 uppercase'>
                            {reward.category} • {reward.cost} pts
                          </span>
                        </div>
                        <CheckCircle2 className='text-slate-400' size={18} />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cost Modal */}
        {isCostModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm'>
            <div className='zoom-in-95 w-full max-w-sm animate-in rounded-3xl bg-white p-6 shadow-2xl duration-200 dark:bg-slate-900'>
              <div className='mb-6 flex items-center justify-between'>
                <h3 className='font-bold text-lg text-slate-800 dark:text-white'>Definir Custo</h3>
                <button
                  className='rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  onClick={() => setIsCostModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className='mb-6'>
                <p className='mb-2 text-slate-500 text-sm dark:text-slate-400'>
                  Quanto deve custar esta recompensa?
                </p>
                <div className='mb-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800'>
                  <p className='mb-1 font-bold text-slate-800 dark:text-white'>
                    {editingReward?.title}
                  </p>
                  <span className='font-bold text-slate-400 text-xs uppercase'>
                    {editingReward?.category}
                  </span>
                </div>
                <div className='relative'>
                  <input
                    autoFocus
                    className='w-full rounded-2xl border-2 border-indigo-100 bg-white p-4 text-center font-black text-2xl outline-none transition-colors focus:border-indigo-500 dark:border-indigo-900/50 dark:bg-slate-950'
                    onChange={(e) => setRewardCost(e.target.value)}
                    placeholder='0'
                    type='number'
                    value={rewardCost}
                  />
                  <span className='-translate-y-1/2 absolute top-1/2 right-4 font-bold text-slate-400 text-sm'>
                    PTS
                  </span>
                </div>
              </div>

              <button
                className='flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-indigo-200 shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] dark:shadow-none'
                onClick={saveRewardCost}
              >
                <Save size={20} />
                Salvar Valor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
