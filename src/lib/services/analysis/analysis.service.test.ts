import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalysisService } from "./analysis.service";
import type { AIProvider, TextAnalysisDto } from "../../../types";

vi.mock("astro:env/server", () => ({
  USE_MOCKS: false,
}));

function createMockAIProvider(): AIProvider & { analyzeText: ReturnType<typeof vi.fn> } {
  return {
    analyzeText: vi.fn(),
  };
}

describe("AnalysisService", () => {
  let service: AnalysisService;
  let mockProvider: ReturnType<typeof createMockAIProvider>;
  const mockResponse: TextAnalysisDto = {
    is_correct: true,
    gamification_result: "correct",
    original_text: "Test text",
    translation: "Test tłumaczenie",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = createMockAIProvider();
    service = new AnalysisService(mockProvider);
  });

  it("should call aiProvider.analyzeText with correct parameters", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode);

    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
    expect(mockProvider.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should pass context to aiProvider.analyzeText when provided", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "Piszę email do mojego szefa";

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
    expect(mockProvider.analyzeText).toHaveBeenCalledWith(mode, text, analysisContext);
  });

  it("should pass undefined context when analysisContext is empty string", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "";

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
    expect(mockProvider.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should pass undefined context when analysisContext is only whitespace", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const analysisContext = "   ";

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
    expect(mockProvider.analyzeText).toHaveBeenCalledWith(mode, text, undefined);
  });

  it("should work with colloquial_speech mode", async () => {
    const text = "Hey, what's up?";
    const mode = "colloquial_speech";
    const analysisContext = "Piszę do przyjaciela";

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText(text, mode, analysisContext);

    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
    expect(mockProvider.analyzeText).toHaveBeenCalledWith(mode, text, analysisContext);
  });

  it("should propagate errors from aiProvider", async () => {
    const text = "I am a student.";
    const mode = "grammar_and_spelling";
    const error = new Error("provider error");

    mockProvider.analyzeText.mockRejectedValue(error);

    await expect(service.analyzeText(text, mode)).rejects.toThrow("provider error");
  });

  it("should normalize an incorrect result when corrected text is unchanged", async () => {
    const unchangedCorrection: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "minor_issue",
      original_text: "Yo, bro!",
      corrected_text: "Yo, bro!",
      explanation: "Brakuje wykrzyknika na końcu.",
      translation: "Yo, ziom!",
    };

    mockProvider.analyzeText.mockResolvedValue(unchangedCorrection);

    const result = await service.analyzeText("Yo, bro!", "grammar_and_spelling");

    expect(result).toEqual({
      is_correct: true,
      gamification_result: "correct",
      original_text: "Yo, bro!",
      translation: "Yo, ziom!",
    });
  });
});

describe("AnalysisService - cache integration", () => {
  let mockProvider: ReturnType<typeof createMockAIProvider>;
  const mockResponse: TextAnalysisDto = {
    is_correct: true,
    gamification_result: "correct",
    original_text: "Test text",
    translation: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = createMockAIProvider();
  });

  it("should skip cache when analysisContext is provided", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisService(mockProvider, mockSupabase as never);

    mockProvider.analyzeText.mockResolvedValue(mockResponse);

    await service.analyzeText("I am a student.", "grammar_and_spelling", "Piszę email do mojego szefa");

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    expect(mockProvider.analyzeText).toHaveBeenCalledTimes(1);
  });

  it("should return cached result when context is missing", async () => {
    const cachedResult: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "incorrect",
      original_text: "I are student",
      corrected_text: "I am a student",
      explanation: "Subject-verb agreement.",
      translation: null,
    };
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: cachedResult, error: null }),
    };
    const service = new AnalysisService(mockProvider, mockSupabase as never);

    const result = await service.analyzeText("I are student", "grammar_and_spelling");

    expect(result).toEqual(cachedResult);
    expect(mockProvider.analyzeText).not.toHaveBeenCalled();
  });

  it("should normalize an unchanged correction from cache", async () => {
    const cachedResult: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "minor_issue",
      original_text: "Yo, bro!",
      corrected_text: "Yo, bro!",
      explanation: "Brakuje wykrzyknika na końcu.",
      translation: "Yo, ziom!",
    };
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: cachedResult, error: null }),
    };
    const service = new AnalysisService(mockProvider, mockSupabase as never);

    const result = await service.analyzeText("Yo, bro!", "grammar_and_spelling");

    expect(result).toEqual({
      is_correct: true,
      gamification_result: "correct",
      original_text: "Yo, bro!",
      translation: "Yo, ziom!",
    });
    expect(mockProvider.analyzeText).not.toHaveBeenCalled();
  });
});
