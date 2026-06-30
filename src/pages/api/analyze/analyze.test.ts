import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./index";
import type { TextAnalysisDto } from "@/types";
import {
  OpenRouterConfigurationError,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterInvalidRequestError,
  OpenRouterResponseValidationError,
  OpenRouterNetworkError,
} from "@/lib/services/openrouter";

vi.mock("@/lib/services/openrouter", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/services/openrouter")>();
  return {
    ...original,
    openRouterService: {
      analyzeText: vi.fn(),
    },
  };
});

const mockRecordAnalysis = vi.fn();
const mockGetUserSettings = vi.fn();

vi.mock("@/lib/services/gamification", () => ({
  GamificationService: vi.fn().mockImplementation(() => ({
    recordAnalysis: mockRecordAnalysis,
  })),
}));

vi.mock("@/lib/services/settings", () => ({
  SettingsService: vi.fn().mockImplementation(() => ({
    getUserSettings: mockGetUserSettings,
  })),
}));

import { openRouterService } from "@/lib/services/openrouter";
import { GamificationService } from "@/lib/services/gamification";

interface MockAPIContext {
  request: Request;
  locals: {
    user: { id: string; email: string } | null;
    analysisQuota: { remaining: number; resetAt: string; limit: number } | null;
    supabase: object;
    locale?: "en" | "pl";
  };
}

function createMockRequest(body: object): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createRawRequest(body: string): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

const mockSupabase = {};

function createMockContext(request: Request, overrides?: Partial<MockAPIContext["locals"]>): MockAPIContext {
  return {
    request,
    locals: {
      user: null,
      analysisQuota: null,
      supabase: mockSupabase,
      ...overrides,
    },
  };
}

