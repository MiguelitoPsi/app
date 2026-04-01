import { GoogleGenAI } from '@google/genai'
import { buildRewardCostSuggestionPrompt } from '@shared/ai/prompts'
import { NextResponse } from 'next/server'

// Regex pattern for extracting JSON from response
const JSON_PATTERN = /\{[\s\S]*\}/

// Default costs by category for fallback
const DEFAULT_COSTS: Record<string, number> = {
  lazer: 80,
  autocuidado: 100,
  descanso: 60,
  social: 120,
}

const getDefaultCost = (category?: string): number => {
  if (!category) return 50
  return DEFAULT_COSTS[category] ?? 50
}

/**
 * POST /api/suggest-reward-cost
 * Analyzes a reward and suggests an appropriate cost/value using AI.
 */
export async function POST(request: Request) {
  let category: string | undefined

  try {
    const body = await request.json()
    const { title, patientLevel, patientPoints } = body
    category = body.category

    if (!title) {
      return NextResponse.json({ error: 'título da recompensa é obrigatório' }, { status: 400 })
    }

    // Check if API key is available and not a placeholder
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.trim() === '') {
      console.warn('GEMINI_API_KEY not configured or is a placeholder, using fallback values')
      return NextResponse.json({
        suggestedCost: getDefaultCost(category),
        reasoning: 'Sugestão baseada na categoria da recompensa.',
        valueLevel: 'médio',
      })
    }

    // Initialize the client inside the handler to ensure env var is available
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildRewardCostSuggestionPrompt({
      title,
      category,
      patientLevel,
      patientPoints,
    })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
      },
    })

    const text = response.text || ''

    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(JSON_PATTERN)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          suggestedCost: Math.min(500, Math.max(10, Number(parsed.suggestedCost) || 50)),
          reasoning: parsed.reasoning || 'Sugestão baseada na categoria e valor da recompensa.',
          valueLevel: parsed.valueLevel || 'médio',
        })
      }
      // If no JSON found, return defaults
      throw new Error('No JSON found in response')
    } catch {
      // Fallback values if parsing fails
      return NextResponse.json({
        suggestedCost: getDefaultCost(category),
        reasoning: 'Sugestão baseada na categoria da recompensa.',
        valueLevel: 'médio',
      })
    }
  } catch (error) {
    console.error('Error calling Gemini for reward suggestion:', error)
    // Return fallback values instead of error to improve UX
    return NextResponse.json({
      suggestedCost: getDefaultCost(category),
      reasoning: 'Sugestão baseada na categoria da recompensa.',
      valueLevel: 'médio',
    })
  }
}
