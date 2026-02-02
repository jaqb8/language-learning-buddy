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
      original_text: "Test text",
      translation: null,
    };
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: cachedResult, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    const result = await service.get("  Test text  ", "grammar_and_spelling");
    const textHash = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText(
      "Test text"
    );

    expect(textHash).not.toBeNull();
    expect(result).toEqual(cachedResult);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_cached_analysis", {
      p_text_hash: textHash as string,
      p_mode: "grammar_and_spelling",
    });
  });

  it("should return null on cache miss", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);

    const result = await service.get("Missing", "grammar_and_spelling");

    expect(result).toBeNull();
  });

  it("should store result in cache", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const service = new AnalysisCacheService(mockSupabase as never);
    const result: TextAnalysisDto = {
      is_correct: false,
      original_text: "I are student",
      corrected_text: "I am a student",
      explanation: "Subject-verb agreement.",
      translation: null,
    };

    await service.set("  I are student  ", "grammar_and_spelling", result);
    const textHash = await (service as unknown as { hashText: (text: string) => Promise<string | null> }).hashText(
      "I are student"
    );

    expect(textHash).not.toBeNull();
    expect(mockSupabase.rpc).toHaveBeenCalledWith("set_cached_analysis", {
      p_text_hash: textHash as string,
      p_mode: "grammar_and_spelling",
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
