import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalysisService } from "./analysis.service";
import type { TextAnalysisDto } from "../../../types";

vi.mock("../openrouter", () => ({
  openRouterService: {
    analyzeText: vi.fn(),
  },
  OpenRouterConfigurationError: class OpenRouterConfigurationError extends Error {},
  OpenRouterAuthenticationError: class OpenRouterAuthenticationError extends Error {},
  OpenRouterRateLimitError: class OpenRouterRateLimitError extends Error {},
  OpenRouterInvalidRequestError: class OpenRouterInvalidRequestError extends Error {},
  OpenRouterResponseValidationError: class OpenRouterResponseValidationError extends Error {},
  OpenRouterNetworkError: class OpenRouterNetworkError extends Error {},
}));

vi.mock("astro:env/server", () => ({
  USE_MOCKS: false,
}));

import { openRouterService } from "../openrouter";

describe("AnalysisService", () => {
  let service: AnalysisService;
  const mockResponse: TextAnalysisDto = {
    is_correct: true,
    original_text: "Test text",
    translation: "Test tłumaczenie",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnalysisService();
  });

  it("should call openRouterService.analyzeText with correct parameters", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode);

    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    expect(openRouterService.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should pass context to openRouterService.analyzeText when provided", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "Piszę email do mojego szefa";

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    expect(openRouterService.analyzeText).toHaveBeenCalledWith(mode, text, analysisContext);
  });

  it("should pass undefined context when analysisContext is empty string", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "";

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    expect(openRouterService.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should pass undefined context when analysisContext is only whitespace", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "   ";

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    expect(openRouterService.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should work with colloquial_speech mode", async () => {
    const text = "Hey, what's up?";
    const mode = "colloquial_speech";
    const analysisContext = "Piszę do przyjaciela";

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    expect(openRouterService.analyzeText).toHaveBeenCalledWith(mode, text, analysisContext);
  });
});

describe("AnalysisService - cache integration", () => {
  const mockResponse: TextAnalysisDto = {
    is_correct: true,
    original_text: "Test text",
    translation: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip cache when analysisContext is provided", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisService(mockSupabase as never);

    vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockResponse);

    await service.analyzeText("I am a student.", "grammar_and_spelling", "Piszę email do mojego szefa");

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
  });

  it("should return cached result when context is missing", async () => {
    const cachedResult: TextAnalysisDto = {
      is_correct: false,
      original_text: "I are student",
      corrected_text: "I am a student",
      explanation: "Subject-verb agreement.",
      translation: null,
    };
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: cachedResult, error: null }),
    };
    const service = new AnalysisService(mockSupabase as never);

    const result = await service.analyzeText("I are student", "grammar_and_spelling");

    expect(result).toEqual(cachedResult);
    expect(openRouterService.analyzeText).not.toHaveBeenCalled();
  });
});
