import DiffMatchPatch from "diff-match-patch";

export type TextDiffSegmentKind = "keep" | "insert" | "delete";

export interface TextDiffSegment {
  kind: TextDiffSegmentKind;
  text: string;
}

export function buildTextDiffSegments({
  originalText,
  correctedText,
}: {
  originalText: string;
  correctedText: string;
}): TextDiffSegment[] {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(originalText, correctedText);

  return diffs.map(([operation, text]) => {
    if (operation === -1) return { kind: "delete", text };
    if (operation === 1) return { kind: "insert", text };
    return { kind: "keep", text };
  });
}
