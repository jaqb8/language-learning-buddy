import { Badge } from "@/components/ui/badge";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { ANALYSIS_LANGUAGES, type AnalysisLanguage } from "@/types";
import { isValidAnalysisLanguage } from "@/lib/analysis-mode.constants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface AnalysisLanguageBadgeProps {
  language: AnalysisLanguage | string;
  className?: string;
}

export function AnalysisLanguageBadge({ language, className }: AnalysisLanguageBadgeProps) {
  const { t } = useI18n();
  const validLanguage = isValidAnalysisLanguage(language) ? language : ANALYSIS_LANGUAGES.ENGLISH;
  const label = t(validLanguage === "pl" ? "analysis.language.pl" : "analysis.language.en");

  return (
    <Badge
      variant="outline"
      className={cn("rounded-[2px] border-0 bg-transparent p-0 shadow-none", className)}
      data-test-id="analysis-language-badge"
      title={label}
    >
      <span className="flex">
        <LanguageFlag language={validLanguage} />
      </span>
      <span className="sr-only">{label}</span>
    </Badge>
  );
}
