import { describe, expect, it } from "vitest";
import { AIConfigService } from "./ai-config.service";

describe("AIConfigService language prompts", () => {
  const service = new AIConfigService();

  it.each([
    ["grammar_and_spelling", "en", "en", "gramatyki angielskiej", "naturalny polski", "Markdown po ANGIELSKU"],
    ["grammar_and_spelling", "en", "pl", "gramatyki angielskiej", "naturalny polski", "Markdown po POLSKU"],
    ["colloquial_speech", "en", "en", "potocznego angielskiego", "naturalny polski", "Markdown po ANGIELSKU"],
    ["colloquial_speech", "en", "pl", "potocznego angielskiego", "naturalny polski", "Markdown po POLSKU"],
    ["grammar_and_spelling", "pl", "en", "języka polskiego", "język angielski", "Markdown po ANGIELSKU"],
    ["grammar_and_spelling", "pl", "pl", "języka polskiego", "język angielski", "Markdown po POLSKU"],
    ["colloquial_speech", "pl", "en", "potocznego języka polskiego", "język angielski", "Markdown po ANGIELSKU"],
    ["colloquial_speech", "pl", "pl", "potocznego języka polskiego", "język angielski", "Markdown po POLSKU"],
  ] as const)(
    "selects the %s prompt for %s text and %s explanations",
    (mode, language, explanationLocale, subject, translationTarget, explanationLanguage) => {
      const prompt = service.getPrompt(mode, language, explanationLocale);

      expect(prompt).toContain(subject);
      expect(prompt).toContain(translationTarget);
      expect(prompt).toContain(explanationLanguage);
      expect(prompt).not.toContain("{{EXPLANATION_");
    }
  );

  it("uses the same response schema for every language", () => {
    const englishSchema = service.getResponseSchema("grammar_and_spelling", "en");
    const polishSchema = service.getResponseSchema("grammar_and_spelling", "pl");
    const result = {
      is_correct: true,
      gamification_result: "correct",
      original_text: "Poprawny tekst.",
      translation: "Correct text.",
    };

    expect(englishSchema.safeParse(result).success).toBe(true);
    expect(polishSchema.safeParse(result).success).toBe(true);
  });
});
