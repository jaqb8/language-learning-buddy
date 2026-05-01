import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterAIProvider } from "./openrouter-ai-provider";
import type { OpenRouterService } from "./openrouter.service";
import {
  OpenRouterConfigurationError,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterInvalidRequestError,
  OpenRouterResponseValidationError,
  OpenRouterNetworkError,
} from "./openrouter.errors";
import {
  AnalysisConfigurationError,
  AnalysisAuthenticationError,
  AnalysisRateLimitError,
  AnalysisInvalidRequestError,
  AnalysisValidationError,
  AnalysisNetworkError,
  AnalysisUnknownError,
} from "../analysis/analysis.errors";
import type { TextAnalysisDto } from "../../../types";

function createMockOpenRouterService() {
  return {
    analyzeText: vi.fn(),
  } as unknown as OpenRouterService & { analyzeText: ReturnType<typeof vi.fn> };
}

describe("OpenRouterAIProvider", () => {
  let provider: OpenRouterAIProvider;
  let mockService: ReturnType<typeof createMockOpenRouterService>;

  const mockResponse: TextAnalysisDto = {
    is_correct: true,
    gamification_result: "correct",
    original_text: "Test text",
    translation: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = createMockOpenRouterService();
    provider = new OpenRouterAIProvider(mockService);
  });

  it("should delegate analyzeText to OpenRouterService", async () => {
    mockService.analyzeText.mockResolvedValue(mockResponse);

    const result = await provider.analyzeText("grammar_and_spelling", "Hello world", "some context");

    expect(mockService.analyzeText).toHaveBeenCalledWith("grammar_and_spelling", "Hello world", "some context");
    expect(result).toEqual(mockResponse);
  });

  it("should pass undefined context when not provided", async () => {
    mockService.analyzeText.mockResolvedValue(mockResponse);

    await provider.analyzeText("grammar_and_spelling", "Hello world");

    expect(mockService.analyzeText).toHaveBeenCalledWith("grammar_and_spelling", "Hello world", undefined);
  });

  describe("error mapping", () => {
    it("should map OpenRouterConfigurationError to AnalysisConfigurationError", async () => {
      mockService.analyzeText.mockRejectedValue(new OpenRouterConfigurationError());

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(
        AnalysisConfigurationError
      );
    });

    it("should map OpenRouterAuthenticationError to AnalysisAuthenticationError", async () => {
      mockService.analyzeText.mockRejectedValue(new OpenRouterAuthenticationError());

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(
        AnalysisAuthenticationError
      );
    });

    it("should map OpenRouterRateLimitError to AnalysisRateLimitError", async () => {
      mockService.analyzeText.mockRejectedValue(new OpenRouterRateLimitError());

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(
        AnalysisRateLimitError
      );
    });

    it("should map OpenRouterInvalidRequestError to AnalysisInvalidRequestError", async () => {
      mockService.analyzeText.mockRejectedValue(new OpenRouterInvalidRequestError());

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(
        AnalysisInvalidRequestError
      );
    });

    it("should map OpenRouterResponseValidationError to AnalysisValidationError", async () => {
      const validationErrors = [{ message: "invalid field" }];
      mockService.analyzeText.mockRejectedValue(new OpenRouterResponseValidationError(validationErrors));

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(
        AnalysisValidationError
      );
    });

    it("should preserve validationErrors when mapping OpenRouterResponseValidationError", async () => {
      const validationErrors = [{ message: "invalid field" }];
      mockService.analyzeText.mockRejectedValue(new OpenRouterResponseValidationError(validationErrors));

      try {
        await provider.analyzeText("grammar_and_spelling", "text");
      } catch (error) {
        expect(error).toBeInstanceOf(AnalysisValidationError);
        expect((error as AnalysisValidationError).validationErrors).toEqual(validationErrors);
      }
    });

    it("should map OpenRouterNetworkError to AnalysisNetworkError", async () => {
      const cause = new Error("connection refused");
      mockService.analyzeText.mockRejectedValue(new OpenRouterNetworkError(cause));

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(AnalysisNetworkError);
    });

    it("should preserve cause when mapping OpenRouterNetworkError", async () => {
      const cause = new Error("connection refused");
      mockService.analyzeText.mockRejectedValue(new OpenRouterNetworkError(cause));

      try {
        await provider.analyzeText("grammar_and_spelling", "text");
      } catch (error) {
        expect(error).toBeInstanceOf(AnalysisNetworkError);
        expect((error as AnalysisNetworkError).cause).toBe(cause);
      }
    });

    it("should map unknown errors to AnalysisUnknownError", async () => {
      mockService.analyzeText.mockRejectedValue(new Error("something unexpected"));

      await expect(provider.analyzeText("grammar_and_spelling", "text")).rejects.toBeInstanceOf(AnalysisUnknownError);
    });
  });
});
