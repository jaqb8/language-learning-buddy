import type { AnalysisMode, AnalysisModeDto } from "@/types";
import { ANALYSIS_MODES } from "@/types";

export const ANALYSIS_MODE_DEFINITIONS: AnalysisModeDto[] = [
  {
    value: ANALYSIS_MODES.GRAMMAR_AND_SPELLING,
    label: "Gramatyka i ortografia",
    description: "Twój tekst zostanie sprawdzony pod kątem błędów gramatycznych i ortograficznych.",
    isBeta: false,
  },
  {
    value: ANALYSIS_MODES.COLLOQUIAL_SPEECH,
    label: "Mowa potoczna",
    description: "Twój tekst zostanie sprawdzony pod kątem naturalności i stylu potocznego.",
    isBeta: false,
  },
  {
    value: ANALYSIS_MODES.BETA_GRAMMAR_AND_SPELLING,
    label: "Gramatyka i ortografia",
    description: "Eksperymentalna wersja analizy gramatycznej z zoptymalizowanymi promptami.",
    isBeta: true,
  },
  {
    value: ANALYSIS_MODES.BETA_COLLOQUIAL_SPEECH,
    label: "Mowa potoczna",
    description: "Eksperymentalna wersja analizy mowy potocznej z zoptymalizowanymi promptami.",
    isBeta: true,
  },
];

export function isValidAnalysisMode(mode: string): mode is AnalysisMode {
  return ANALYSIS_MODE_DEFINITIONS.some((m) => m.value === mode);
}
