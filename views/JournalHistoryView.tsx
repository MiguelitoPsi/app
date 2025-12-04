'use client'

import { ArrowLeft, Brain, Calendar, Eye, MessageSquare, Sparkles } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { HelpButton } from '@/components/HelpButton'
import type { Mood } from '../types'

type JournalHistoryViewProps = {
  goBack: () => void
}

export const JournalHistoryView: React.FC<JournalHistoryViewProps> = ({ goBack }) => {
  const { journal } = useGame()
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [filterMood, setFilterMood] = useState<Mood | 'all'>('all')

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
      neutral: '😕',
    }
    return map[mood] || '😕'
  }

  const filteredJournal = filterMood === 'all' 
    ? journal 
    : journal.filter(entry => entry.emotion === filterMood)

  const sortedJournal = [...filteredJournal].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header */}
      <header className='border-slate-200 border-b bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            <button
              aria-label='Voltar'
              className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:scale-95 sm:h-10 sm:w-10 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              onClick={goBack}
              type='button'
            >
              <ArrowLeft className='sm:hidden' size={18} />
              <ArrowLeft className='hidden sm:block' size={20} />
            </button>
            <div>
              <h1 className='font-black text-slate-800 text-xl tracking-tight sm:text-2xl dark:text-white'>
                Registros Anteriores
              </h1>
              <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                {sortedJournal.length} {sortedJournal.length === 1 ? 'registro' : 'registros'}
              </p>
            </div>
          </div>
          <HelpButton screenId="journal-history" />
        </div>

        {/* Mood Filter */}
        <div className='mt-4 flex gap-2 overflow-x-auto pb-2'>
          <button
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              filterMood === 'all'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
            onClick={() => setFilterMood('all')}
            type='button'
          >
            Todos
          </button>
          {(['happy', 'calm', 'neutral', 'sad', 'anxious', 'angry'] as Mood[]).map((mood) => (
            <button
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                filterMood === mood
                  ? getMoodColor(mood)
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              key={mood}
              onClick={() => setFilterMood(mood)}
              type='button'
            >
              {getMoodEmoji(mood)} {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Journal List */}
      <main className='flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28 sm:space-y-4 sm:px-6 sm:py-6 sm:pb-32'>
        {sortedJournal.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-white py-12 text-center sm:rounded-3xl sm:py-16 dark:border-slate-800 dark:bg-slate-900'>
            <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-20 sm:w-20 dark:bg-slate-800 dark:text-slate-600'>
              <MessageSquare className='sm:hidden' size={32} />
              <MessageSquare className='hidden sm:block' size={40} />
            </div>
            <h4 className='mb-1 font-bold text-slate-700 text-sm sm:text-base dark:text-slate-300'>
              Nenhum registro encontrado
            </h4>
            <p className='text-slate-400 text-xs sm:text-sm dark:text-slate-500'>
              {filterMood === 'all' 
                ? 'Você ainda não fez nenhum registro.'
                : 'Nenhum registro com esta emoção.'}
            </p>
          </div>
        ) : (
          sortedJournal.map((entry) => {
            const isExpanded = expandedEntryId === entry.id
            const hasNewFeedback = entry.therapistFeedback && !entry.feedbackViewed

            return (
              <article
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-slate-900 ${
                  hasNewFeedback
                    ? 'border-emerald-200 shadow-emerald-100/50 shadow-lg ring-1 ring-emerald-100 dark:border-emerald-900/50 dark:shadow-none dark:ring-emerald-900/30'
                    : 'border-slate-100 shadow-sm hover:shadow-md dark:border-slate-800'
                }`}
                key={entry.id}
              >
                <button
                  className='w-full p-4 text-left transition-colors hover:bg-slate-50 sm:p-5 dark:hover:bg-slate-800/50'
                  onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                  type='button'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${getMoodColor(
                          entry.emotion
                        )}`}
                      >
                        {getMoodEmoji(entry.emotion)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                          <span className='font-bold text-slate-700 text-xs uppercase dark:text-slate-300'>
                            {entry.emotion}
                          </span>
                          {hasNewFeedback && (
                            <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
                              Novo Feedback
                            </span>
                          )}
                        </div>
                        <p className='line-clamp-2 text-slate-600 text-sm dark:text-slate-400'>
                          {entry.thought}
                        </p>
                        <div className='mt-2 flex items-center gap-2 text-slate-400 text-xs'>
                          <Calendar size={12} />
                          {new Date(entry.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <Eye
                      className={`shrink-0 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      size={18}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className='space-y-4 border-slate-100 border-t p-4 sm:p-5 dark:border-slate-800'>
                    {/* Thought */}
                    <div>
                      <h3 className='mb-2 flex items-center gap-1.5 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                        <MessageSquare size={12} />
                        Pensamento
                      </h3>
                      <p className='text-slate-700 text-sm italic leading-relaxed dark:text-slate-300'>
                        "{entry.thought}"
                      </p>
                    </div>

                    {/* AI Analysis */}
                    {entry.aiAnalysis && (
                      <div className='relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
                        <div className='-mr-6 -mt-6 absolute top-0 right-0 h-12 w-12 rounded-full bg-indigo-200/20' />
                        <div className='relative z-10 mb-2 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400'>
                          <Brain size={14} />
                          <span className='font-black text-xs uppercase tracking-wider'>
                            Análise IA
                          </span>
                        </div>
                        <p className='relative z-10 font-medium text-indigo-800 text-xs leading-relaxed dark:text-indigo-200'>
                          {entry.aiAnalysis}
                        </p>
                      </div>
                    )}

                    {/* Therapist Feedback */}
                    {entry.therapistFeedback && (
                      <div className='relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10'>
                        <div className='-mr-6 -mt-6 absolute top-0 right-0 h-12 w-12 rounded-full bg-emerald-200/20' />
                        <div className='relative z-10 mb-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                          <Sparkles size={14} />
                          <span className='font-black text-xs uppercase tracking-wider'>
                            Feedback do Terapeuta
                          </span>
                        </div>
                        <p className='relative z-10 font-medium text-emerald-800 text-xs leading-relaxed dark:text-emerald-200'>
                          {entry.therapistFeedback}
                        </p>
                        {entry.feedbackAt && (
                          <p className='relative z-10 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400'>
                            Enviado em {new Date(entry.feedbackAt).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(entry.feedbackAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })
        )}
      </main>
    </div>
  )
}
