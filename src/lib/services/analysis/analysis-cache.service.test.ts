import { describe, it, expect, vi, beforeEach } from "vitest";
import { webcrypto } from "node:crypto";
import { AnalysisCacheService } from "./analysis-cache.service";
import type { TextAnalysisDto } from "../../../types";

const ensureCrypto = () => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  }
};

describe("AnalysisCacheService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCrypto();
  });

  it("should return cached result on cache hit", async () => {
    const cachedResult: TextAnalysisDto = {
      is_correct: true,
      gamification_result: "correct",
      original_text: "Test text",
      translation: null,
    };
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: cachedResult, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    const result = await service.get("  Test text  ", "grammar_and_spelling", "en", "en");
    const textHash = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText(
      "Test text"
    );

    expect(textHash).not.toBeNull();
    expect(result).toEqual(cachedResult);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_cached_analysis", {
      p_text_hash: textHash as string,
      p_mode: "grammar_and_spelling:v5:explanation-en",
      p_language: "en",
    });
  });

  it("should return null on cache miss", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    const result = await service.get("Missing", "grammar_and_spelling", "pl", "en");

    expect(result).toBeNull();
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_cached_analysis", expect.objectContaining({ p_language: "pl" }));
  });

  it("should keep cache lookups for the same text separate by language", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    await service.get("Ten sam tekst", "grammar_and_spelling", "en", "en");
    await service.get("Ten sam tekst", "grammar_and_spelling", "pl", "en");

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      1,
      "get_cached_analysis",
      expect.objectContaining({ p_language: "en" })
    );
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      2,
      "get_cached_analysis",
      expect.objectContaining({ p_language: "pl" })
    );
  });

  it("should keep cache lookups separate by explanation locale", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    await service.get("Same text", "grammar_and_spelling", "en", "en");
    await service.get("Same text", "grammar_and_spelling", "en", "pl");

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      1,
      "get_cached_analysis",
      expect.objectContaining({ p_mode: "grammar_and_spelling:v5:explanation-en" })
    );
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      2,
      "get_cached_analysis",
      expect.objectContaining({ p_mode: "grammar_and_spelling:v5:explanation-pl" })
    );
  });

  it("should store result in cache", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);
    const result: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "incorrect",
      original_text: "I are student",
      corrected_text: "I am a student",
      explanation: "Subject-verb agreement.",
      translation: null,
    };

    await service.set("  I are student  ", "grammar_and_spelling", "en", "en", result);
    const textHash = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText(
      "I are student"
    );

    expect(textHash).not.toBeNull();
    expect(mockSupabase.rpc).toHaveBeenCalledWith("set_cached_analysis", {
      p_text_hash: textHash as string,
      p_mode: "grammar_and_spelling:v5:explanation-en",
      p_language: "en",
      p_original_text: "I are student",
      p_result: result,
    });
  });

  it("should hash deterministically with trimming", async () => {
    const mockSupabase = {
      rpc: vi.fn(),
    };
    const service = new AnalysisCacheService(mockSupabase as never);
    const hashA = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText(
      " Test "
    );
    const hashB = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText("Test");

    expect(hashA).not.toBeNull();
    expect(hashB).not.toBeNull();
    expect(hashA).toBe(hashB);
  });
});
