'use client'

import { ArrowLeft, BookOpen, Brain, Save, Sparkles } from 'lucide-react'
import type React from 'react'
import { useId, useRef, useState } from 'react'
import { HelpButton } from '@/components/HelpButton'
import { XPAnimationContainer } from '@/components/XPAnimation/XPAnimationContainer'
import { useSound } from '@/hooks/useSound'
import { useXPAnimation } from '@/hooks/useXPAnimation'
import { trpc } from '@/lib/trpc/client'
import { XP_REWARDS } from '@/lib/xp'
import { useGame } from '../context/GameContext'
import { analyzeThought } from '../services/geminiService'
import type { Mood } from '../types'

type JournalViewProps = {
  goHome: () => void
}

export const JournalView: React.FC<JournalViewProps> = ({ goHome }) => {
  const { addJournalEntry } = useGame()
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
  const [isSaving, setIsSaving] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)

  // Query para verificar se pode ganhar XP
  const { data: xpStatus } = trpc.journal.getXpStatus.useQuery()
  const canEarnXp = xpStatus?.canEarnXp ?? true

  // XP Animation
  const { particles, triggerAnimation } = useXPAnimation()
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const analyzeButtonRef = useRef<HTMLButtonElement>(null)

  // Sound effects
  const { playJournal, playClick, playSuccess } = useSound()

  const handleAnalyze = async () => {
    playClick()
    setIsAnalyzing(true)
    // Situation removed, passing only emotion and thought
    const analysis = await analyzeThought(emotion, thought)
    setAiResult(analysis)
    setIsAnalyzing(false)
    playSuccess()
    setStep(2) // Move to result view
  }

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent multiple clicks
    if (isSaving) return
    setIsSaving(true)

    // Play journal save sound
    playJournal()

    // Trigger animation from button position only if user can earn XP
    if (canEarnXp && e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Trigger both XP and Points animations with slight delay
      triggerAnimation(XP_REWARDS.journal, 'xp', centerX, centerY)
      setTimeout(() => {
        triggerAnimation(XP_REWARDS.journal, 'pts', centerX, centerY)
      }, 100)
    }

    // Save journal entry with AI analysis (if available)
    await addJournalEntry({
      emotion,
      intensity,
      thought,
      aiAnalysis: aiResult || undefined,
    })

    // Invalidate XP status after saving
    await utils.journal.getXpStatus.invalidate()

    // Delay navigation to show animation (or less delay if no animation)
    setTimeout(
      () => {
        goHome()
      },
      canEarnXp ? 400 : 200
    )
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
    <>
      <XPAnimationContainer particles={particles} />
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
                  Diário de Pensamentos
                </h1>
                <p className='font-medium text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                  Registre seus pensamentos
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <HelpButton screenId='journal' />
              <button
                aria-label='Ver registros anteriores'
                className='flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-300 bg-violet-100 text-violet-700 shadow-md shadow-violet-200/50 transition-all hover:bg-violet-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-300/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm sm:h-11 sm:w-11 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-300 dark:shadow-violet-900/30 dark:hover:bg-violet-900/60 dark:hover:border-violet-600'
                onClick={() => {
                  window.location.href = '/journal/history'
                }}
                type='button'
              >
                <BookOpen className='sm:hidden' size={18} />
                <BookOpen className='hidden sm:block' size={20} />
              </button>
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
                  disabled={!thought || isAnalyzing || isSaving}
                  ref={analyzeButtonRef}
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
                      <span>
                        {canEarnXp
                          ? `Analisar com IA (+${XP_REWARDS.journal} XP & Pts.)`
                          : 'Analisar com IA'}
                      </span>
                    </>
                  )}
                </button>
                <p className='sr-only' id='analyze-hint'>
                  A inteligência artificial irá analisar seu pensamento e fornecer insights
                  terapêuticos.
                </p>

                <button
                  className='touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-sm text-slate-600 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 sm:rounded-2xl sm:py-4 sm:text-base dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'
                  disabled={!(thought.trim() && emotion && intensity) || isSaving || isAnalyzing}
                  onClick={(e) => handleSave(e)}
                  ref={saveButtonRef}
                  type='button'
                >
                  <Save aria-hidden='true' size={16} />
                  <span>
                    {isSaving
                      ? 'Salvando...'
                      : canEarnXp
                        ? `Salvar sem análise (+${XP_REWARDS.journal} XP & Pts.)`
                        : 'Salvar sem análise'}
                  </span>
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
                className='touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-sm text-white shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] sm:rounded-2xl sm:py-4 sm:text-base dark:bg-white dark:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2'
                disabled={isSaving}
                onClick={(e) => handleSave(e)}
                type='button'
              >
                <Save aria-hidden='true' size={18} />
                <span>
                  {isSaving
                    ? 'Salvando...'
                    : canEarnXp
                      ? `Salvar Insight (+${XP_REWARDS.journal} XP)`
                      : 'Salvar Insight'}
                </span>
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
