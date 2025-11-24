'use client'

import { ArrowLeft, BookOpen, Brain, Save, Sparkles } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { XP_REWARDS } from '@/lib/xp'
import { useGame } from '../context/GameContext'
import { analyzeThought } from '../services/geminiService'
import type { Mood } from '../types'

type JournalViewProps = {
  goHome: () => void
}

export const JournalView: React.FC<JournalViewProps> = ({ goHome }) => {
  const { addJournalEntry } = useGame()

  const [step, setStep] = useState(1)
  const [emotion, setEmotion] = useState<Mood>('neutral')
  const [intensity, setIntensity] = useState(5)
  const [thought, setThought] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Situation removed, passing only emotion and thought
    const analysis = await analyzeThought(emotion, thought)
    setAiResult(analysis)
    setIsAnalyzing(false)
    setStep(2) // Move to result view
  }

  const handleSave = () => {
    addJournalEntry({
      emotion,
      intensity,
      thought,
      aiAnalysis: aiResult || undefined,
    })
    goHome()
  }

  const moods: { id: Mood; emoji: string; label: string }[] = [
    { id: 'happy', emoji: '😄', label: 'Feliz' },
    { id: 'calm', emoji: '😌', label: 'Calmo' },
    { id: 'neutral', emoji: '😐', label: 'Neutro' },
    { id: 'sad', emoji: '😔', label: 'Triste' },
    { id: 'anxious', emoji: '😰', label: 'Ansioso' },
    { id: 'angry', emoji: '😡', label: 'Bravo' },
  ]

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Header Section */}
      <div className='z-10 rounded-b-[1.5rem] bg-white px-4 pt-safe pb-4 shadow-sm sm:rounded-b-[2rem] sm:px-6 sm:pt-8 sm:pb-6 dark:bg-slate-900'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <button
              className='touch-target flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-colors active:scale-95 hover:bg-slate-200 sm:h-10 sm:w-10 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
              onClick={goHome}
              type='button'
            >
              <ArrowLeft className='text-slate-600 dark:text-slate-300' size={18} />
            </button>
            <div>
              <h2 className='font-black text-xl text-slate-800 tracking-tight sm:text-2xl dark:text-white'>
                Diário
              </h2>
              <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Registre seus pensamentos
              </p>
            </div>
          </div>
          <div className='flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-600 sm:h-10 sm:w-10 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400'>
            <BookOpen className='sm:hidden' size={18} />
            <BookOpen className='hidden sm:block' size={20} />
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32'>
        {step === 1 && (
          <div className='slide-in-from-bottom-4 animate-in space-y-4 duration-500 sm:space-y-6'>
            {/* Automatic Thought (Now First) */}
            <div className='space-y-2'>
              <label className='ml-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'>
                Pensamento Automático
              </label>
              <textarea
                className='w-full rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-800 leading-relaxed shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:rounded-3xl sm:p-5 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-900/20'
                onChange={(e) => setThought(e.target.value)}
                placeholder='O que está passando pela sua cabeça agora?'
                rows={5}
                value={thought}
              />
            </div>

            {/* Emotion */}
            <div className='space-y-2 sm:space-y-3'>
              <label className='ml-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'>
                Como você se sente?
              </label>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {moods.map((m) => (
                  <button
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all duration-300 sm:gap-2 sm:rounded-2xl sm:p-3 ${
                      emotion === m.id
                        ? 'scale-105 border-violet-500 bg-violet-50 text-violet-700 shadow-md dark:bg-violet-900/20 dark:text-violet-300'
                        : 'border-transparent bg-white text-slate-400 active:scale-95 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800'
                    }
                    `}
                    key={m.id}
                    onClick={() => setEmotion(m.id)}
                    type='button'
                  >
                    <span className='text-2xl drop-shadow-sm filter sm:text-3xl'>{m.emoji}</span>
                    <span className='font-bold text-[10px] sm:text-xs'>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className='mt-3 rounded-xl border border-slate-100 bg-white p-3 sm:mt-4 sm:rounded-2xl sm:p-4 dark:border-slate-800 dark:bg-slate-900'>
                <div className='mb-2 flex justify-between font-bold text-slate-500 text-[10px] sm:mb-3 sm:text-xs dark:text-slate-400'>
                  <span>Intensidade</span>
                  <span className='rounded-md bg-violet-50 px-2 py-0.5 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
                    {intensity}
                  </span>
                </div>
                <input
                  className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-violet-600 dark:bg-slate-800'
                  max='10'
                  min='1'
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  type='range'
                  value={intensity}
                />
              </div>
            </div>

            {/* Actions */}
            <div className='space-y-2 pt-2 sm:space-y-3 sm:pt-4'>
              <button
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 font-bold text-sm text-white shadow-lg shadow-violet-200 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-violet-200/50 hover:shadow-xl sm:rounded-2xl sm:py-4 sm:text-base dark:shadow-none'
                disabled={!thought || isAnalyzing}
                onClick={handleAnalyze}
                type='button'
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className='animate-spin' size={18} />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain size={18} />
                    Analisar com IA
                  </>
                )}
              </button>

              <button
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-sm text-slate-600 transition-all active:scale-[0.98] hover:bg-slate-50 sm:rounded-2xl sm:py-4 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                onClick={handleSave}
                type='button'
              >
                <Save size={16} />
                Salvar sem análise (+{XP_REWARDS.journal} XP)
              </button>
            </div>
          </div>
        )}

        {step === 2 && aiResult && (
          <div className='fade-in zoom-in animate-in space-y-4 duration-300 sm:space-y-6'>
            <div className='relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-violet-100/50 shadow-xl sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none'>
              <div className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl sm:h-32 sm:w-32' />

              <div className='relative z-10'>
                <div className='mb-3 flex items-center gap-2 text-violet-600 sm:mb-4 sm:gap-3 dark:text-violet-400'>
                  <div className='rounded-lg bg-violet-100 p-1.5 sm:rounded-xl sm:p-2 dark:bg-violet-900/30'>
                    <Sparkles size={18} />
                  </div>
                  <h3 className='font-bold text-base sm:text-lg'>Insight Terapêutico</h3>
                </div>
                <div className='space-y-2 font-medium text-slate-700 text-xs leading-relaxed sm:text-sm dark:text-slate-300'>
                  {aiResult.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <button
              className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-sm text-white shadow-lg transition-transform active:scale-[0.98] hover:scale-[1.02] sm:rounded-2xl sm:py-4 sm:text-base dark:bg-white dark:text-slate-900'
              onClick={handleSave}
              type='button'
            >
              <Save size={18} />
              Salvar Insight (+{XP_REWARDS.journal} XP)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
