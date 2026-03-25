"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Scale,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

// Types for AI suggestions
type SituationSuggestion = {
  id: string;
  sourceType: "journal" | "transcription" | "manual";
  sourceId?: string;
  sourceDate?: string;
  situation: string;
  automaticThought: string;
  meaningOfAT: string;
  emotion: string;
  behavior: string;
  confidence: number;
  originalExcerpt?: string;
};

type BeliefSuggestion = {
  id: string;
  belief: string;
  justification: string;
  supportingEvidence: string[];
  confidence: number;
};

type AssumptionSuggestion = {
  id: string;
  assumption: string;
  category: "conditional" | "rule" | "attitude";
  relatedBelief?: string;
  confidence: number;
};

type StrategySuggestion = {
  id: string;
  strategy: string;
  category: "avoidance" | "compensation" | "submission" | "other";
  examples: string[];
  confidence: number;
};

type ChildhoodDataSuggestion = {
  id: string;
  content: string;
  sourceType: "journal" | "transcription" | "inferred";
  sourceExcerpt?: string;
  confidence: number;
};

type AISuggestions = {
  childhoodSuggestions: ChildhoodDataSuggestion[];
  beliefSuggestions: BeliefSuggestion[];
  assumptionSuggestions: AssumptionSuggestion[];
  strategySuggestions: StrategySuggestion[];
  situationSuggestions: SituationSuggestion[];
  patientSummary: string;
  dataQuality: {
    hasEnoughData: boolean;
    journalCount: number;
    transcriptionCount: number;
    moodCount: number;
    suggestions: string[];
  };
};

type SituationData = {
  situation: string;
  automaticThought: string;
  meaningOfAT: string;
  emotion: string;
  behavior: string;
};

type CognitiveFormData = {
  name: string;
  date: string;
  childhoodData: string;
  coreBelief: string;
  conditionalAssumptions: string;
  compensatoryStrategies: string;
  situation1: SituationData;
  situation2: SituationData;
  situation3: SituationData;
  notes: string;
};

const emptySituation: SituationData = {
  situation: "",
  automaticThought: "",
  meaningOfAT: "",
  emotion: "",
  behavior: "",
};

const initialFormData: CognitiveFormData = {
  name: "Conceituação Cognitiva",
  date: new Date().toISOString().split("T")[0],
  childhoodData: "",
  coreBelief: "",
  conditionalAssumptions: "",
  compensatoryStrategies: "",
  situation1: { ...emptySituation },
  situation2: { ...emptySituation },
  situation3: { ...emptySituation },
  notes: "",
};

const EMOTIONS = [
  "Ansiedade",
  "Tristeza",
  "Raiva",
  "Medo",
  "Culpa",
  "Vergonha",
  "Frustração",
  "Desespero",
  "Solidão",
  "Insegurança",
  "Alegria",
  "Alívio",
  "Esperança",
  "Outro",
];

const STEP_TITLES = [
  "Carregando dados...",
  "Dados de Infância",
  "Crença Central",
  "Suposições Condicionais",
  "Estratégias Compensatórias",
  "Situações",
  "Revisão Final",
];

type CognitiveConceptualizationWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onComplete?: () => void;
};

