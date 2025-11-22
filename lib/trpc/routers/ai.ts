import { GoogleGenAI } from "@google/genai";
import { encode as encodeTOON } from "@toon-format/toon";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || "" });

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
        };

        const toonContext = encodeTOON(contextData);

        const prompt = `Você é um assistente de Terapia Cognitivo-Comportamental (TCC) empático e profissional. 

Contexto (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Por favor, forneça uma análise breve e acolhedora (máximo 3 frases). 
Primeiro, valide o sentimento dele. 
Segundo, sugira gentilmente uma reestruturação cognitiva ou uma perspectiva alternativa para desafiar o pensamento automático.
Mantenha o tom encorajador e caloroso.

IMPORTANTE: Responda SEMPRE em português brasileiro.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        return {
          analysis:
            response.text ||
            "Não foi possível gerar uma análise neste momento.",
        };
      } catch (error) {
        console.error("Error calling Gemini:", error);
        throw new Error(
          "Desculpe, não consegui analisar seu pensamento agora. Por favor, tente novamente mais tarde."
        );
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
            mood: input.mood || "not specified",
          },
        };

        const toonContext = encodeTOON(contextData);

        const prompt = `Você é um assistente compassivo de saúde mental analisando uma entrada de diário.

Contexto (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Forneça:
1. Uma breve análise emocional (1-2 frases)
2. Um padrão positivo ou força que você percebe
3. Uma sugestão gentil para auto-reflexão

Mantenha um tom acolhedor e sem julgamentos.

IMPORTANTE: Responda SEMPRE em português brasileiro.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        return {
          analysis:
            response.text ||
            "Não foi possível gerar uma análise neste momento.",
        };
      } catch (error) {
        console.error("Error calling Gemini:", error);
        throw new Error(
          "Não foi possível analisar a entrada do diário. Por favor, tente novamente."
        );
      }
    }),

  generateMeditationScript: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "breathing",
          "body-scan",
          "mindfulness",
          "loving-kindness",
        ]),
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
        };

        const toonContext = encodeTOON(contextData);

        const prompt = `Gere um script de meditação guiada.

Parâmetros (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Crie um script calmo e profissional com:
- Abertura (30 segundos)
- Prática principal (alinhada com a duração)
- Fechamento (30 segundos)

Use uma linguagem simples e tranquilizadora. Inclua indicações de tempo.

IMPORTANTE: Responda SEMPRE em português brasileiro.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        return {
          script:
            response.text || "Não foi possível gerar o script neste momento.",
        };
      } catch (error) {
        console.error("Error calling Gemini:", error);
        throw new Error(
          "Não foi possível gerar o script de meditação. Por favor, tente novamente."
        );
      }
    }),

  chatTherapist: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
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
        };

        const toonContext = encodeTOON(contextData);

        const prompt = `Você é um assistente de terapeuta de IA acolhedor, treinado em técnicas de TCC e mindfulness.

Contexto da Conversa (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Responda com empatia e profissionalismo. Forneça insights práticos quando apropriado. 
Se o usuário expressar pensamentos de crise, sugira gentilmente ajuda profissional.
Mantenha as respostas concisas (2-4 frases).

IMPORTANTE: Responda SEMPRE em português brasileiro.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        return {
          response:
            response.text ||
            "Me desculpe, mas preciso de um momento. Por favor, tente novamente.",
        };
      } catch (error) {
        console.error("Error calling Gemini:", error);
        throw new Error(
          "Não foi possível processar a mensagem. Por favor, tente novamente."
        );
      }
    }),
});
