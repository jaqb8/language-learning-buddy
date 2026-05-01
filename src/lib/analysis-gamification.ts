import type { TextAnalysisDto } from "@/types";

export function isGamificationSuccess(result: TextAnalysisDto): boolean {
  return result.gamification_result !== "incorrect";
}

export function normalizeAnalysisResult(result: TextAnalysisDto): TextAnalysisDto {
  if (!result.is_correct && result.corrected_text.trim() === result.original_text.trim()) {
    return {
      is_correct: true,
      gamification_result: "correct",
      original_text: result.original_text,
      translation: result.translation,
    };
  }

  return result;
}
