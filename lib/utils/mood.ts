import type { Mood } from "@/types";

// Emoções padrão do sistema (Mood type)
export const moodTranslations: Record<Mood, string> = {
  happy: "Feliz",
  excited: "Animado",
  grateful: "Grato",
  calm: "Calmo",
  neutral: "Neutro",
  tired: "Cansado",
  bored: "Entediado",
  sad: "Triste",
  anxious: "Ansioso",
  fearful: "Com Medo",
  angry: "Bravo",
  disgusted: "Enojado",
};

// Emojis para todas as emoções (incluindo as da transcrição de sessões)
export const emotionEmojis: Record<string, string> = {
  // Emoções padrão do Mood type
  happy: "😊",
  excited: "🤩",
  grateful: "🙏",
  calm: "😌",
  neutral: "😐",
  tired: "😴",
  bored: "😑",
  sad: "😢",
  anxious: "😰",
  fearful: "😨",
  angry: "😠",
  disgusted: "🤢",
  // Emoções adicionais da transcrição de sessões
  surprised: "😲",
  confused: "😕",
  hopeful: "🤞",
  frustrated: "😤",
  empathetic: "🤗",
};

// Traduções para todas as emoções (incluindo as da transcrição de sessões)
export const allEmotionTranslations: Record<string, string> = {
  // Emoções padrão do Mood type
  happy: "Feliz",
  excited: "Animado",
  grateful: "Grato",
  calm: "Calmo",
  neutral: "Neutro",
  tired: "Cansado",
  bored: "Entediado",
  sad: "Triste",
  anxious: "Ansioso",
  fearful: "Com Medo",
  angry: "Bravo",
  disgusted: "Enojado",
  // Emoções adicionais da transcrição de sessões
  surprised: "Surpreso",
  confused: "Confuso",
  hopeful: "Esperançoso",
  frustrated: "Frustrado",
  empathetic: "Empático",
};

export const translateMood = (mood: string | null | undefined): string => {
  if (!mood) return "";
  const m = mood.toLowerCase() as Mood;
  return moodTranslations[m] || mood;
};

/**
 * Traduz a emoção para português com emoji
 * @param emotion - Emoção em inglês (ex: "happy", "anxious", "hopeful")
 * @returns String com emoji + tradução (ex: "😊 Feliz")
 */
export const translateEmotionWithEmoji = (
  emotion: string | null | undefined,
): string => {
  if (!emotion) return "";
  const key = emotion.toLowerCase();
  const emoji = emotionEmojis[key] || "💭";
  const translation = allEmotionTranslations[key] || emotion;
  return `${emoji} ${translation}`;
};

/**
 * Retorna apenas o emoji da emoção
 * @param emotion - Emoção em inglês
 * @returns Emoji correspondente
 */
export const getEmotionEmoji = (emotion: string | null | undefined): string => {
  if (!emotion) return "💭";
  return emotionEmojis[emotion.toLowerCase()] || "💭";
};

/**
 * Traduz qualquer emoção para português (incluindo as da transcrição)
 * @param emotion - Emoção em inglês
 * @returns Tradução em português
 */
export const translateEmotion = (
  emotion: string | null | undefined,
): string => {
  if (!emotion) return "";
  return allEmotionTranslations[emotion.toLowerCase()] || emotion;
};
