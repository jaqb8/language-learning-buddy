import { useMemo, useState } from "react";
import { buildTextDiffSegments } from "./textDiff.model";
import { OriginalDiffText } from "./text-diff/OriginalDiffText";
import { CorrectedDiffText } from "./text-diff/CorrectedDiffText";
import { TranslationToggle } from "./text-diff/TranslationToggle";
import { CopyCorrectedTextButton } from "./text-diff/CopyCorrectedTextButton";
import { useI18n } from "@/lib/i18n";

interface TextDiffProps {
  originalText: string;
  correctedText: string;
  translation: string | null;
}

export function TextDiff({ originalText, correctedText, translation }: TextDiffProps) {
  const { t } = useI18n();
  const [showTranslation, setShowTranslation] = useState(false);

  const segments = useMemo(() => buildTextDiffSegments({ originalText, correctedText }), [originalText, correctedText]);

  return (
    <div
      className="rounded-md bg-muted p-4"
      role="region"
      aria-label={t("analysis.result.comparisonAria")}
      data-test-id="text-diff-container"
    >
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("analysis.result.original")}</h4>
          <OriginalDiffText segments={segments} />
        </div>

        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">{t("analysis.result.corrected")}</h4>
            <div className="flex items-center gap-2">
              {translation && (
                <TranslationToggle isVisible={showTranslation} onToggle={() => setShowTranslation((prev) => !prev)} />
              )}
              <CopyCorrectedTextButton correctedText={correctedText} />
            </div>
          </div>
          <CorrectedDiffText segments={segments} />
          {translation && showTranslation && (
            <div
              className="text-sm font-thin leading-relaxed text-foreground/80 italic"
              data-test-id="text-diff-translation"
            >
              {translation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
