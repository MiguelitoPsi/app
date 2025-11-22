"use client";

import { ArrowLeft, BookOpen, Brain, Save, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { XP_REWARDS } from "@/lib/xp";
import { useGame } from "../context/GameContext";
import { analyzeThought } from "../services/geminiService";
import type { Mood } from "../types";

type JournalViewProps = {
  goHome: () => void;
};

export const JournalView: React.FC<JournalViewProps> = ({ goHome }) => {
  const { addJournalEntry } = useGame();

  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState<Mood>("neutral");
  const [intensity, setIntensity] = useState(5);
  const [thought, setThought] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Situation removed, passing only emotion and thought
    const analysis = await analyzeThought(emotion, thought);
    setAiResult(analysis);
    setIsAnalyzing(false);
    setStep(2); // Move to result view
  };

  const handleSave = () => {
    addJournalEntry({
      emotion,
      intensity,
      thought,
      aiAnalysis: aiResult || undefined,
    });
    goHome();
  };

  const moods: { id: Mood; emoji: string; label: string }[] = [
    { id: "happy", emoji: "😄", label: "Feliz" },
    { id: "calm", emoji: "😌", label: "Calmo" },
    { id: "neutral", emoji: "😐", label: "Neutro" },
    { id: "sad", emoji: "😔", label: "Triste" },
    { id: "anxious", emoji: "😰", label: "Ansioso" },
    { id: "angry", emoji: "😡", label: "Bravo" },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header Section */}
      <div className="z-10 rounded-b-[2rem] bg-white px-6 pt-8 pb-6 shadow-sm dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={goHome}
            >
              <ArrowLeft
                className="text-slate-600 dark:text-slate-300"
                size={20}
              />
            </button>
            <div>
              <h2 className="font-black text-2xl text-slate-800 tracking-tight dark:text-white">
                Diário
              </h2>
              <p className="font-medium text-slate-500 text-sm dark:text-slate-400">
                Registre seus pensamentos
              </p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
            <BookOpen size={20} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {step === 1 && (
          <div className="slide-in-from-bottom-4 animate-in space-y-6 duration-500">
            {/* Automatic Thought (Now First) */}
            <div className="space-y-2">
              <label className="ml-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
                Pensamento Automático
              </label>
              <textarea
                className="w-full rounded-3xl border border-slate-100 bg-white p-5 text-base text-slate-800 leading-relaxed shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-900/20"
                onChange={(e) => setThought(e.target.value)}
                placeholder="O que está passando pela sua cabeça agora?"
                rows={6}
                value={thought}
              />
            </div>

            {/* Emotion */}
            <div className="space-y-3">
              <label className="ml-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
                Como você se sente?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {moods.map((m) => (
                  <button
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all duration-300 ${
                      emotion === m.id
                        ? "scale-105 border-violet-500 bg-violet-50 text-violet-700 shadow-md dark:bg-violet-900/20 dark:text-violet-300"
                        : "border-transparent bg-white text-slate-400 hover:scale-105 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800"
                    }
                    `}
                    key={m.id}
                    onClick={() => setEmotion(m.id)}
                  >
                    <span className="text-3xl drop-shadow-sm filter">
                      {m.emoji}
                    </span>
                    <span className="font-bold text-xs">{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex justify-between font-bold text-slate-500 text-xs dark:text-slate-400">
                  <span>Intensidade</span>
                  <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                    {intensity}
                  </span>
                </div>
                <input
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-violet-600 dark:bg-slate-800"
                  max="10"
                  min="1"
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  type="range"
                  value={intensity}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 font-bold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-violet-200/50 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
                disabled={!thought || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="animate-spin" size={20} />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    Analisar com IA
                  </>
                )}
              </button>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={handleSave}
              >
                <Save size={18} />
                Salvar sem análise (+{XP_REWARDS.journal} XP & Pts)
              </button>
            </div>
          </div>
        )}

        {step === 2 && aiResult && (
          <div className="fade-in zoom-in animate-in space-y-6 duration-300">
            <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-6 shadow-violet-100/50 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="-mr-10 -mt-10 absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-3 text-violet-600 dark:text-violet-400">
                  <div className="rounded-xl bg-violet-100 p-2 dark:bg-violet-900/30">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-bold text-lg">Insight Terapêutico</h3>
                </div>
                <div className="space-y-2 font-medium text-slate-700 text-sm leading-relaxed dark:text-slate-300">
                  {aiResult.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
              onClick={handleSave}
            >
              <Save size={20} />
              Salvar Insight (+{XP_REWARDS.journal} XP & Pts)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
