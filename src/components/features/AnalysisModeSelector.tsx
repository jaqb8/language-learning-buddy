import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalysisModeStore } from "@/lib/stores/analysis-mode.store";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { ANALYSIS_MODE_DEFINITIONS, isValidAnalysisMode } from "@/lib/analysis-mode.constants";
import { ANALYSIS_MODES } from "@/types";
import { Info } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BetaBadge } from "@/components/shared/BetaBadge";

interface AnalysisModeSelectorProps {
  disabled?: boolean;
}

export function AnalysisModeSelector({ disabled = false }: AnalysisModeSelectorProps) {
  const mode = useAnalysisModeStore((state) => state.mode);
  const setMode = useAnalysisModeStore((state) => state.setMode);
  const betaModesEnabled = useSettingsStore((state) => state.betaModesEnabled);
  const isLoaded = useSettingsStore((state) => state.isLoaded);

  const isBetaVisible = isLoaded ? betaModesEnabled : false;

  const visibleModes = useMemo(
    () => (isBetaVisible ? ANALYSIS_MODE_DEFINITIONS : ANALYSIS_MODE_DEFINITIONS.filter((m) => !m.isBeta)),
    [isBetaVisible]
  );

  const currentMode = visibleModes.find((m) => m.value === mode);

  useEffect(() => {
    if (isBetaVisible) {
      return;
    }

    const isBetaMode = ANALYSIS_MODE_DEFINITIONS.some((m) => m.value === mode && m.isBeta);
    if (!isBetaMode) {
      return;
    }

    setMode(ANALYSIS_MODES.GRAMMAR_AND_SPELLING);
  }, [isBetaVisible, mode, setMode]);

  const handleValueChange = (value: string) => {
    if (disabled) {
      return;
    }
    if (isValidAnalysisMode(value)) {
      setMode(value);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="analysis-mode" className="block text-sm font-medium">
        Tryb analizy
      </label>
      <div className="flex items-center gap-1">
        <Info size={14} />
        <p className="text-xs text-muted-foreground animate-in fade-in duration-300">{currentMode?.description}</p>
      </div>
      <Select value={mode} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger size="md" id="analysis-mode" className="w-full text-base" data-test-id="analysis-mode-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {visibleModes.map((modeDefinition) => (
            <SelectItem
              key={modeDefinition.value}
              value={modeDefinition.value}
              className="text-base"
              data-test-id={modeDefinition.testId}
            >
              {modeDefinition.isBeta ? (
                <span className="flex items-center gap-2">
                  {modeDefinition.label}
                  <BetaBadge />
                </span>
              ) : (
                modeDefinition.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
