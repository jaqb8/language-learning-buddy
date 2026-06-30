import type { AnalysisLanguage, AnalysisLanguageDto, AnalysisMode, AnalysisModeDto } from "@/types";
import { ANALYSIS_MODES } from "@/types";

export const ANALYSIS_MODE_DEFINITIONS: AnalysisModeDto[] = [
  {
    value: ANALYSIS_MODES.GRAMMAR_AND_SPELLING,
    label: "Gramatyka i ortografia",
    description: "Twój tekst zostanie sprawdzony pod kątem błędów gramatycznych i ortograficznych.",
    testId: "mode-grammar",
  },
  {
    value: ANALYSIS_MODES.COLLOQUIAL_SPEECH,
    label: "Mowa potoczna",
    description: "Twój tekst zostanie sprawdzony pod kątem naturalności i stylu potocznego.",
    testId: "mode-colloquial",
  },
];

export const ANALYSIS_LANGUAGE_DEFINITIONS: AnalysisLanguageDto[] = [
  {
    value: "en",
    label: "Angielski",
    inputLabel: "angielskim",
    placeholder: "Wpisz tutaj swój tekst w języku angielskim...",
    testId: "language-english",
  },
  {
    value: "pl",
    label: "Polski",
    inputLabel: "polskim",
    placeholder: "Wpisz tutaj swój tekst w języku polskim...",
    testId: "language-polish",
  },
];

export function isValidAnalysisMode(mode: string): mode is AnalysisMode {
  return ANALYSIS_MODE_DEFINITIONS.some((m) => m.value === mode);
}

export function normalizeAnalysisMode(mode: unknown): AnalysisMode {
  if (mode === "beta_grammar_and_spelling") {
    return "grammar_and_spelling";
  }
  if (mode === "beta_colloquial_speech") {
    return "colloquial_speech";
  }
  return typeof mode === "string" && isValidAnalysisMode(mode) ? mode : "grammar_and_spelling";
}

export function isValidAnalysisLanguage(language: string): language is AnalysisLanguage {
  return ANALYSIS_LANGUAGE_DEFINITIONS.some((definition) => definition.value === language);
}

export function normalizeAnalysisLanguage(language: unknown): AnalysisLanguage {
  return typeof language === "string" && isValidAnalysisLanguage(language) ? language : "en";
}

export function getAnalysisLanguageDefinition(language: AnalysisLanguage): AnalysisLanguageDto {
  return ANALYSIS_LANGUAGE_DEFINITIONS.find((definition) => definition.value === language)!;
}
