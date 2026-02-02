import type { SupabaseClient } from "../../../db/supabase.client";
import type { AnalysisMode, TextAnalysisDto } from "../../../types";

export class AnalysisCacheService {
  constructor(private readonly supabase: SupabaseClient) {}

  async get(text: string, mode: AnalysisMode): Promise<TextAnalysisDto | null> {
    const textHash = await this.hashText(text);
    const { data, error } = await this.supabase.rpc("get_cached_analysis", {
      p_text_hash: textHash,
      p_mode: mode,
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
    const textHash = await this.hashText(text);
    const normalizedText = text.trim();
    const { error } = await this.supabase.rpc("set_cached_analysis", {
      p_text_hash: textHash,
      p_mode: mode,
      p_original_text: normalizedText,
      p_result: result,
    });

    if (error) {
      console.error("Cache error in setCachedAnalysis:", error);
    }
  }

  private async hashText(text: string): Promise<string> {
    const normalizedText = text.trim();
    const encodedText = new TextEncoder().encode(normalizedText);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", encodedText);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}
