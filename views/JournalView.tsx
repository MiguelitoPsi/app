'use client'

import { ArrowLeft, BookOpen, Brain, Save, Sparkles } from 'lucide-react'
import type React from 'react'
import { useId, useState } from 'react'
import { XP_REWARDS } from '@/lib/xp'
import { trpc } from '@/lib/trpc/client'
import { useGame } from '../context/GameContext'
import { analyzeThought } from '../services/geminiService'
import type { Mood } from '../types'

type JournalViewProps = {
  goHome: () => void
}

export const JournalView: React.FC<JournalViewProps> = ({ goHome }) => {
  const { addJournalEntry, journal } = useGame()
  console.log('JournalView journal data:', journal)
  const utils = trpc.useUtils()
  const thoughtId = useId()
  const emotionId = useId()
  const customEmotionId = useId()
  const intensityId = useId()

  const [step, setStep] = useState(1)
  const [emotion, setEmotion] = useState<Mood>('neutral')
  const [customEmotion, setCustomEmotion] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [thought, setThought] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  const markFeedbackAsViewedMutation = trpc.journal.markFeedbackAsViewed.useMutation({
    onSuccess: () => {
      utils.journal.getUnviewedFeedbackCount.invalidate()
      utils.journal.getAll.invalidate()
    },
  })

  const handleExpandEntry = (entry: any) => {
    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null)
    } else {
      setExpandedEntryId(entry.id)
      if (entry.therapistFeedback && !entry.feedbackViewed) {
        markFeedbackAsViewedMutation.mutate({ entryId: entry.id })
      }
    }
  }

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
    { id: 'neutral', emoji: '😕', label: 'Confuso' },
    { id: 'sad', emoji: '😔', label: 'Triste' },
    { id: 'anxious', emoji: '😰', label: 'Ansioso' },
    { id: 'angry', emoji: '😡', label: 'Bravo' },
  ]

  return (
    <div className='flex h-full flex-col bg-slate-50 dark:bg-slate-950'>
      {/* Live region for status announcements */}
      <div aria-atomic='true' aria-live='polite' className='sr-only'>
        {isAnalyzing && 'Analisando seu pensamento com inteligência artificial...'}
        {step === 2 && aiResult && 'Análise concluída. Insight terapêutico disponível.'}
      </div>

      {/* Header Section */}
      <header className='z-10 rounded-b-[1.5rem] bg-white px-4 pt-safe pb-4 shadow-sm sm:rounded-b-[2rem] sm:px-6 sm:pt-8 sm:pb-6 dark:bg-slate-900'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <button
              aria-label='Voltar para página inicial'
              className='touch-target flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-colors active:scale-95 hover:bg-slate-200 sm:h-10 sm:w-10 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
              onClick={goHome}
              type='button'
            >
              <ArrowLeft
                aria-hidden='true'
                className='text-slate-600 dark:text-slate-300'
                size={18}
              />
            </button>
            <div>
              <h1 className='font-black text-xl text-slate-800 tracking-tight sm:text-2xl dark:text-white'>
                Diário <span className="text-xs text-red-500">DEBUG: V2</span>
              </h1>
              <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Registre seus pensamentos
              </p>
            </div>
          </div>
          <div
            aria-hidden='true'
            className='flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-600 sm:h-10 sm:w-10 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
          >
            <BookOpen className='sm:hidden' size={18} />
            <BookOpen className='hidden sm:block' size={20} />
          </div>
        </div>
      </header>

      <main
        className='flex-1 overflow-y-auto px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32'
        id='main-content'
      >
        {step === 1 && (
          <form
            className='slide-in-from-bottom-4 animate-in space-y-4 duration-500 sm:space-y-6'
            onSubmit={(e) => {
              e.preventDefault()
              handleAnalyze()
            }}
          >
            {/* Automatic Thought (Now First) */}
            <div className='space-y-2'>
              <label
                className='ml-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'
                htmlFor={thoughtId}
              >
                Pensamento Automático
              </label>
              <textarea
                aria-describedby={`${thoughtId}-hint`}
                className='w-full rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-800 leading-relaxed shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:rounded-3xl sm:p-5 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-900/20'
                id={thoughtId}
                onChange={(e) => setThought(e.target.value)}
                placeholder='O que está passando pela sua cabeça agora?'
                required
                rows={5}
                value={thought}
              />
              <p className='sr-only' id={`${thoughtId}-hint`}>
                Descreva o pensamento que está tendo. Quanto mais detalhes, melhor será a análise.
              </p>
            </div>

            {/* Emotion */}
            <fieldset className='space-y-2 sm:space-y-3'>
              <legend
                className='ml-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs'
                id={emotionId}
              >
                Como você se sente?
              </legend>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {moods.map((m) => {
                  const isSelected = emotion === m.id && !customEmotion.trim()
                  return (
                    <button
                      aria-label={`${m.label}${isSelected ? ' (selecionado)' : ''}`}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all duration-300 sm:gap-2 sm:rounded-2xl sm:p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'scale-105 border-violet-500 bg-violet-50 text-violet-700 shadow-md dark:bg-violet-900/20 dark:text-violet-300'
                          : 'border-transparent bg-white text-slate-400 active:scale-95 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800'
                      }
                      `}
                      key={m.id}
                      onClick={() => {
                        setEmotion(m.id)
                        setCustomEmotion('')
                      }}
                      type='button'
                    >
                      <span
                        aria-hidden='true'
                        className='text-2xl drop-shadow-sm filter sm:text-3xl'
                      >
                        {m.emoji}
                      </span>
                      <span className='font-bold text-[10px] sm:text-xs'>{m.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom Emotion Name */}
              <div className='mt-3 sm:mt-4'>
                <label
                  className='ml-1 mb-1.5 block font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:mb-2 sm:text-xs'
                  htmlFor={customEmotionId}
                >
                  Ou descreva sua emoção (opcional)
                </label>
                <input
                  className='w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-900/20'
                  id={customEmotionId}
                  maxLength={50}
                  onChange={(e) => {
                    setCustomEmotion(e.target.value)
                    if (e.target.value.trim()) {
                      setEmotion('neutral')
                    }
                  }}
                  placeholder='Ex: frustrado, esperançoso, confuso...'
                  type='text'
                  value={customEmotion}
                />
              </div>

              <div className='mt-3 rounded-xl border border-slate-100 bg-white p-3 sm:mt-4 sm:rounded-2xl sm:p-4 dark:border-slate-800 dark:bg-slate-900'>
                <div className='mb-2 flex justify-between font-bold text-slate-500 text-[10px] sm:mb-3 sm:text-xs dark:text-slate-400'>
                  <label htmlFor={intensityId}>Intensidade</label>
                  <output
                    aria-live='polite'
                    className='rounded-md bg-violet-50 px-2 py-0.5 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                    htmlFor={intensityId}
                  >
                    {intensity}
                  </output>
                </div>
                <input
                  aria-label={`Intensidade do sentimento: ${intensity} de 10`}
                  aria-valuemax={10}
                  aria-valuemin={1}
                  aria-valuenow={intensity}
                  className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-violet-600 dark:bg-slate-800'
                  id={intensityId}
                  max='10'
                  min='1'
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  type='range'
                  value={intensity}
                />
              </div>
            </fieldset>

            {/* Actions */}
            <div className='space-y-2 pt-2 sm:space-y-3 sm:pt-4'>
              <button
                aria-describedby='analyze-hint'
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 font-bold text-sm text-white shadow-lg shadow-violet-200 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-violet-200/50 hover:shadow-xl sm:rounded-2xl sm:py-4 sm:text-base dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2'
                disabled={!thought || isAnalyzing}
                type='submit'
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles aria-hidden='true' className='animate-spin' size={18} />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <Brain aria-hidden='true' size={18} />
                    <span>Analisar com IA</span>
                  </>
                )}
              </button>
              <p className='sr-only' id='analyze-hint'>
                A inteligência artificial irá analisar seu pensamento e fornecer insights
                terapêuticos.
              </p>

              <button
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-sm text-slate-600 transition-all active:scale-[0.98] hover:bg-slate-50 sm:rounded-2xl sm:py-4 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'
                onClick={handleSave}
                type='button'
              >
                <Save aria-hidden='true' size={16} />
                <span>Salvar sem análise (+{XP_REWARDS.journal} XP)</span>
              </button>
            </div>
          </form>
        )}

        {step === 2 && aiResult && (
          <div className='fade-in zoom-in animate-in space-y-4 duration-300 sm:space-y-6'>
            <article
              aria-labelledby='insight-heading'
              className='relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-violet-100/50 shadow-xl sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none'
            >
              <div
                aria-hidden='true'
                className='-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl sm:h-32 sm:w-32'
              />

              <div className='relative z-10'>
                <div className='mb-3 flex items-center gap-2 text-violet-600 sm:mb-4 sm:gap-3 dark:text-violet-400'>
                  <div
                    aria-hidden='true'
                    className='rounded-lg bg-violet-100 p-1.5 sm:rounded-xl sm:p-2 dark:bg-violet-900/30'
                  >
                    <Sparkles size={18} />
                  </div>
                  <h2 className='font-bold text-base sm:text-lg' id='insight-heading'>
                    Insight Terapêutico
                  </h2>
                </div>
                <div className='space-y-2 font-medium text-slate-700 text-xs leading-relaxed sm:text-sm dark:text-slate-300'>
                  {aiResult.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </article>

            <button
              className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-sm text-white shadow-lg transition-transform active:scale-[0.98] hover:scale-[1.02] sm:rounded-2xl sm:py-4 sm:text-base dark:bg-white dark:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'
              onClick={handleSave}
              type='button'
            >
              <Save aria-hidden='true' size={18} />
              <span>Salvar Insight (+{XP_REWARDS.journal} XP)</span>
            </button>
          </div>
        )}

        {/* Journal History Section */}
        <section className='mt-8 border-slate-100 border-t pt-8 dark:border-slate-800'>
          <h2 className='mb-4 font-bold text-lg text-slate-800 sm:mb-6 sm:text-xl dark:text-white'>
            Seus Registros Anteriores
          </h2>
          <div className='space-y-4'>
            {journal.length === 0 ? (
              <div className='rounded-2xl border border-slate-100 bg-white p-6 text-center sm:p-8 dark:border-slate-800 dark:bg-slate-900'>
                <p className='text-slate-500 dark:text-slate-400'>
                  Você ainda não tem registros no diário.
                </p>
              </div>
            ) : (
              journal.map((entry) => (
                <article
                  key={entry.id}
                  className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-slate-900 ${
                    entry.therapistFeedback && !entry.feedbackViewed
                      ? 'border-emerald-200 shadow-emerald-100/50 shadow-lg ring-1 ring-emerald-100 dark:border-emerald-900/50 dark:shadow-none dark:ring-emerald-900/30'
                      : 'border-slate-100 shadow-sm hover:shadow-md dark:border-slate-800'
                  }`}
                >
                  <button
                    onClick={() => handleExpandEntry(entry)}
                    className='w-full text-left'
                  >
                    <div className='flex items-start justify-between p-4 sm:p-5'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-2xl dark:bg-slate-800'>
                          {moods.find((m) => m.id === entry.emotion)?.emoji || '😐'}
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold text-slate-700 text-sm dark:text-slate-300'>
                              {new Date(entry.timestamp).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                            {entry.therapistFeedback && !entry.feedbackViewed && (
                              <span className='rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-[10px] text-emerald-600 uppercase tracking-wider dark:bg-emerald-900/30 dark:text-emerald-400'>
                                Novo Feedback
                              </span>
                            )}
                          </div>
                          <p className='mt-1 line-clamp-1 text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                            {entry.thought}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {expandedEntryId === entry.id && (
                    <div className='border-slate-100 border-t bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/50'>
                      <div className='space-y-4'>
                        <div>
                          <h4 className='mb-1 font-bold text-slate-400 text-xs uppercase tracking-wider'>
                            Pensamento
                          </h4>
                          <p className='text-slate-700 text-sm leading-relaxed dark:text-slate-300'>
                            {entry.thought}
                          </p>
                        </div>

                        {entry.aiAnalysis && (
                          <div className='rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20'>
                            <h4 className='mb-1 flex items-center gap-1.5 font-bold text-violet-600 text-xs uppercase tracking-wider dark:text-violet-400'>
                              <Sparkles size={12} /> Insight da IA
                            </h4>
                            <p className='text-slate-700 text-sm leading-relaxed dark:text-slate-300'>
                              {entry.aiAnalysis}
                            </p>
                          </div>
                        )}

                        {entry.therapistFeedback && (
                          <div className='rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/30 dark:bg-emerald-900/20'>
                            <h4 className='mb-1 flex items-center gap-1.5 font-bold text-emerald-600 text-xs uppercase tracking-wider dark:text-emerald-400'>
                              <Brain size={12} /> Feedback do Terapeuta
                            </h4>
                            <p className='text-slate-700 text-sm leading-relaxed dark:text-slate-300'>
                              {entry.therapistFeedback}
                            </p>
                            {entry.feedbackAt && (
                              <p className='mt-2 text-emerald-600/60 text-[10px] dark:text-emerald-400/60'>
                                Enviado em{' '}
                                {new Date(entry.feedbackAt).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
