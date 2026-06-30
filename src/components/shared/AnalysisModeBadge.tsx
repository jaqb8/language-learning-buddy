import { Badge } from "@/components/ui/badge";
import type { AnalysisMode } from "@/types";
import { ANALYSIS_MODES } from "@/types";
import { isValidAnalysisMode } from "@/lib/analysis-mode.constants";
import { useI18n } from "@/lib/i18n";

interface AnalysisModeBadgeProps {
  mode: AnalysisMode | string;
  className?: string;
}

export function AnalysisModeBadge({ mode, className }: AnalysisModeBadgeProps) {
  const { t } = useI18n();
  const validMode = isValidAnalysisMode(mode) ? mode : ANALYSIS_MODES.GRAMMAR_AND_SPELLING;
  const label = t(
    validMode === ANALYSIS_MODES.COLLOQUIAL_SPEECH ? "analysis.mode.colloquial.label" : "analysis.mode.grammar.label"
  );

  return (
    <Badge className={className} data-test-id="analysis-mode-badge">
      {label}
    </Badge>
  );
}
