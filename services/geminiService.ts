import { GoogleGenAI } from '@google/genai'

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })

/**
 * Analyzes a CBT thought record using Gemini.
 */
export const analyzeThought = async (emotion: string, thought: string): Promise<string> => {
  try {
    const prompt = `
      You are an empathetic and professional Cognitive Behavioral Therapy (CBT) assistant. 
      A user has recorded the following log:
      
      - Automatic Thought: "${thought}"
      - Emotion: "${emotion}"
      
      Please provide a brief, supportive analysis (max 3 sentences). 
      First, validate their feeling. 
      Second, gently suggest a cognitive reframing or an alternative perspective to challenge the automatic thought.
      Keep the tone encouraging and warm.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
      },
    })

    return response.text || 'Unable to generate analysis at this time.'
  } catch (error) {
    console.error('Error calling Gemini:', error)
    return "Sorry, I couldn't analyze your thought right now. Please try again later."
  }
}
