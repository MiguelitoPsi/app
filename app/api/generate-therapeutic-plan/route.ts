import { GoogleGenAI } from '@google/genai'
import { buildTherapeuticPlanPrompt } from '@shared/ai/prompts'
import { NextResponse } from 'next/server'

// API key validation helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.trim() === '') {
    return null
  }
  return new GoogleGenAI({ apiKey })
}

// Regex pattern for JSON extraction (defined at module level for performance)
const JSON_EXTRACT_REGEX = /\{[\s\S]*\}/

interface SituationData {
  situation: string
  automaticThought: string
  meaningOfAT: string
  emotion: string
  behavior: string
}

interface CognitiveConceptualizationInput {
  patientName?: string
  childhoodData?: string
  coreBelief?: string
  conditionalAssumptions?: string
  compensatoryStrategies?: string
  situations?: {
    situation1?: SituationData
    situation2?: SituationData
    situation3?: SituationData
  }
  notes?: string
}

interface TherapeuticPlanResponse {
  objectives: string[]
  interventions: Array<{
    technique: string
    description: string
    targetBelief?: string
  }>
  suggestedActivities: string[]
  estimatedDuration: string
  observations: string
  generatedAt: string
}

/**
 * POST /api/generate-therapeutic-plan
 * Generates a therapeutic plan based on cognitive conceptualization using Gemini.
 */
export async function POST(request: Request) {
  try {
    // Validate API key first
    const ai = getGeminiClient()
    if (!ai) {
      console.error('GEMINI_API_KEY is not configured or is a placeholder')
      return NextResponse.json(
        {
          error:
            'A API do Gemini não está configurada. Por favor, configure a GEMINI_API_KEY no arquivo .env.local',
        },
        { status: 503 }
      )
    }

    const data: CognitiveConceptualizationInput = await request.json()

    // Validate required fields
    const hasCoreBelief = Boolean(data.coreBelief)
    const hasChildhoodData = Boolean(data.childhoodData)
    const hasRequiredData = hasCoreBelief || hasChildhoodData
    if (!hasRequiredData) {
      return NextResponse.json(
        {
          error:
            'A conceituação cognitiva precisa ter pelo menos a crença central ou dados de infância preenchidos',
        },
        { status: 400 }
      )
    }

    // Build the prompt with all available data
    const situationsText = data.situations
      ? Object.entries(data.situations)
          .filter(([, sit]) => sit?.situation)
          .map(
            ([_key, sit], index) => `
          Situação ${index + 1}:
          - Situação: ${sit?.situation || 'Não informado'}
          - Pensamento Automático: ${sit?.automaticThought || 'Não informado'}
          - Significado do PA: ${sit?.meaningOfAT || 'Não informado'}
          - Emoção: ${sit?.emotion || 'Não informado'}
          - Comportamento: ${sit?.behavior || 'Não informado'}
        `
          )
          .join('\n')
      : 'Nenhuma situação registrada'
    const prompt = buildTherapeuticPlanPrompt({
      patientName: data.patientName,
      childhoodData: data.childhoodData,
      coreBelief: data.coreBelief,
      conditionalAssumptions: data.conditionalAssumptions,
      compensatoryStrategies: data.compensatoryStrategies,
      situationsText,
      notes: data.notes,
    })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 1024 },
      },
    })

    const responseText = response.text || ''

    // Parse the JSON response
    let plan: Omit<TherapeuticPlanResponse, 'generatedAt'>
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(JSON_EXTRACT_REGEX)
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      console.error('Failed to parse Gemini response:', responseText)
      return NextResponse.json(
        {
          error: 'Não foi possível processar a resposta da IA. Tente novamente.',
        },
        { status: 500 }
      )
    }

    // Add generation timestamp
    const fullPlan: TherapeuticPlanResponse = {
      ...plan,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(fullPlan)
  } catch (error) {
    console.error('Error generating therapeutic plan:', error)
    return NextResponse.json(
      {
        error:
          'Desculpe, não foi possível gerar o plano terapêutico. Por favor, tente novamente mais tarde.',
      },
      { status: 500 }
    )
  }
}
