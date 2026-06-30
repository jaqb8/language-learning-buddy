import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalysisModeStore } from "@/lib/stores/analysis-mode.store";
import { ANALYSIS_MODE_DEFINITIONS, isValidAnalysisMode } from "@/lib/analysis-mode.constants";
import { Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AnalysisModeSelectorProps {
  disabled?: boolean;
}

export function AnalysisModeSelector({ disabled = false }: AnalysisModeSelectorProps) {
  const { t } = useI18n();
  const mode = useAnalysisModeStore((state) => state.mode);
  const setMode = useAnalysisModeStore((state) => state.setMode);
  const currentMode = ANALYSIS_MODE_DEFINITIONS.find((definition) => definition.value === mode);
  const modeLabel = (value: string) =>
    t(value === "colloquial_speech" ? "analysis.mode.colloquial.label" : "analysis.mode.grammar.label");
  const modeDescription = (value: string) =>
    t(value === "colloquial_speech" ? "analysis.mode.colloquial.description" : "analysis.mode.grammar.description");

  const handleValueChange = (value: string) => {
    if (disabled) {
      return;
    }
    if (isValidAnalysisMode(value)) {
      setMode(value);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
      <label htmlFor="analysis-mode" className="block text-sm font-medium">
        {t("analysis.mode.label")}
      </label>
      <div className="flex min-h-4 items-center gap-1.5">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <p className="text-xs text-muted-foreground animate-in fade-in duration-300">
          {currentMode ? modeDescription(currentMode.value) : null}
        </p>
      </div>
      <Select value={mode} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          size="md"
          id="analysis-mode"
          className="w-full bg-background text-base"
          data-test-id="analysis-mode-selector"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANALYSIS_MODE_DEFINITIONS.map((modeDefinition) => (
            <SelectItem
              key={modeDefinition.value}
              value={modeDefinition.value}
              className="text-base"
              data-test-id={modeDefinition.testId}
            >
              {modeLabel(modeDefinition.value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
