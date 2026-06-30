import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextDiff } from "@/components/shared/TextDiff";
import { AnalysisModeBadge } from "@/components/shared/AnalysisModeBadge";
import type { AnalysisMode } from "@/types";
import type { SaveCtaModel } from "../analysisResult.model";
import { SaveToLearningListButton } from "../components/SaveToLearningListButton";
import { EarnedPointBadge } from "../components/EarnedPointBadge";
import { useI18n } from "@/lib/i18n";

interface AnalysisResultWithErrorsProps {
  analysisMode: AnalysisMode;
  textDiff: {
    originalText: string;
    correctedText: string;
    translation: string | null;
  };
  explanationMarkdown: string;
  saveCta: SaveCtaModel;
  showEarnedPointBadge: boolean;
  showGamificationBetaTag: boolean;
  onSaveClick: () => void;
}

export function AnalysisResultWithErrors({
  analysisMode,
  textDiff,
  explanationMarkdown,
  saveCta,
  showEarnedPointBadge,
  showGamificationBetaTag,
  onSaveClick,
}: AnalysisResultWithErrorsProps) {
  const { t } = useI18n();
  return (
    <Card role="article" aria-label={t("analysis.result.errorsAria")} data-test-id="analysis-result-with-errors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("analysis.result.title")}</h2>
          <AnalysisModeBadge mode={analysisMode} className="text-xs" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextDiff
          originalText={textDiff.originalText}
          correctedText={textDiff.correctedText}
          translation={textDiff.translation}
        />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-2">{t("analysis.result.explanation")}</h3>
          <div
            className="rounded-md bg-muted p-3 text-sm leading-relaxed markdown-content"
            data-test-id="analysis-explanation"
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-3 ml-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-3 ml-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
              }}
            >
              {explanationMarkdown}
            </ReactMarkdown>
          </div>
        </div>

        {showEarnedPointBadge && <EarnedPointBadge showBetaTag={showGamificationBetaTag} variant="minor_issue" />}
      </CardContent>
      {saveCta.kind !== "hidden" && (
        <CardFooter>
          <SaveToLearningListButton cta={saveCta} onClick={onSaveClick} />
        </CardFooter>
      )}
    </Card>
  );
}