export function CognitiveConceptualizationWizard({
  isOpen,
  onClose,
  patientId,
  patientName,
  onComplete,
}: CognitiveConceptualizationWizardProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Buscando dados do paciente...",
  );
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(
    null,
  );
  const [formData, setFormData] = useState<CognitiveFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Selected items state
  const [selectedChildhood, setSelectedChildhood] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBelief, setSelectedBelief] = useState<string | null>(null);
  const [selectedAssumptions, setSelectedAssumptions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSituations, setSelectedSituations] = useState<
    (string | null)[]
  >([null, null, null]);

  // Expanded states for accordions
  const [expandedSituation, setExpandedSituation] = useState<0 | 1 | 2>(0);

  // tRPC queries
  const { data: journalEntries } = trpc.journal.getAll.useQuery(
    { userId: patientId },
    { enabled: isOpen && !!patientId },
  );

  const { data: transcriptions } = trpc.transcription.getByPatient.useQuery(
    { patientId },
    { enabled: isOpen && !!patientId },
  );

  const { data: moodHistory } =
    trpc.therapistReports.getPatientMoodHistory.useQuery(
      { patientId, limit: 50 },
      { enabled: isOpen && !!patientId },
    );

  const { data: documents } =
    trpc.therapistReports.getPatientDocuments.useQuery(
      { patientId, limit: 20 },
      { enabled: isOpen && !!patientId },
    );

  const { data: patientInfo } = trpc.patient.getById.useQuery(
    { id: patientId },
    { enabled: isOpen && !!patientId },
  );

  const utils = trpc.useUtils();

  const saveMutation =
    trpc.therapistReports.saveCognitiveConceptualization.useMutation({
      onSuccess: () => {
        utils.therapistReports.getCognitiveConceptualization.invalidate();
        toast.success("Conceituação cognitiva salva com sucesso!");
        setIsSaving(false);
        onComplete?.();
        onClose();
      },
      onError: (error) => {
        toast.error(`Erro ao salvar: ${error.message}`);
        setIsSaving(false);
      },
    });

  // Analyze patient data when all queries are ready
  useEffect(() => {
    if (!isOpen) return;

    const allQueriesReady =
      journalEntries !== undefined &&
      transcriptions !== undefined &&
      moodHistory !== undefined &&
      documents !== undefined &&
      patientInfo !== undefined;

    if (allQueriesReady && isLoading && step === 0) {
      const runAnalysis = async () => {
        try {
          setLoadingMessage("Organizando registros...");
          await new Promise((r) => setTimeout(r, 500));

          setLoadingMessage("Analisando padrões cognitivos...");

          const response = await fetch("/api/analyze-patient-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientInfo: {
                name: patientName,
                birthDate: patientInfo?.birthdate,
                gender: patientInfo?.gender,
              },
              journalEntries: journalEntries || [],
              transcriptions: transcriptions || [],
              moodHistory: moodHistory || [],
              documents: documents || [],
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao analisar dados");
          }

          const suggestions: AISuggestions = await response.json();
          setAiSuggestions(suggestions);

          setLoadingMessage("Preparando sugestões...");
          await new Promise((r) => setTimeout(r, 300));

          setIsLoading(false);
          setStep(1);
        } catch (error) {
          console.error("Error analyzing patient data:", error);
          toast.error("Erro ao analisar dados do paciente");
          setIsLoading(false);
          setStep(1);
          setAiSuggestions({
            childhoodSuggestions: [],
            beliefSuggestions: [],
            assumptionSuggestions: [],
            strategySuggestions: [],
            situationSuggestions: [],
            patientSummary: "",
            dataQuality: {
              hasEnoughData: false,
              journalCount: journalEntries?.length || 0,
              transcriptionCount: transcriptions?.length || 0,
              moodCount: moodHistory?.length || 0,
              suggestions: [
                "Ocorreu um erro na análise. Você pode preencher manualmente.",
              ],
            },
          });
        }
      };
      runAnalysis();
    }
  }, [
    isOpen,
    journalEntries,
    transcriptions,
    moodHistory,
    documents,
    patientInfo,
    isLoading,
    step,
    patientName,
  ]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsLoading(true);
      setLoadingMessage("Buscando dados do paciente...");
      setFormData({
        ...initialFormData,
        name: `Conceituação - ${patientName}`,
      });
      setSelectedChildhood(new Set());
      setSelectedBelief(null);
      setSelectedAssumptions(new Set());
      setSelectedStrategies(new Set());
      setSelectedSituations([null, null, null]);
      setAiSuggestions(null);
    }
  }, [isOpen, patientName]);

  // Update form data when selections change
  useEffect(() => {
    if (!aiSuggestions) return;

    // Update childhood data
    const childhoodTexts = aiSuggestions.childhoodSuggestions
      .filter((s) => selectedChildhood.has(s.id))
      .map((s) => s.content);
    if (childhoodTexts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        childhoodData: childhoodTexts.join("\n\n"),
      }));
    }

    // Update core belief
    if (selectedBelief) {
      const belief = aiSuggestions.beliefSuggestions.find(
        (b) => b.id === selectedBelief,
      );
      if (belief) {
        setFormData((prev) => ({
          ...prev,
          coreBelief: belief.belief,
        }));
      }
    }

    // Update assumptions
    const assumptionTexts = aiSuggestions.assumptionSuggestions
      .filter((a) => selectedAssumptions.has(a.id))
      .map((a) => a.assumption);
    if (assumptionTexts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        conditionalAssumptions: assumptionTexts.join("\n"),
      }));
    }

    // Update strategies
    const strategyTexts = aiSuggestions.strategySuggestions
      .filter((s) => selectedStrategies.has(s.id))
      .map((s) => `${s.strategy}: ${s.examples.join(", ")}`);
    if (strategyTexts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        compensatoryStrategies: strategyTexts.join("\n"),
      }));
    }

    // Update situations
    selectedSituations.forEach((sitId, index) => {
      if (sitId) {
        const situation = aiSuggestions.situationSuggestions.find(
          (s) => s.id === sitId,
        );
        if (situation) {
          const key = `situation${index + 1}` as
            | "situation1"
            | "situation2"
            | "situation3";
          setFormData((prev) => ({
            ...prev,
            [key]: {
              situation: situation.situation,
              automaticThought: situation.automaticThought,
              meaningOfAT: situation.meaningOfAT,
              emotion: situation.emotion,
              behavior: situation.behavior,
            },
          }));
        }
      }
    });
  }, [
    aiSuggestions,
    selectedChildhood,
    selectedBelief,
    selectedAssumptions,
    selectedStrategies,
    selectedSituations,
  ]);

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate({
      patientId,
      name: formData.name,
      date: new Date(formData.date),
      childhoodData: formData.childhoodData,
      coreBelief: formData.coreBelief,
      conditionalAssumptions: formData.conditionalAssumptions,
      compensatoryStrategies: formData.compensatoryStrategies,
      situations: {
        situation1: formData.situation1.situation
          ? formData.situation1
          : undefined,
        situation2: formData.situation2.situation
          ? formData.situation2
          : undefined,
        situation3: formData.situation3.situation
          ? formData.situation3
          : undefined,
      },
      notes: formData.notes,
    });
  };

  const canProceed = useCallback(() => {
    switch (step) {
      case 1: // Childhood
        return formData.childhoodData.trim().length > 0;
      case 2: // Core belief
        return formData.coreBelief.trim().length > 0;
      case 3: // Assumptions
        return formData.conditionalAssumptions.trim().length > 0;
      case 4: // Strategies
        return formData.compensatoryStrategies.trim().length > 0;
      case 5: // Situations
        return (
          formData.situation1.situation.trim().length > 0 ||
          formData.situation2.situation.trim().length > 0 ||
          formData.situation3.situation.trim().length > 0
        );
      default:
        return true;
    }
  }, [step, formData]);

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleChildhoodSelection = (id: string) => {
    setSelectedChildhood((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAssumptionSelection = (id: string) => {
    setSelectedAssumptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStrategySelection = (id: string) => {
    setSelectedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectSituation = (index: 0 | 1 | 2, situationId: string | null) => {
    setSelectedSituations((prev) => {
      const next = [...prev];
      next[index] = situationId;
      return next;
    });
  };

  const updateSituationField = (
    index: 0 | 1 | 2,
    field: keyof SituationData,
    value: string,
  ) => {
    const key = `situation${index + 1}` as
      | "situation1"
      | "situation2"
      | "situation3";
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800 relative animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Conceituação Cognitiva
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {patientName}
              </p>
            </div>
          </div>
          <button
            aria-label="Fechar"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Etapa {step} de 6
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {STEP_TITLES[step]}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0: Loading */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full border-4 border-purple-200 dark:border-purple-900" />
                <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-purple-500" />
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                {loadingMessage}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Analisando dados com IA para gerar sugestões personalizadas
              </p>
            </div>
          )}

          {/* Step 1: Childhood Data */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Dados Relevantes de Infância
                </h3>
              </div>

              {aiSuggestions &&
              aiSuggestions.childhoodSuggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selecione os dados identificados que são relevantes:
                  </p>
                  {aiSuggestions.childhoodSuggestions.map((suggestion) => (
                    <button
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedChildhood.has(suggestion.id)
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                      }`}
                      key={suggestion.id}
                      onClick={() => toggleChildhoodSelection(suggestion.id)}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selectedChildhood.has(suggestion.id)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedChildhood.has(suggestion.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {suggestion.content}
                          </p>
                          {suggestion.sourceExcerpt && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-300 pl-2">
                              "{suggestion.sourceExcerpt}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                suggestion.sourceType === "journal"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : suggestion.sourceType === "transcription"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {suggestion.sourceType === "journal"
                                ? "Diário"
                                : suggestion.sourceType === "transcription"
                                  ? "Sessão"
                                  : "Inferido"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Confiança: {suggestion.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Não foram encontrados dados de infância nos registros. Você
                    pode adicionar manualmente abaixo.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Pencil className="inline h-4 w-4 mr-1" />
                  Editar / Adicionar dados de infância:
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      childhoodData: e.target.value,
                    }))
                  }
                  placeholder="Descreva eventos, experiências e dados relevantes da infância do paciente..."
                  rows={5}
                  value={formData.childhoodData}
                />
              </div>
            </div>
          )}

          {/* Step 2: Core Belief */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Crença Central
                </h3>
              </div>

              {aiSuggestions && aiSuggestions.beliefSuggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selecione a crença central mais adequada ou escreva uma
                    personalizada:
                  </p>
                  {aiSuggestions.beliefSuggestions.map((suggestion) => (
                    <button
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedBelief === suggestion.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                      }`}
                      key={suggestion.id}
                      onClick={() => setSelectedBelief(suggestion.id)}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedBelief === suggestion.id
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedBelief === suggestion.id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            "{suggestion.belief}"
                          </p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {suggestion.justification}
                          </p>
                          {suggestion.supportingEvidence.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {suggestion.supportingEvidence.map(
                                (evidence, i) => (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    key={i}
                                  >
                                    {evidence}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                          <span className="inline-block mt-2 text-xs text-slate-400">
                            Confiança: {suggestion.confidence}%
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedBelief === "custom"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                    }`}
                    onClick={() => setSelectedBelief("custom")}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedBelief === "custom"
                            ? "border-purple-500 bg-purple-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {selectedBelief === "custom" && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-slate-600 dark:text-slate-300">
                        <Plus className="inline h-4 w-4 mr-1" />
                        Escrever crença personalizada
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Não foi possível identificar crenças centrais nos dados. Por
                    favor, adicione manualmente.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Pencil className="inline h-4 w-4 mr-1" />
                  {selectedBelief === "custom"
                    ? "Escreva a crença central:"
                    : "Refinar crença:"}
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      coreBelief: e.target.value,
                    }))
                  }
                  placeholder="Ex: 'Eu sou incompetente', 'Eu sou indigno de amor'..."
                  rows={3}
                  value={formData.coreBelief}
                />
              </div>
            </div>
          )}

          {/* Step 3: Conditional Assumptions */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Suposições Condicionais / Regras
                </h3>
              </div>

              {aiSuggestions &&
              aiSuggestions.assumptionSuggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selecione as suposições condicionais e regras identificadas:
                  </p>
                  {aiSuggestions.assumptionSuggestions.map((suggestion) => (
                    <button
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedAssumptions.has(suggestion.id)
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-amber-300"
                      }`}
                      key={suggestion.id}
                      onClick={() => toggleAssumptionSelection(suggestion.id)}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selectedAssumptions.has(suggestion.id)
                              ? "border-amber-500 bg-amber-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedAssumptions.has(suggestion.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            "{suggestion.assumption}"
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                suggestion.category === "conditional"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                                  : suggestion.category === "rule"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30"
                              }`}
                            >
                              {suggestion.category === "conditional"
                                ? "Condicional"
                                : suggestion.category === "rule"
                                  ? "Regra"
                                  : "Atitude"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Confiança: {suggestion.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Não foram identificadas suposições condicionais. Adicione
                    manualmente.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Pencil className="inline h-4 w-4 mr-1" />
                  Editar / Adicionar suposições:
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-700 dark:text-slate-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      conditionalAssumptions: e.target.value,
                    }))
                  }
                  placeholder="Ex: 'Se eu errar, serei rejeitado'&#10;'Devo sempre agradar os outros'&#10;'Se mostrar fraqueza, serão aproveitados de mim'"
                  rows={5}
                  value={formData.conditionalAssumptions}
                />
              </div>
            </div>
          )}

          {/* Step 4: Compensatory Strategies */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-sky-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Estratégias Compensatórias
                </h3>
              </div>

              {aiSuggestions && aiSuggestions.strategySuggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selecione as estratégias compensatórias observadas:
                  </p>
                  {aiSuggestions.strategySuggestions.map((suggestion) => (
                    <button
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedStrategies.has(suggestion.id)
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-sky-300"
                      }`}
                      key={suggestion.id}
                      onClick={() => toggleStrategySelection(suggestion.id)}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selectedStrategies.has(suggestion.id)
                              ? "border-sky-500 bg-sky-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedStrategies.has(suggestion.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            {suggestion.strategy}
                          </p>
                          {suggestion.examples.length > 0 && (
                            <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
                              {suggestion.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                suggestion.category === "avoidance"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                                  : suggestion.category === "compensation"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                                    : suggestion.category === "submission"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                                      : "bg-slate-100 text-slate-700 dark:bg-slate-700/50"
                              }`}
                            >
                              {suggestion.category === "avoidance"
                                ? "Evitação"
                                : suggestion.category === "compensation"
                                  ? "Compensação"
                                  : suggestion.category === "submission"
                                    ? "Submissão"
                                    : "Outro"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Confiança: {suggestion.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Não foram identificadas estratégias compensatórias. Adicione
                    manualmente.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Pencil className="inline h-4 w-4 mr-1" />
                  Editar / Adicionar estratégias:
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      compensatoryStrategies: e.target.value,
                    }))
                  }
                  placeholder="Ex: Evitação de situações sociais&#10;Perfeccionismo excessivo&#10;Procrastinação&#10;Isolamento"
                  rows={5}
                  value={formData.compensatoryStrategies}
                />
              </div>
            </div>
          )}

          {/* Step 5: Situations */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Situações (até 3)
                </h3>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Adicione situações específicas com pensamentos automáticos,
                emoções e comportamentos. Você pode selecionar registros
                existentes ou preencher manualmente.
              </p>

              {[0, 1, 2].map((index) => {
                const situationKey = `situation${index + 1}` as
                  | "situation1"
                  | "situation2"
                  | "situation3";
                const situationData = formData[situationKey];
                const isExpanded = expandedSituation === index;
                const hasSuggestions =
                  aiSuggestions &&
                  aiSuggestions.situationSuggestions.filter(
                    (s) =>
                      !selectedSituations.includes(s.id) ||
                      selectedSituations[index] === s.id,
                  ).length > 0;

                return (
                  <div
                    className={`rounded-xl border-2 transition-all ${
                      situationData.situation
                        ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    key={index}
                  >
                    <button
                      className="w-full flex items-center justify-between p-4"
                      onClick={() => setExpandedSituation(index as 0 | 1 | 2)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            situationData.situation
                              ? "bg-green-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          {situationData.situation ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-800 dark:text-white">
                            Situação {index + 1}
                          </p>
                          {situationData.situation && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">
                              {situationData.situation}
                            </p>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4">
                        {/* Suggestions from AI */}
                        {hasSuggestions && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              Selecionar de registros identificados:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {aiSuggestions?.situationSuggestions
                                .filter(
                                  (s) =>
                                    !selectedSituations.includes(s.id) ||
                                    selectedSituations[index] === s.id,
                                )
                                .slice(0, 5)
                                .map((suggestion) => (
                                  <button
                                    className={`text-left p-3 rounded-lg border transition-all max-w-xs ${
                                      selectedSituations[index] ===
                                      suggestion.id
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : "border-slate-200 dark:border-slate-700 hover:border-green-300"
                                    }`}
                                    key={suggestion.id}
                                    onClick={() =>
                                      selectSituation(
                                        index as 0 | 1 | 2,
                                        selectedSituations[index] ===
                                          suggestion.id
                                          ? null
                                          : suggestion.id,
                                      )
                                    }
                                    type="button"
                                  >
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                      {suggestion.situation}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {suggestion.sourceDate} •{" "}
                                      {suggestion.emotion}
                                    </p>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                            {selectedSituations[index]
                              ? "Editar dados:"
                              : "Preencher manualmente:"}
                          </p>

                          <div className="grid gap-4">
                            <div>
                              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                Situação
                              </label>
                              <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                onChange={(e) =>
                                  updateSituationField(
                                    index as 0 | 1 | 2,
                                    "situation",
                                    e.target.value,
                                  )
                                }
                                placeholder="Descreva a situação..."
                                type="text"
                                value={situationData.situation}
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                Pensamento Automático
                              </label>
                              <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                onChange={(e) =>
                                  updateSituationField(
                                    index as 0 | 1 | 2,
                                    "automaticThought",
                                    e.target.value,
                                  )
                                }
                                placeholder="O que passou pela mente..."
                                type="text"
                                value={situationData.automaticThought}
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                Significado do P.A.
                              </label>
                              <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                onChange={(e) =>
                                  updateSituationField(
                                    index as 0 | 1 | 2,
                                    "meaningOfAT",
                                    e.target.value,
                                  )
                                }
                                placeholder="O que isso significa para o paciente..."
                                type="text"
                                value={situationData.meaningOfAT}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                  Emoção
                                </label>
                                <select
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                  onChange={(e) =>
                                    updateSituationField(
                                      index as 0 | 1 | 2,
                                      "emotion",
                                      e.target.value,
                                    )
                                  }
                                  value={situationData.emotion}
                                >
                                  <option value="">Selecione...</option>
                                  {EMOTIONS.map((emotion) => (
                                    <option key={emotion} value={emotion}>
                                      {emotion}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                                  Comportamento
                                </label>
                                <input
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                  onChange={(e) =>
                                    updateSituationField(
                                      index as 0 | 1 | 2,
                                      "behavior",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="O que fez..."
                                  type="text"
                                  value={situationData.behavior}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Revisão Final
                </h3>
              </div>

              {/* Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {formData.name}
                    </h4>
                    <p className="text-sm text-slate-500">{formData.date}</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-500" />
                </div>

                {/* Childhood Data */}
                {formData.childhoodData && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
                        Dados de Infância
                      </h5>
                      <button
                        className="text-xs text-purple-500 hover:text-purple-600"
                        onClick={() => setStep(1)}
                        type="button"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {formData.childhoodData}
                    </p>
                  </div>
                )}

                {/* Core Belief */}
                {formData.coreBelief && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-purple-700 dark:text-purple-400 uppercase">
                        Crença Central
                      </h5>
                      <button
                        className="text-xs text-purple-500 hover:text-purple-600"
                        onClick={() => setStep(2)}
                        type="button"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      "{formData.coreBelief}"
                    </p>
                  </div>
                )}

                {/* Assumptions */}
                {formData.conditionalAssumptions && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
                        Suposições Condicionais
                      </h5>
                      <button
                        className="text-xs text-amber-500 hover:text-amber-600"
                        onClick={() => setStep(3)}
                        type="button"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {formData.conditionalAssumptions}
                    </p>
                  </div>
                )}

                {/* Strategies */}
                {formData.compensatoryStrategies && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
                        Estratégias Compensatórias
                      </h5>
                      <button
                        className="text-xs text-sky-500 hover:text-sky-600"
                        onClick={() => setStep(4)}
                        type="button"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {formData.compensatoryStrategies}
                    </p>
                  </div>
                )}

                {/* Situations Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Situações
                    </h5>
                    <button
                      className="text-xs text-green-500 hover:text-green-600"
                      onClick={() => setStep(5)}
                      type="button"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-300 dark:border-slate-700">
                          <th className="text-left py-2 text-slate-500 font-medium">
                            #
                          </th>
                          <th className="text-left py-2 text-slate-500 font-medium">
                            Situação
                          </th>
                          <th className="text-left py-2 text-slate-500 font-medium">
                            P.A.
                          </th>
                          <th className="text-left py-2 text-slate-500 font-medium">
                            Emoção
                          </th>
                          <th className="text-left py-2 text-slate-500 font-medium">
                            Comportamento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          formData.situation1,
                          formData.situation2,
                          formData.situation3,
                        ].map(
                          (sit, idx) =>
                            sit.situation && (
                              <tr
                                className="border-b border-slate-200 dark:border-slate-700"
                                key={idx}
                              >
                                <td className="py-2 text-slate-600 dark:text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-2 text-slate-700 dark:text-slate-300">
                                  {sit.situation}
                                </td>
                                <td className="py-2 text-slate-700 dark:text-slate-300">
                                  {sit.automaticThought}
                                </td>
                                <td className="py-2 text-slate-700 dark:text-slate-300">
                                  {sit.emotion}
                                </td>
                                <td className="py-2 text-slate-700 dark:text-slate-300">
                                  {sit.behavior}
                                </td>
                              </tr>
                            ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Anotações adicionais..."
                    rows={3}
                    value={formData.notes}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={step === 1}
              onClick={handleBack}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-3">
              {step < 6 ? (
                <button
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canProceed()}
                  onClick={handleNext}
                  type="button"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                  disabled={isSaving}
                  onClick={handleSave}
                  type="button"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Conceituação
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
