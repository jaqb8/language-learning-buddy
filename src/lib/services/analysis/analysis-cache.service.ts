import type { SupabaseClient } from "../../../db/supabase.client";
import type { AnalysisMode, TextAnalysisDto } from "../../../types";

const ANALYSIS_CACHE_VERSION = "v2";

export class AnalysisCacheService {
  constructor(private readonly supabase: SupabaseClient) {}

  async get(text: string, mode: AnalysisMode): Promise<TextAnalysisDto | null> {
    let textHash: string | null = null;
    try {
      textHash = await this.hashText(text);
    } catch (error) {
      console.error("Cache hashing failed:", error);
      return null;
    }

    if (!textHash) {
      return null;
    }

    const { data, error } = await this.supabase.rpc("get_cached_analysis", {
      p_text_hash: textHash,
      p_mode: this.getVersionedMode(mode),
    });

    if (error) {
      console.error("Cache error in getCachedAnalysis:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data as TextAnalysisDto;
  }

  async set(text: string, mode: AnalysisMode, result: TextAnalysisDto): Promise<void> {
    let textHash: string | null = null;
    try {
      textHash = await this.hashText(text);
    } catch (error) {
      console.error("Cache hashing failed:", error);
      return;
    }

    if (!textHash) {
      return;
    }

    const normalizedText = text.trim();
    const { error } = await this.supabase.rpc("set_cached_analysis", {
      p_text_hash: textHash,
      p_mode: this.getVersionedMode(mode),
      p_original_text: normalizedText,
      p_result: result,
    });

    if (error) {
      console.error("Cache error in setCachedAnalysis:", error);
    }
  }

  private async hashText(text: string): Promise<string | null> {
    const normalizedText = text.trim();
    const encodedText = new TextEncoder().encode(normalizedText);
    const webCrypto = await this.getWebCrypto();
    if (!webCrypto) {
      return null;
    }

    const hashBuffer = await webCrypto.subtle.digest("SHA-256", encodedText);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  private getVersionedMode(mode: AnalysisMode): string {
    return `${mode}:${ANALYSIS_CACHE_VERSION}`;
  }

  private async getWebCrypto(): Promise<Crypto | null> {
    if (globalThis.crypto?.subtle) {
      return globalThis.crypto;
    }

    try {
      const { webcrypto } = await import("node:crypto");
      return webcrypto as Crypto;
    } catch (error) {
      console.error("WebCrypto unavailable:", error);
      return null;
    }
  }
}
