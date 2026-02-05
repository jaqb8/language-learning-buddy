import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAnalysisModeStore } from "@/lib/stores/analysis-mode.store";
import { ANALYSIS_MODE_DEFINITIONS, isValidAnalysisMode } from "@/lib/analysis-mode.constants";
import { Info } from "lucide-react";

interface AnalysisModeSelectorProps {
  disabled?: boolean;
}

export function AnalysisModeSelector({ disabled = false }: AnalysisModeSelectorProps) {
  const mode = useAnalysisModeStore((state) => state.mode);
  const setMode = useAnalysisModeStore((state) => state.setMode);

  const currentMode = ANALYSIS_MODE_DEFINITIONS.find((m) => m.value === mode);

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
        <p className="text-xs text-muted-foreground animate-in fade-in duration-300">
          {currentMode?.description}
        </p>
      </div>
      <Select value={mode} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger size="md" id="analysis-mode" className="w-full text-base" data-test-id="analysis-mode-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANALYSIS_MODE_DEFINITIONS.map((modeDefinition) => (
            <SelectItem key={modeDefinition.value} value={modeDefinition.value} className="text-base">
              {modeDefinition.isBeta ? (
                <span className="flex items-center gap-2">
                  {modeDefinition.label}
                  <Badge variant="secondary" className="text-xs">
                    beta
                  </Badge>
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
