import { GoogleGenAI } from "@google/genai";
import { buildAnalyzePatientDataPrompt } from "@shared/ai/prompts";
import { NextResponse } from "next/server";

// API key validation helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Regex pattern for JSON extraction
const JSON_EXTRACT_REGEX = /\{[\s\S]*\}/;

// Types for input data
type JournalEntry = {
  id: string;
  content: string;
  mood?: string;
  tags?: string[];
  aiAnalysis?: string;
  createdAt: string | Date;
};

type TranscriptionSegment = {
  text: string;
  isTherapist?: boolean;
  emotion?: string;
};

type Transcription = {
  id: string;
  text?: string;
  segments?: TranscriptionSegment[];
  createdAt: string | Date;
};

type MoodEntry = {
  mood: string;
  note?: string;
  createdAt: string | Date;
};

type PatientDocument = {
  id: string;
  fileName: string;
  description?: string;
  sessionDate?: string | Date;
};

type PatientInfo = {
  name: string;
  birthDate?: string | Date;
  gender?: string;
};

type AnalyzePatientDataInput = {
  patientInfo: PatientInfo;
  journalEntries: JournalEntry[];
  transcriptions: Transcription[];
  moodHistory: MoodEntry[];
  documents: PatientDocument[];
};

// Output types for AI suggestions
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

type AnalyzePatientDataOutput = {
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

/**
 * POST /api/analyze-patient-data
 * Analyzes patient data using Gemini to generate suggestions for cognitive conceptualization.
 */
export async function POST(request: Request) {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.error("GEMINI_API_KEY is not configured or is a placeholder");
      return NextResponse.json(
        {
          error:
            "A API do Gemini não está configurada. Por favor, configure a GEMINI_API_KEY no arquivo .env.local",
        },
        { status: 503 },
      );
    }

    const data: AnalyzePatientDataInput = await request.json();

    // Validate minimum data
    const totalDataPoints =
      data.journalEntries.length +
      data.transcriptions.length +
      data.moodHistory.length;

    if (totalDataPoints === 0) {
      return NextResponse.json({
        childhoodSuggestions: [],
        beliefSuggestions: [],
        assumptionSuggestions: [],
        strategySuggestions: [],
        situationSuggestions: [],
        patientSummary: "Não há dados suficientes para análise.",
        dataQuality: {
          hasEnoughData: false,
          journalCount: 0,
          transcriptionCount: 0,
          moodCount: 0,
          suggestions: [
            "Adicione registros de diário do paciente",
            "Faça upload de transcrições de sessões",
            "Incentive o paciente a registrar seu humor diariamente",
          ],
        },
      } satisfies AnalyzePatientDataOutput);
    }

    // Prepare data summary for AI
    const journalSummary = data.journalEntries
      .slice(0, 20) // Limit to recent entries
      .map((e, i) => {
        const date = new Date(e.createdAt).toLocaleDateString("pt-BR");
        return `[Diário ${i + 1} - ${date}] Humor: ${e.mood || "N/A"}\nConteúdo: ${e.content}\n${e.aiAnalysis ? `Análise IA: ${e.aiAnalysis}` : ""}`;
      })
      .join("\n\n");

    const transcriptionSummary = data.transcriptions
      .slice(0, 10)
      .map((t, i) => {
        const date = new Date(t.createdAt).toLocaleDateString("pt-BR");
        let content = "";
        if (t.segments && t.segments.length > 0) {
          content = t.segments
            .filter((s) => !s.isTherapist)
            .map((s) => s.text)
            .join(" ");
        } else if (t.text) {
          content = t.text.slice(0, 2000);
        }
        return `[Transcrição ${i + 1} - ${date}]\n${content}`;
      })
      .join("\n\n");

    const moodSummary = data.moodHistory
      .slice(0, 30)
      .map((m) => {
        const date = new Date(m.createdAt).toLocaleDateString("pt-BR");
        return `${date}: ${m.mood}${m.note ? ` - ${m.note}` : ""}`;
      })
      .join("\n");
    const prompt = buildAnalyzePatientDataPrompt({
      patientName: data.patientInfo.name,
      birthDateLine: data.patientInfo.birthDate
        ? `Data de nascimento: ${new Date(data.patientInfo.birthDate).toLocaleDateString("pt-BR")}`
        : undefined,
      genderLine: data.patientInfo.gender
        ? `Gênero: ${data.patientInfo.gender}`
        : undefined,
      journalEntryCount: data.journalEntries.length,
      journalSummary,
      transcriptionCount: data.transcriptions.length,
      transcriptionSummary,
      moodCount: data.moodHistory.length,
      moodSummary,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";

    // Extract JSON from response
    const jsonMatch = JSON_EXTRACT_REGEX.exec(responseText);
    if (!jsonMatch) {
      console.error(
        "Failed to extract JSON from Gemini response:",
        responseText,
      );
      return NextResponse.json(
        { error: "Não foi possível processar a resposta da IA" },
        { status: 500 },
      );
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // Add data quality info
    const result: AnalyzePatientDataOutput = {
      childhoodSuggestions: aiResult.childhoodSuggestions || [],
      beliefSuggestions: aiResult.beliefSuggestions || [],
      assumptionSuggestions: aiResult.assumptionSuggestions || [],
      strategySuggestions: aiResult.strategySuggestions || [],
      situationSuggestions: aiResult.situationSuggestions || [],
      patientSummary: aiResult.patientSummary || "",
      dataQuality: {
        hasEnoughData: totalDataPoints >= 3,
        journalCount: data.journalEntries.length,
        transcriptionCount: data.transcriptions.length,
        moodCount: data.moodHistory.length,
        suggestions:
          totalDataPoints < 5
            ? [
                "Mais dados melhoram a precisão das sugestões",
                data.journalEntries.length < 3
                  ? "Incentive o paciente a fazer mais registros de diário"
                  : "",
                data.transcriptions.length < 2
                  ? "Adicione mais transcrições de sessões"
                  : "",
              ].filter(Boolean)
            : [],
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in analyze-patient-data:", error);
    return NextResponse.json(
      { error: `Erro ao analisar dados: ${errorMessage}` },
      { status: 500 },
    );
  }
}
