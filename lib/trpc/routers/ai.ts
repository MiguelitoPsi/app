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

        const prompt = `Você é um assistente de Terapia Cognitiva Baseada em Recuperação (CT-R) empático e profissional.

A CT-R enfatiza os pontos fortes, qualidades pessoais, habilidades e recursos do usuário, em vez de focar apenas nos sintomas. Seu objetivo é identificar e fortalecer crenças adaptativas e fatores que mantêm o bem-estar.

Contexto (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Por favor, forneça uma análise breve e acolhedora (máximo 3 frases):
1. Valide o sentimento do usuário com empatia
2. Identifique um ponto forte, recurso interno ou habilidade que o usuário demonstra ao compartilhar isso
3. Sugira gentilmente uma perspectiva alternativa que fortaleça suas crenças adaptativas e recursos pessoais

Mantenha o tom encorajador, focando no que o usuário TEM de positivo e no que PODE fazer, não no que está "errado".

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

        const prompt = `Você é um assistente compassivo de saúde mental utilizando a abordagem CT-R (Terapia Cognitiva Baseada em Recuperação).

A CT-R enfatiza os pontos fortes, qualidades pessoais, habilidades e recursos do usuário, focando em crenças adaptativas e fatores que mantêm um humor positivo.

Contexto (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Forneça uma análise baseada em recuperação:
1. **Validação emocional**: Reconheça os sentimentos expressos com empatia (1-2 frases)
2. **Forças identificadas**: Destaque qualidades pessoais, habilidades ou recursos que o usuário demonstra na entrada (mesmo que sutis)
3. **Reflexão construtiva**: Uma sugestão que amplifique os pontos fortes identificados ou ajude a reconhecer crenças adaptativas já presentes

Foque no que o usuário faz bem, nas suas capacidades e no potencial de crescimento. Evite linguagem patologizante.

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

        const prompt = `Você é um assistente de terapeuta de IA acolhedor, utilizando a abordagem CT-R (Terapia Cognitiva Baseada em Recuperação) e técnicas de mindfulness.

Princípios da CT-R que você segue:
- Enfatizar pontos fortes, qualidades pessoais, habilidades e recursos do usuário
- Identificar e fortalecer crenças adaptativas (não apenas desafiar as negativas)
- Reconhecer fatores que mantêm o bem-estar e humor positivo
- Focar no que o usuário PODE fazer e no que TEM de positivo

Contexto da Conversa (formato TOON):
\`\`\`toon
${toonContext}
\`\`\`

Responda com empatia, destacando sempre algum ponto forte ou recurso que percebe no usuário.
Forneça insights práticos que ampliem suas capacidades e crenças adaptativas.
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
