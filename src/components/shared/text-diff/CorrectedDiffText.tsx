import type { TextDiffSegment } from "../textDiff.model";

interface CorrectedDiffTextProps {
  segments: TextDiffSegment[];
}

function CorrectedDiffSegment({ segment, index }: { segment: TextDiffSegment; index: number }) {
  switch (segment.kind) {
    case "insert":
      return (
        <span
          key={index}
          className="bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-200"
          role="insertion"
          aria-label={`Dodano: ${segment.text}`}
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
  return (
    <div
      className="text-sm leading-relaxed"
      aria-label="Tekst poprawiony z zaznaczonymi zmianami"
      data-test-id="text-diff-corrected"
    >
      {segments.map((segment, index) => (
        <CorrectedDiffSegment key={`${segment.kind}-${index}`} segment={segment} index={index} />
      ))}
    </div>
  );
}
