import { describe, it, expect } from "vitest";
import { buildAnalysisResultViewModel } from "./analysisResult.model";
import type { TextAnalysisDto } from "@/types";

describe("analysisResult.model", () => {
  const baseFeatures = {
    authEnabled: true,
    learningItemsEnabled: true,
    gamificationEnabled: true,
    gamificationBetaTagEnabled: false,
  } as const;

  const correctResult: TextAnalysisDto = {
    is_correct: true,
    original_text: "Hello world",
    translation: "Witaj swiecie",
  };

  const errorsResult: TextAnalysisDto = {
    is_correct: false,
    original_text: "I is a student",
    corrected_text: "I am a student",
    explanation: "Use **am** with I.",
    translation: null,
  };

  it("returns loading when isLoading=true", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: true,
      analysisResult: null,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: false,
      earnedPoint: false,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("loading");
  });

  it("returns empty when not loading and no result", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: null,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: false,
      earnedPoint: false,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("empty");
  });

  it("returns correct when result.is_correct=true", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: correctResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: true,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("correct");
    if (vm.kind !== "correct") throw new Error("Unexpected VM kind");
    expect(vm.translation).toBe(correctResult.translation);
    expect(vm.showEarnedPointBadge).toBe(true);
  });

  it("does not show earned point badge when gamification feature is disabled", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: correctResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: true,
      features: { ...baseFeatures, gamificationEnabled: false },
    });

    expect(vm.kind).toBe("correct");
    if (vm.kind !== "correct") throw new Error("Unexpected VM kind");
    expect(vm.showEarnedPointBadge).toBe(false);
  });

  it("returns errors with save CTA when authenticated and not saved", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: errorsResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: false,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("errors");
    if (vm.kind !== "errors") throw new Error("Unexpected VM kind");
    expect(vm.saveCta.kind).toBe("save");
  });

  it("returns errors with login CTA when unauthenticated and not saved", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: errorsResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: false,
      earnedPoint: false,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("errors");
    if (vm.kind !== "errors") throw new Error("Unexpected VM kind");
    expect(vm.saveCta.kind).toBe("login");
  });

  it("returns errors with saved CTA when isSaved=true", () => {
    const vm = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: errorsResult,
      isSaved: true,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: false,
      features: baseFeatures,
    });

    expect(vm.kind).toBe("errors");
    if (vm.kind !== "errors") throw new Error("Unexpected VM kind");
    expect(vm.saveCta.kind).toBe("saved");
    if (vm.saveCta.kind !== "saved") throw new Error("Unexpected CTA kind");
    expect(vm.saveCta.disabled).toBe(true);
  });

  it("hides save CTA when auth or learning-items features are disabled", () => {
    const vm1 = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: errorsResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: false,
      features: { ...baseFeatures, authEnabled: false },
    });

    expect(vm1.kind).toBe("errors");
    if (vm1.kind !== "errors") throw new Error("Unexpected VM kind");
    expect(vm1.saveCta.kind).toBe("hidden");

    const vm2 = buildAnalysisResultViewModel({
      isLoading: false,
      analysisResult: errorsResult,
      isSaved: false,
      analysisMode: "grammar_and_spelling",
      isAuth: true,
      earnedPoint: false,
      features: { ...baseFeatures, learningItemsEnabled: false },
    });

    expect(vm2.kind).toBe("errors");
    if (vm2.kind !== "errors") throw new Error("Unexpected VM kind");
    expect(vm2.saveCta.kind).toBe("hidden");
  });
});
