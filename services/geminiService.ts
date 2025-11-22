/**
 * Analyzes a CBT thought record using Gemini via API route.
 */
export const analyzeThought = async (
  emotion: string,
  thought: string
): Promise<string> => {
  try {
    const response = await fetch("/api/analyze-thought", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emotion, thought }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze thought");
    }

    const data = await response.json();
    return data.analysis || "Não foi possível gerar uma análise neste momento.";
  } catch (error) {
    console.error("Error calling analyze-thought API:", error);
    return "Desculpe, não consegui analisar seu pensamento agora. Por favor, tente novamente mais tarde.";
  }
};
