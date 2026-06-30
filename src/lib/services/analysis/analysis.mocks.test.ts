import { describe, expect, it } from "vitest";
import { getMockAnalysis } from "./analysis.mocks";

describe("mock analysis explanation locale", () => {
  it("returns the same correction and translation with a localized explanation", () => {
    const english = getMockAnalysis("I is a student. He go to school.", "grammar_and_spelling", "en", "en");
    const polish = getMockAnalysis("I is a student. He go to school.", "grammar_and_spelling", "en", "pl");

    expect(english.is_correct).toBe(false);
    expect(polish.is_correct).toBe(false);

    if (english.is_correct || polish.is_correct) {
      throw new Error("Expected incorrect mock results");
    }

    expect(english.corrected_text).toBe(polish.corrected_text);
    expect(english.translation).toBe(polish.translation);
    expect(english.explanation).toContain("Use");
    expect(polish.explanation).toContain("użyj");
  });
});
