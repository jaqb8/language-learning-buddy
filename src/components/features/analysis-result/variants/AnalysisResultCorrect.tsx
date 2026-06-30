import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { EarnedPointBadge } from "../components/EarnedPointBadge";
import { TranslationBlock } from "../components/TranslationBlock";
import { useI18n } from "@/lib/i18n";

interface AnalysisResultCorrectProps {
  translation: string | null;
  showEarnedPointBadge: boolean;
  showGamificationBetaTag: boolean;
}

export function AnalysisResultCorrect({
  translation,
  showEarnedPointBadge,
  showGamificationBetaTag,
}: AnalysisResultCorrectProps) {
  const { t } = useI18n();
  return (
    <Card role="status" aria-label={t("analysis.result.correctAria")} data-test-id="analysis-result-correct">
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
          <CheckCircle2 className="size-12 text-green-600 dark:text-green-500" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t("analysis.result.great")}</h2>
            <p className="text-muted-foreground">{t("analysis.result.noCorrections")}</p>
          </div>
          {showEarnedPointBadge && <EarnedPointBadge showBetaTag={showGamificationBetaTag} />}
          {translation && <TranslationBlock translation={translation} />}
        </div>
      </CardContent>
    </Card>
  );
}
