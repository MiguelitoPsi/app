import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// API key validation helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Regex pattern for JSON extraction (defined at module level for performance)
const JSON_EXTRACT_REGEX = /\{[\s\S]*\}/;

type SituationData = {
  situation: string;
  automaticThought: string;
  meaningOfAT: string;
  emotion: string;
  behavior: string;
};

type CognitiveConceptualizationInput = {
  patientName?: string;
  childhoodData?: string;
  coreBelief?: string;
  conditionalAssumptions?: string;
  compensatoryStrategies?: string;
  situations?: {
    situation1?: SituationData;
    situation2?: SituationData;
    situation3?: SituationData;
  };
  notes?: string;
};

type TherapeuticPlanResponse = {
  objectives: string[];
  interventions: Array<{
    technique: string;
    description: string;
    targetBelief?: string;
  }>;
  suggestedActivities: string[];
  estimatedDuration: string;
  observations: string;
  generatedAt: string;
};

/**
 * POST /api/generate-therapeutic-plan
 * Generates a therapeutic plan based on cognitive conceptualization using Gemini.
 */
export async function POST(request: Request) {
  try {
    // Validate API key first
    const ai = getGeminiClient();
    if (!ai) {
      console.error("GEMINI_API_KEY is not configured or is a placeholder");
      return NextResponse.json(
        {
          error:
            "A API do Gemini não está configurada. Por favor, configure a GEMINI_API_KEY no arquivo .env.local",
        },
        { status: 503 }
      );
    }

    const data: CognitiveConceptualizationInput = await request.json();

    // Validate required fields
    const hasCoreBelief = Boolean(data.coreBelief);
    const hasChildhoodData = Boolean(data.childhoodData);
    const hasRequiredData = hasCoreBelief || hasChildhoodData;
    if (!hasRequiredData) {
      return NextResponse.json(
        {
          error:
            "A conceituação cognitiva precisa ter pelo menos a crença central ou dados de infância preenchidos",
        },
        { status: 400 }
      );
    }

    // Build the prompt with all available data
    const situationsText = data.situations
      ? Object.entries(data.situations)
          .filter(([, sit]) => sit?.situation)
          .map(
            ([_key, sit], index) => `
          Situação ${index + 1}:
          - Situação: ${sit?.situation || "Não informado"}
          - Pensamento Automático: ${sit?.automaticThought || "Não informado"}
          - Significado do PA: ${sit?.meaningOfAT || "Não informado"}
          - Emoção: ${sit?.emotion || "Não informado"}
          - Comportamento: ${sit?.behavior || "Não informado"}
        `
          )
          .join("\n")
      : "Nenhuma situação registrada";

    const prompt = `
Você é um psicólogo especialista em Terapia Cognitiva Baseada em Recuperação (CT-R) com vasta experiência clínica.

A CT-R é uma adaptação da TCC tradicional que mantém os fundamentos do modelo cognitivo, mas acrescenta ênfase na:
- Formulação cognitiva das CRENÇAS ADAPTATIVAS e estratégias comportamentais saudáveis do paciente
- Identificação dos fatores que MANTÊM um humor positivo
- PONTOS FORTES, qualidades pessoais, habilidades e recursos do paciente (em vez de focar apenas em sintomas e psicopatologia)

Com base na conceituação cognitiva de um paciente, você deve criar um plano terapêutico que fortaleça as capacidades existentes e promova o florescimento.

## DADOS DA CONCEITUAÇÃO COGNITIVA:

**Nome do Paciente:** ${data.patientName || "Não informado"}

**Dados Relevantes da Infância:**
${data.childhoodData || "Não informado"}

**Crença Central:**
${data.coreBelief || "Não informada"}

**Suposições Condicionais/Regras:**
${data.conditionalAssumptions || "Não informadas"}

**Estratégias Compensatórias:**
${data.compensatoryStrategies || "Não informadas"}

**Situações Registradas:**
${situationsText}

**Observações Adicionais:**
${data.notes || "Nenhuma"}

## INSTRUÇÕES (Abordagem CT-R):

Crie um plano terapêutico detalhado e prático que inclua:

1. **Objetivos Terapêuticos**: 3-5 objetivos específicos, mensuráveis e alcançáveis que FORTALEÇAM os recursos e capacidades do paciente
2. **Intervenções e Técnicas**: 4-6 técnicas de CT-R/TCC que trabalhem TANTO as crenças limitantes QUANTO fortaleçam as crenças adaptativas e recursos existentes
3. **Atividades Sugeridas**: 3-5 atividades práticas que ampliem os pontos fortes do paciente e promovam experiências de sucesso
4. **Duração Estimada**: Uma estimativa do tempo de tratamento
5. **Observações**: Considerações importantes, incluindo pontos fortes identificados e como utilizá-los no tratamento

## FORMATO DE RESPOSTA (JSON ESTRITO):

Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:

{
  "objectives": [
    "Objetivo 1 específico e mensurável",
    "Objetivo 2 específico e mensurável",
    "Objetivo 3 específico e mensurável"
  ],
  "interventions": [
    {
      "technique": "Nome da Técnica de TCC",
      "description": "Descrição detalhada de como aplicar a técnica",
      "targetBelief": "Qual crença ou padrão essa técnica visa modificar"
    }
  ],
  "suggestedActivities": [
    "Atividade 1 prática para entre as sessões",
    "Atividade 2 prática para entre as sessões"
  ],
  "estimatedDuration": "Exemplo: 12-16 sessões (3-4 meses)",
  "observations": "Considerações importantes para o tratamento, possíveis desafios e recomendações"
}

IMPORTANTE: 
- Responda APENAS em português brasileiro
- O JSON deve ser válido e completo
- Seja específico e prático nas recomendações
- Utilize técnicas de CT-R e TCC (reestruturação cognitiva, registro de pensamentos, experimentos comportamentais, ativação comportamental baseada em valores, identificação de forças, etc.)
- Enfatize SEMPRE os pontos fortes, recursos e crenças adaptativas do paciente
- O plano deve ser orientado para RECUPERAÇÃO e FLORESCIMENTO, não apenas redução de sintomas
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const responseText = response.text || "";

    // Parse the JSON response
    let plan: Omit<TherapeuticPlanResponse, "generatedAt">;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(JSON_EXTRACT_REGEX);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json(
        {
          error:
            "Não foi possível processar a resposta da IA. Tente novamente.",
        },
        { status: 500 }
      );
    }

    // Add generation timestamp
    const fullPlan: TherapeuticPlanResponse = {
      ...plan,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(fullPlan);
  } catch (error) {
    console.error("Error generating therapeutic plan:", error);
    return NextResponse.json(
      {
        error:
          "Desculpe, não foi possível gerar o plano terapêutico. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
