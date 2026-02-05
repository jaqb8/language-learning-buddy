import { Badge } from "@/components/ui/badge";
import type { AnalysisMode } from "@/types";
import { ANALYSIS_MODES } from "@/types";
import { ANALYSIS_MODE_DEFINITIONS, isValidAnalysisMode } from "@/lib/analysis-mode.constants";

interface AnalysisModeBadgeProps {
  mode: AnalysisMode | string;
  className?: string;
}

export function AnalysisModeBadge({ mode, className }: AnalysisModeBadgeProps) {
  const validMode = isValidAnalysisMode(mode) ? mode : ANALYSIS_MODES.GRAMMAR_AND_SPELLING;
  const modeDefinition = ANALYSIS_MODE_DEFINITIONS.find((m) => m.value === validMode);

  const label = modeDefinition?.isBeta
    ? `${modeDefinition.label} (Beta)`
    : (modeDefinition?.label ?? validMode);
  const variant = modeDefinition?.isBeta ? "secondary" : "default";

  return (
    <Badge variant={variant} className={className} data-test-id="analysis-mode-badge">
      {label}
    </Badge>
  );
}
