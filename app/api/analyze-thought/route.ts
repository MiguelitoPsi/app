import { GoogleGenAI } from '@google/genai'
import { buildThoughtAnalysisPrompt } from '@shared/ai/prompts'
import { NextResponse } from 'next/server'

// API key validation helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.trim() === '') {
    return null
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * POST /api/analyze-thought
 * Analyzes a CBT thought record using Gemini.
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

    const { emotion, thought } = await request.json()

    const hasEmotion = Boolean(emotion)
    const hasThought = Boolean(thought)
    const hasRequiredFields = hasEmotion && hasThought

    if (!hasRequiredFields) {
      return NextResponse.json({ error: 'emoção e pensamento são obrigatórios' }, { status: 400 })
    }
    const prompt = buildThoughtAnalysisPrompt({ thought, emotion })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      // config: {
      //   thinkingConfig: { thinkingBudget: 0 },
      // },
    })

    const analysis = response.text || 'Não foi possível gerar uma análise neste momento.'

    return NextResponse.json({ analysis })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error calling Gemini:', error)
    return NextResponse.json(
      {
        error: `Debug Error: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}
