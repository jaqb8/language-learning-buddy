import type { TextDiffSegment } from "../textDiff.model";
import { useI18n, type Translator } from "@/lib/i18n";

interface OriginalDiffTextProps {
  segments: TextDiffSegment[];
}

function OriginalDiffSegment({ segment, index, t }: { segment: TextDiffSegment; index: number; t: Translator }) {
  switch (segment.kind) {
    case "delete":
      return (
        <span
          key={index}
          className="bg-red-100 text-red-900 line-through dark:bg-red-950/50 dark:text-red-200"
          role="deletion"
          aria-label={t("analysis.result.removedAria", { text: segment.text })}
        >
          {segment.text}
        </span>
      );
    case "keep":
      return <span key={index}>{segment.text}</span>;
    case "insert":
      return null;
  }
}

export function OriginalDiffText({ segments }: OriginalDiffTextProps) {
  const { t } = useI18n();
  return (
    <div
      className="text-sm leading-relaxed"
      aria-label={t("analysis.result.originalDiffAria")}
      data-test-id="text-diff-original"
    >
      {segments.map((segment, index) => (
        <OriginalDiffSegment key={`${segment.kind}-${index}`} segment={segment} index={index} t={t} />
      ))}
    </div>
  );
}
