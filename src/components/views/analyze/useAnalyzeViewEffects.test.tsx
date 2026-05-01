import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAnalyzeViewEffects } from "./useAnalyzeViewEffects";
import type { TextAnalysisDto } from "@/types";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const baseArgs = {
  error: null,
  isCurrentResultSaved: false,
  resultTimestamp: 1,
  isRestoredResult: false,
  isAuth: true,
  analysisContext: "",
  isContextEnabled: true,
  setAnalysisContext: vi.fn(),
  clearPendingAnalysis: vi.fn(),
  gamificationFeatureEnabled: true,
  isPointsAwardingEnabled: true,
  incrementStats: vi.fn(),
};

describe("useAnalyzeViewEffects", () => {
  it("increments stats as successful for minor issues", () => {
    const incrementStats = vi.fn();
    const result: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "minor_issue",
      original_text: "Hello world",
      corrected_text: "Hello world.",
      explanation: "Brakuje końcowej interpunkcji.",
      translation: "Witaj świecie.",
    };

    renderHook(() => useAnalyzeViewEffects({ ...baseArgs, result, incrementStats }));

    expect(incrementStats).toHaveBeenCalledWith(true);
  });
});
