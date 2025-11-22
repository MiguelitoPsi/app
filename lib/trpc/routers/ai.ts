import { GoogleGenAI } from '@google/genai'
import { encode as encodeTOON } from '@toon-format/toon'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })

export const aiRouter = router({
  analyzeThought: protectedProcedure
    .input(
      z.object({
        emotion: z.string(),
        thought: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Format data using TOON for token efficiency
        const contextData = {
          user_input: {
            emotion: input.emotion,
            thought: input.thought,
          },
        }

        const toonContext = encodeTOON(contextData)

        const prompt = `You are an empathetic and professional Cognitive Behavioral Therapy (CBT) assistant. 

Context (TOON format):
\`\`\`toon
${toonContext}
\`\`\`

Please provide a brief, supportive analysis (max 3 sentences). 
First, validate their feeling. 
Second, gently suggest a cognitive reframing or an alternative perspective to challenge the automatic thought.
Keep the tone encouraging and warm.`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        })

        return {
          analysis: response.text || 'Unable to generate analysis at this time.',
        }
      } catch (error) {
        console.error('Error calling Gemini:', error)
        throw new Error("Sorry, I couldn't analyze your thought right now. Please try again later.")
      }
    }),

  analyzeJournalEntry: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        mood: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const contextData = {
          entry: {
            content: input.content,
            mood: input.mood || 'not specified',
          },
        }

        const toonContext = encodeTOON(contextData)

        const prompt = `You are a compassionate mental health assistant analyzing a journal entry.

Context (TOON format):
\`\`\`toon
${toonContext}
\`\`\`

Provide:
1. A brief emotional insight (1-2 sentences)
2. One positive pattern or strength you notice
3. A gentle suggestion for self-reflection

Keep it supportive and non-judgmental.`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        })

        return {
          analysis: response.text || 'Unable to generate analysis at this time.',
        }
      } catch (error) {
        console.error('Error calling Gemini:', error)
        throw new Error('Could not analyze journal entry. Please try again.')
      }
    }),

  generateMeditationScript: protectedProcedure
    .input(
      z.object({
        type: z.enum(['breathing', 'body-scan', 'mindfulness', 'loving-kindness']),
        duration: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const contextData = {
          meditation: {
            type: input.type,
            duration_minutes: input.duration,
          },
        }

        const toonContext = encodeTOON(contextData)

        const prompt = `Generate a guided meditation script.

Parameters (TOON format):
\`\`\`toon
${toonContext}
\`\`\`

Create a calming, professional script with:
- Opening (30 seconds)
- Main practice (aligned with duration)
- Closing (30 seconds)

Use simple, soothing language. Include timing cues.`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        })

        return {
          script: response.text || 'Unable to generate script at this time.',
        }
      } catch (error) {
        console.error('Error calling Gemini:', error)
        throw new Error('Could not generate meditation script. Please try again.')
      }
    }),

  chatTherapist: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Format conversation history with TOON
        const contextData = {
          conversation: input.conversationHistory || [],
          current_message: input.message,
        }

        const toonContext = encodeTOON(contextData)

        const prompt = `You are a supportive AI therapist assistant trained in CBT and mindfulness techniques.

Conversation Context (TOON format):
\`\`\`toon
${toonContext}
\`\`\`

Respond with empathy and professionalism. Provide practical insights when appropriate. 
If the user expresses crisis thoughts, gently suggest professional help.
Keep responses concise (2-4 sentences).`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        })

        return {
          response: response.text || 'I apologize, but I need a moment. Please try again.',
        }
      } catch (error) {
        console.error('Error calling Gemini:', error)
        throw new Error('Could not process message. Please try again.')
      }
    }),
})
