import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { ANALYSIS_LANGUAGE_DEFINITIONS, isValidAnalysisLanguage } from "@/lib/analysis-mode.constants";
import { useAnalysisLanguageStore } from "@/lib/stores/analysis-language.store";
import { useI18n } from "@/lib/i18n";

interface AnalysisLanguageSelectorProps {
  disabled?: boolean;
}

export function AnalysisLanguageSelector({ disabled = false }: AnalysisLanguageSelectorProps) {
  const { t } = useI18n();
  const language = useAnalysisLanguageStore((state) => state.language);
  const setLanguage = useAnalysisLanguageStore((state) => state.setLanguage);
  const selectedLanguage = ANALYSIS_LANGUAGE_DEFINITIONS.find((definition) => definition.value === language)!;

  const handleValueChange = (value: string) => {
    if (!disabled && isValidAnalysisLanguage(value)) {
      setLanguage(value);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
      <label htmlFor="analysis-language" className="block text-sm font-medium">
        {t("analysis.language.label")}
      </label>
      <div className="flex min-h-4 items-center gap-1.5 text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <p className="text-xs">{t("analysis.language.description")}</p>
      </div>
      <Select value={language} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          size="md"
          id="analysis-language"
          className="w-full bg-background text-base"
          data-test-id="analysis-language-selector"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <LanguageFlag language={selectedLanguage.value} />
              <span>{t(selectedLanguage.value === "pl" ? "analysis.language.pl" : "analysis.language.en")}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ANALYSIS_LANGUAGE_DEFINITIONS.map((definition) => (
            <SelectItem
              key={definition.value}
              value={definition.value}
              className="text-base"
              data-test-id={definition.testId}
            >
              <LanguageFlag language={definition.value} />
              <span>{t(definition.value === "pl" ? "analysis.language.pl" : "analysis.language.en")}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
