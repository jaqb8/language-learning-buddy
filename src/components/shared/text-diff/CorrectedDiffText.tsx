import type { TextDiffSegment } from "../textDiff.model";
import { useI18n, type Translator } from "@/lib/i18n";

interface CorrectedDiffTextProps {
  segments: TextDiffSegment[];
}

function CorrectedDiffSegment({ segment, index, t }: { segment: TextDiffSegment; index: number; t: Translator }) {
  switch (segment.kind) {
    case "insert":
      return (
        <span
          key={index}
          className="bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-200"
          role="insertion"
          aria-label={t("analysis.result.addedAria", { text: segment.text })}
        >
          {segment.text}
        </span>
      );
    case "keep":
      return <span key={index}>{segment.text}</span>;
    case "delete":
      return null;
  }
}

export function CorrectedDiffText({ segments }: CorrectedDiffTextProps) {
  const { t } = useI18n();
  return (
    <div
      className="text-sm leading-relaxed"
      aria-label={t("analysis.result.correctedDiffAria")}
      data-test-id="text-diff-corrected"
    >
      {segments.map((segment, index) => (
        <CorrectedDiffSegment key={`${segment.kind}-${index}`} segment={segment} index={index} t={t} />
      ))}
    </div>
  );
}
