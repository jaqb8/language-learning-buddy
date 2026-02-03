import type { TextDiffSegment } from "../textDiff.model";

interface OriginalDiffTextProps {
  segments: TextDiffSegment[];
}

function OriginalDiffSegment({ segment, index }: { segment: TextDiffSegment; index: number }) {
  switch (segment.kind) {
    case "delete":
      return (
        <span
          key={index}
          className="bg-red-100 text-red-900 line-through dark:bg-red-950/50 dark:text-red-200"
          role="deletion"
          aria-label={`Usunięto: ${segment.text}`}
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
  return (
    <div
      className="text-sm leading-relaxed"
      aria-label="Tekst oryginalny z zaznaczonymi błędami"
      data-test-id="text-diff-original"
    >
      {segments.map((segment, index) => (
        <OriginalDiffSegment key={`${segment.kind}-${index}`} segment={segment} index={index} />
      ))}
    </div>
  );
}
