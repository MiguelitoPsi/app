// ============================================
// Feature Definitions for Subscription Plans
// ============================================
// These define ALL possible features that admins can toggle per plan.
// Admin UI reads this to show the feature configuration form.
// Code reads this against a plan's `features` JSONB for gating.

export interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number";
  default: boolean | number;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "ai_analysis",
    label: "Análise com IA",
    description:
      "Acesso às análises de IA (análise de pensamentos, dados do paciente, etc).",
    type: "boolean",
    default: false,
  },
  {
    key: "transcription",
    label: "Transcrição de sessões",
    description: "Upload e transcrição automática de áudio/vídeo das sessões.",
    type: "boolean",
    default: false,
  },
  {
    key: "weekly_reports",
    label: "Relatórios semanais",
    description: "Geração automática de relatórios semanais dos pacientes.",
    type: "boolean",
    default: false,
  },
  {
    key: "cognitive_conceptualization",
    label: "Conceituação cognitiva",
    description: "Ferramenta de conceituação cognitiva com assistente IA.",
    type: "boolean",
    default: false,
  },
  {
    key: "financial_module",
    label: "Módulo financeiro",
    description:
      "Acesso ao módulo financeiro completo (receitas, despesas, metas).",
    type: "boolean",
    default: false,
  },
  {
    key: "session_documents",
    label: "Documentos de sessão",
    description: "Upload e gerenciamento de documentos das sessões.",
    type: "boolean",
    default: false,
  },
  {
    key: "custom_tasks_for_patients",
    label: "Tarefas personalizadas",
    description: "Criar e atribuir tarefas personalizadas para pacientes.",
    type: "boolean",
    default: true,
  },
  {
    key: "max_uploads_month",
    label: "Uploads por mês",
    description:
      "Quantidade máxima de uploads de arquivos por mês. 0 = ilimitado.",
    type: "number",
    default: 10,
  },
  {
    key: "therapeutic_plan",
    label: "Plano terapêutico IA",
    description: "Geração de planos terapêuticos com assistência de IA.",
    type: "boolean",
    default: false,
  },
];

/**
 * Returns a map of feature key to its default value.
 * Used to initialize new plans with sensible defaults.
 */
export function getDefaultFeatures(): Record<string, boolean | number> {
  const defaults: Record<string, boolean | number> = {};
  for (const def of FEATURE_DEFINITIONS) {
    defaults[def.key] = def.default;
  }
  return defaults;
}

/**
 * Returns the feature definition for a specific key.
 */
export function getFeatureDefinition(
  key: string,
): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS.find((d) => d.key === key);
}
