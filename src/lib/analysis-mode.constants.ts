import type { AnalysisMode } from "@/types";
import { ANALYSIS_MODES } from "@/types";

export function isValidAnalysisMode(mode: string): mode is AnalysisMode {
  return (
    mode === ANALYSIS_MODES.GRAMMAR_AND_SPELLING ||
    mode === ANALYSIS_MODES.COLLOQUIAL_SPEECH ||
    mode === ANALYSIS_MODES.BETA_GRAMMAR_AND_SPELLING ||
    mode === ANALYSIS_MODES.BETA_COLLOQUIAL_SPEECH
  );
}
