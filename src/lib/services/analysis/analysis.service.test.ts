import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalysisService } from "./analysis.service";
import type { TextAnalysisDto } from "../../../types";

vi.mock("../openrouter", () => ({
  openRouterService: {
    getChatCompletion: vi.fn(),
  },
  aiModelConfigService: {
    getModelName: vi.fn().mockReturnValue("x-ai/grok-4.1-fast"),
    getTemperature: vi.fn().mockReturnValue(0.3),
    getMaxTokens: vi.fn().mockReturnValue(1000),
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

describe("AnalysisService - userMessage building", () => {
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

  it("should build userMessage without context when analysisContext is not provided", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toBe(text);
    expect(callArgs.userMessage).not.toContain("Tekst do analizy:");
    expect(callArgs.userMessage).not.toContain("Kontekst użytkownika:");
  });

  it("should build userMessage without context when analysisContext is empty string", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toBe(text);
    expect(callArgs.userMessage).not.toContain("Tekst do analizy:");
    expect(callArgs.userMessage).not.toContain("Kontekst użytkownika:");
  });

  it("should build userMessage without context when analysisContext is only whitespace", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "   ";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toBe(text);
    expect(callArgs.userMessage).not.toContain("Tekst do analizy:");
    expect(callArgs.userMessage).not.toContain("Kontekst użytkownika:");
  });

  it("should build userMessage with context when analysisContext is provided", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "Piszę email do mojego szefa";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toContain("Tekst do analizy:");
    expect(callArgs.userMessage).toContain("Kontekst użytkownika:");
    expect(callArgs.userMessage).toContain(text);
    expect(callArgs.userMessage).toContain(analysisContext);
    expect(callArgs.userMessage).toBe(`Tekst do analizy:\n${text}\n\nKontekst użytkownika:\n${analysisContext}`);
  });

  it("should trim analysisContext when building userMessage", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "  Piszę email do mojego szefa  ";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toContain("Tekst do analizy:");
    expect(callArgs.userMessage).toContain("Kontekst użytkownika:");
    expect(callArgs.userMessage).toContain(text);
    expect(callArgs.userMessage).toContain("Piszę email do mojego szefa");
    expect(callArgs.userMessage).not.toContain("  Piszę email do mojego szefa  ");
    expect(callArgs.userMessage).toBe(
      `Tekst do analizy:\n${text}\n\nKontekst użytkownika:\nPiszę email do mojego szefa`
    );
  });

  it("should build userMessage with context for colloquial_speech mode", async () => {
    const text = "Hey, what's up?";
    const mode = "colloquial_speech";
    const analysisContext = "Piszę do przyjaciela";

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(openRouterService.getChatCompletion).mock.calls[0][0];

    expect(callArgs.userMessage).toContain("Tekst do analizy:");
    expect(callArgs.userMessage).toContain("Kontekst użytkownika:");
    expect(callArgs.userMessage).toContain(text);
    expect(callArgs.userMessage).toContain(analysisContext);
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

    vi.mocked(openRouterService.getChatCompletion).mockResolvedValue(mockResponse);

    await service.analyzeText("I am a student.", "grammar_and_spelling", "Piszę email do mojego szefa");

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(openRouterService.getChatCompletion).toHaveBeenCalledTimes(1);
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
    expect(openRouterService.getChatCompletion).not.toHaveBeenCalled();
  });
});
