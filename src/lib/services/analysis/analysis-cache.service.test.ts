import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisCacheService } from "./analysis-cache.service";
import { CacheLookupHmac, SensitiveDataCrypto, analysisCacheAad } from "@/lib/crypto/sensitive-data.crypto";
import type { TextAnalysisDto } from "../../../types";

const ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const HMAC_KEY = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";
const VERSIONED_MODE = "grammar_and_spelling:v5:explanation-en";

async function createEncryptedCachedResult(result: TextAnalysisDto, text: string, language: "en" | "pl" = "en") {
  const hmac = new CacheLookupHmac(HMAC_KEY);
  const lookupDigest = await hmac.digest(text.trim());
  const encrypted = await new SensitiveDataCrypto(ENCRYPTION_KEY).encryptJson(
    result,
    analysisCacheAad(lookupDigest, VERSIONED_MODE, language)
  );
  return { encrypted, lookupDigest };
}

function createService(mockSupabase: { rpc: ReturnType<typeof vi.fn> }) {
  return new AnalysisCacheService(
    mockSupabase as never,
    new SensitiveDataCrypto(ENCRYPTION_KEY),
    new CacheLookupHmac(HMAC_KEY)
  );
}

describe("AnalysisCacheService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a decrypted result on cache hit", async () => {
    const cachedResult: TextAnalysisDto = {
      is_correct: true,
      gamification_result: "correct",
      original_text: "Test text",
      translation: null,
    };
    const { encrypted, lookupDigest } = await createEncryptedCachedResult(cachedResult, "Test text");
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: encrypted, error: null }) };
    const service = createService(mockSupabase);

    await expect(service.get("  Test text  ", "grammar_and_spelling", "en", "en")).resolves.toEqual(cachedResult);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_cached_analysis", {
      p_lookup_digest: lookupDigest,
      p_mode: VERSIONED_MODE,
      p_language: "en",
    });
  });

  it("returns null on a cache miss", async () => {
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const service = createService(mockSupabase);

    await expect(service.get("Missing", "grammar_and_spelling", "pl", "en")).resolves.toBeNull();
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_cached_analysis", expect.objectContaining({ p_language: "pl" }));
  });

  it("keeps cache lookups separate by language and explanation locale", async () => {
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const service = createService(mockSupabase);

    await service.get("Same text", "grammar_and_spelling", "en", "en");
    await service.get("Same text", "grammar_and_spelling", "pl", "pl");

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      1,
      "get_cached_analysis",
      expect.objectContaining({ p_language: "en", p_mode: "grammar_and_spelling:v5:explanation-en" })
    );
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      2,
      "get_cached_analysis",
      expect.objectContaining({ p_language: "pl", p_mode: "grammar_and_spelling:v5:explanation-pl" })
    );
  });

  it("stores only an encrypted result and a keyed lookup digest", async () => {
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const service = createService(mockSupabase);
    const result: TextAnalysisDto = {
      is_correct: false,
      gamification_result: "incorrect",
      original_text: "I are student",
      corrected_text: "I am a student",
      explanation: "Subject-verb agreement.",
      translation: null,
    };

    await service.set("  I are student  ", "grammar_and_spelling", "en", "en", result);

    const call = mockSupabase.rpc.mock.calls[0];
    expect(call[0]).toBe("set_cached_analysis");
    expect(call[1]).toEqual({
      p_lookup_digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_mode: VERSIONED_MODE,
      p_language: "en",
      p_encrypted_result: expect.stringMatching(/^enc:v1:/),
    });
    expect(JSON.stringify(call[1])).not.toContain("I are student");
    expect(JSON.stringify(call[1])).not.toContain("Subject-verb agreement");
  });

  it("treats a corrupted encrypted result as a cache miss", async () => {
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: "enc:v1:invalid:invalid", error: null }) };
    const service = createService(mockSupabase);

    await expect(service.get("Test", "grammar_and_spelling", "en", "en")).resolves.toBeNull();
  });

  it("creates deterministic HMAC digests after trimming", async () => {
    const mockSupabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const service = createService(mockSupabase);

    await service.get(" Test ", "grammar_and_spelling", "en", "en");
    await service.get("Test", "grammar_and_spelling", "en", "en");

    expect(mockSupabase.rpc.mock.calls[0][1].p_lookup_digest).toBe(mockSupabase.rpc.mock.calls[1][1].p_lookup_digest);
  });
});