describe("POST /api/analyze", () => {
  const mockCorrectResult: TextAnalysisDto = {
    is_correct: true,
    gamification_result: "correct",
    original_text: "Hello world.",
    translation: "Witaj swiecie.",
  };

  const mockErrorResult: TextAnalysisDto = {
    is_correct: false,
    gamification_result: "incorrect",
    original_text: "I gonna go home.",
    corrected_text: "I'm going to go home.",
    explanation: "Use 'going to' instead of 'gonna' in formal contexts.",
    translation: "Zamierzam isc do domu.",
  };

  const mockMinorIssueResult: TextAnalysisDto = {
    is_correct: false,
    gamification_result: "minor_issue",
    original_text: "Hello world",
    corrected_text: "Hello world.",
    explanation: "Brakuje końcowej interpunkcji.",
    translation: "Witaj świecie.",
  };

  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordAnalysis.mockResolvedValue({ correctAnalyses: 1, totalAnalyses: 1 });
    mockGetUserSettings.mockResolvedValue({ pointsEnabled: true, contextEnabled: true });
  });

  describe("context handling", () => {
    it("should use the current application locale for the explanation", async () => {
      const request = createMockRequest({
        text: "I gonna go home.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request, { locale: "pl" }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "I gonna go home.",
        undefined,
        "pl"
      );
    });

    it("should pass analysisContext to AI service when provided", async () => {
      const request = createMockRequest({
        text: "I gonna go home.",
        mode: "grammar_and_spelling",
        analysisContext: "Writing a formal business email",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "I gonna go home.",
        "Writing a formal business email"
      );
    });

    it("should not include context when analysisContext is empty string", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should not include context when analysisContext is only whitespace", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "   ",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should work without analysisContext field at all", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should trim analysisContext whitespace", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "   Formal email context   ",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        "Formal email context"
      );
    });

    it("should work with context in colloquial_speech mode", async () => {
      const request = createMockRequest({
        text: "I request your assistance.",
        mode: "colloquial_speech",
        analysisContext: "Casual chat with friends",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "colloquial_speech",
        "en",
        "I request your assistance.",
        "Casual chat with friends"
      );
    });
  });

  describe("context validation", () => {
    it("should return validation error when analysisContext exceeds 500 characters", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "A".repeat(501),
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_analysis_context_too_long");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });

    it("should accept analysisContext at exactly 500 characters", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "A".repeat(500),
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    });
  });

  describe("context with special characters", () => {
    it("should handle context with unicode characters", async () => {
      const request = createMockRequest({
        text: "Hello.",
        mode: "grammar_and_spelling",
        analysisContext: "Kontekst z polskimi znakami: aecólnsz",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello.",
        "Kontekst z polskimi znakami: aecólnsz"
      );
    });

    it("should handle context with newlines", async () => {
      const multilineContext = `First line
Second line
Third line`;
      const request = createMockRequest({
        text: "Hello.",
        mode: "grammar_and_spelling",
        analysisContext: multilineContext,
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello.",
        multilineContext
      );
    });

    it("should handle context with quotes and special JSON characters", async () => {
      const request = createMockRequest({
        text: "Hello.",
        mode: "grammar_and_spelling",
        analysisContext: 'Context with "quotes" and \\backslash',
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello.",
        'Context with "quotes" and \\backslash'
      );
    });
  });

  describe("response format", () => {
    it("should return proper response with analysis result", async () => {
      const request = createMockRequest({
        text: "I gonna go home.",
        mode: "grammar_and_spelling",
        analysisContext: "Formal email",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual(mockErrorResult);
    });

    it("should include quota headers when quota is set", async () => {
      const request = createMockRequest({
        text: "Hello.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const context = createMockContext(request, {
        analysisQuota: {
          remaining: 5,
          resetAt: "2024-12-18T00:00:00Z",
          limit: 10,
        },
      });

      const response = await POST(context as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Daily-Quota-Remaining")).toBe("5");
      expect(response.headers.get("X-Daily-Quota-Reset-At")).toBe("2024-12-18T00:00:00Z");
      expect(response.headers.get("X-Daily-Quota-Limit")).toBe("10");
    });

    it("should not include quota headers when quota is not set", async () => {
      const request = createMockRequest({
        text: "Hello.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Daily-Quota-Remaining")).toBeNull();
      expect(response.headers.get("X-Daily-Quota-Reset-At")).toBeNull();
      expect(response.headers.get("X-Daily-Quota-Limit")).toBeNull();
    });
  });

  describe("text field validation", () => {
    it("should return validation error when text is missing", async () => {
      const request = createMockRequest({
        mode: "grammar_and_spelling",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("Required");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });

    it("should return validation error when text is empty string", async () => {
      const request = createMockRequest({
        text: "",
        mode: "grammar_and_spelling",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_text_empty");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });

    it("should return validation error when text is only whitespace", async () => {
      const request = createMockRequest({
        text: "   ",
        mode: "grammar_and_spelling",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_text_empty");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });

    it("should return validation error when text exceeds 500 characters", async () => {
      const request = createMockRequest({
        text: "A".repeat(501),
        mode: "grammar_and_spelling",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_text_too_long");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });

    it("should accept text at exactly 500 characters", async () => {
      const request = createMockRequest({
        text: "A".repeat(500),
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledTimes(1);
    });

    it("should trim text whitespace before validation", async () => {
      const request = createMockRequest({
        text: "  Hello world.  ",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });
  });

  describe("mode field validation", () => {
    it("should use grammar_and_spelling as default mode when not provided", async () => {
      const request = createMockRequest({
        text: "Hello world.",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should accept grammar_and_spelling mode", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should accept colloquial_speech mode", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "colloquial_speech",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith("colloquial_speech", "en", "Hello world.", undefined);
    });

    it("should return validation error for invalid mode", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "invalid_mode",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_invalid_mode");
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });
  });

  describe("language field validation", () => {
    it("should use English as the default language", async () => {
      const request = createMockRequest({ text: "Hello world." });
      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "Hello world.",
        undefined
      );
    });

    it("should pass Polish language to the analysis service", async () => {
      const request = createMockRequest({ text: "Ja lubić czytać.", language: "pl" });
      vi.mocked(openRouterService.analyzeText).mockResolvedValue({
        ...mockErrorResult,
        original_text: "Ja lubić czytać.",
        corrected_text: "Lubię czytać.",
        translation: "I like reading.",
      });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "pl",
        "Ja lubić czytać.",
        undefined
      );
    });

    it("should reject unsupported languages", async () => {
      const request = createMockRequest({ text: "Bonjour.", language: "fr" });

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error_code: "validation_error_invalid_language" });
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });
  });

  describe("request parsing", () => {
    it("should handle invalid JSON in request body", async () => {
      const request = createRawRequest("{ invalid json }");

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      expect(openRouterService.analyzeText).not.toHaveBeenCalled();
    });
  });

  describe("analysis result types", () => {
    it("should return correct result when text has no errors", async () => {
      const request = createMockRequest({
        text: "This is a correct sentence.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.is_correct).toBe(true);
      expect(body.original_text).toBeDefined();
      expect(body.corrected_text).toBeUndefined();
      expect(body.explanation).toBeUndefined();
    });

    it("should return error result when text has errors", async () => {
      const request = createMockRequest({
        text: "I gonna go home.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.is_correct).toBe(false);
      expect(body.original_text).toBeDefined();
      expect(body.corrected_text).toBeDefined();
      expect(body.explanation).toBeDefined();
    });

    it("should include translation in response when available", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.translation).toBe("Witaj swiecie.");
    });

    it("should handle null translation in response", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      const resultWithNullTranslation: TextAnalysisDto = {
        is_correct: true,
        gamification_result: "correct",
        original_text: "Hello world.",
        translation: null,
      };

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(resultWithNullTranslation);

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.translation).toBeNull();
    });
  });

  describe("error handling from AnalysisService", () => {
    it("should return 500 for configuration error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterConfigurationError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("configuration_error");
    });

    it("should return 500 for authentication error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterAuthenticationError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("authentication_error");
    });

    it("should return 429 for rate limit error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterRateLimitError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error_code).toBe("rate_limit_error");
    });

    it("should return 500 for invalid request error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterInvalidRequestError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("invalid_request_error");
    });

    it("should return 500 for response validation error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterResponseValidationError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error");
    });

    it("should return 500 for network error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterNetworkError());

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("network_error");
    });

    it("should return 500 for unknown error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new Error("Unknown error"));

      const response = await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("unknown_error");
    });
  });

  describe("analysis modes", () => {
    it("should pass grammar_and_spelling mode to analyzeText", async () => {
      const request = createMockRequest({
        text: "I is happy.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "grammar_and_spelling",
        "en",
        "I is happy.",
        undefined
      );
    });

    it("should pass colloquial_speech mode to analyzeText", async () => {
      const request = createMockRequest({
        text: "I request your assistance.",
        mode: "colloquial_speech",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      await POST(createMockContext(request) as Parameters<typeof POST>[0]);

      expect(openRouterService.analyzeText).toHaveBeenCalledWith(
        "colloquial_speech",
        "en",
        "I request your assistance.",
        undefined
      );
    });
  });

  describe("gamification stats integration", () => {
    it("should record correct analysis when text has no errors and user is logged in", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(GamificationService).toHaveBeenCalledWith(mockSupabase);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(true);
      expect(mockRecordAnalysis).toHaveBeenCalledTimes(1);
    });

    it("should NOT record analysis when stats are disabled in settings", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);
      mockGetUserSettings.mockResolvedValue({ pointsEnabled: false, contextEnabled: true });

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).not.toHaveBeenCalled();
    });

    it("should record incorrect analysis when text has errors", async () => {
      const request = createMockRequest({
        text: "I gonna go home.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockErrorResult);

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(false);
    });

    it("should record minor issues as successful analyses", async () => {
      const request = createMockRequest({
        text: "Hello world",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockMinorIssueResult);

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(true);
    });

    it("should NOT record analysis when user is not logged in", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request, { user: null }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).not.toHaveBeenCalled();
    });

    it("should return successful response even if gamification service throws an error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);
      mockRecordAnalysis.mockRejectedValue(new Error("Database connection failed"));

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.is_correct).toBe(true);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(true);
    });

    it("should skip gamification when settings service throws an error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);
      mockGetUserSettings.mockRejectedValue(new Error("Settings RPC failed"));

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).not.toHaveBeenCalled();
    });

    it("should record correct analysis with context", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
        analysisContext: "Formal email",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(true);
    });

    it("should record correct analysis in colloquial_speech mode", async () => {
      const request = createMockRequest({
        text: "Hey, what's up?",
        mode: "colloquial_speech",
      });

      vi.mocked(openRouterService.analyzeText).mockResolvedValue(mockCorrectResult);

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
      expect(mockRecordAnalysis).toHaveBeenCalledWith(true);
    });

    it("should NOT record analysis when validation fails", async () => {
      const request = createMockRequest({
        text: "",
        mode: "grammar_and_spelling",
      });

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(400);
      expect(mockRecordAnalysis).not.toHaveBeenCalled();
    });

    it("should NOT record analysis when analysis service throws an error", async () => {
      const request = createMockRequest({
        text: "Hello world.",
        mode: "grammar_and_spelling",
      });

      vi.mocked(openRouterService.analyzeText).mockRejectedValue(new OpenRouterNetworkError());

      const response = await POST(createMockContext(request, { user: mockUser }) as Parameters<typeof POST>[0]);

      expect(response.status).toBe(500);
      expect(mockRecordAnalysis).not.toHaveBeenCalled();
    });
  });
});
