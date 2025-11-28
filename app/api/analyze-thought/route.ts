import { GoogleGenAI } from '@google/genai'
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

    const prompt = `
      Você é um assistente de Terapia Cognitivo-Comportamental (TCC) empático e profissional. 
      Um usuário registrou o seguinte:
      
      - Pensamento Automático: "${thought}"
      - Emoção: "${emotion}"
      
      Por favor, forneça uma análise breve e acolhedora (máximo 3 frases). 
      Primeiro, valide o sentimento dele. 
      Segundo, sugira gentilmente uma reestruturação cognitiva ou uma perspectiva alternativa para desafiar o pensamento automático.
      Mantenha o tom encorajador e caloroso.
      
      IMPORTANTE: Responda SEMPRE em português brasileiro.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
      },
    })

    const analysis = response.text || 'Não foi possível gerar uma análise neste momento.'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error calling Gemini:', error)
    return NextResponse.json(
      {
        error:
          'Desculpe, não consegui analisar seu pensamento agora. Por favor, tente novamente mais tarde.',
      },
      { status: 500 }
    )
  }
}
