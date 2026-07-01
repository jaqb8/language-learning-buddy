import type { SupabaseClient } from "../../../db/supabase.client";
import type { AnalysisLanguage, AnalysisMode, TextAnalysisDto } from "../../../types";
import type { AppLocale } from "@/lib/i18n";
import {
  analysisCacheAad,
  type CacheLookupHmac,
  SensitiveDataDecryptionError,
  type SensitiveDataCrypto,
} from "@/lib/crypto/sensitive-data.crypto";

const ANALYSIS_CACHE_VERSION = "v5";

export class AnalysisCacheService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly sensitiveDataCrypto: SensitiveDataCrypto,
    private readonly cacheLookupHmac: CacheLookupHmac
  ) {}

  async get(
    text: string,
    mode: AnalysisMode,
    language: AnalysisLanguage,
    explanationLocale: AppLocale
  ): Promise<TextAnalysisDto | null> {
    const lookupDigest = await this.createLookupDigest(text);
    const versionedMode = this.getVersionedMode(mode, explanationLocale);

    const { data, error } = await this.supabase.rpc("get_cached_analysis", {
      p_lookup_digest: lookupDigest,
      p_mode: versionedMode,
      p_language: language,
    });

    if (error) {
      console.error("Cache lookup RPC failed:", error.code ?? "unknown");
      return null;
    }

    if (!data) {
      return null;
    }

    try {
      return await this.sensitiveDataCrypto.decryptJson<TextAnalysisDto>(
        data,
        analysisCacheAad(lookupDigest, versionedMode, language)
      );
    } catch (error) {
      console.error(
        "Cached analysis decryption failed:",
        error instanceof SensitiveDataDecryptionError ? error.message : "unknown"
      );
      return null;
    }
  }

  async set(
    text: string,
    mode: AnalysisMode,
    language: AnalysisLanguage,
    explanationLocale: AppLocale,
    result: TextAnalysisDto
  ): Promise<void> {
    const lookupDigest = await this.createLookupDigest(text);
    const versionedMode = this.getVersionedMode(mode, explanationLocale);
    const encryptedResult = await this.sensitiveDataCrypto.encryptJson(
      result,
      analysisCacheAad(lookupDigest, versionedMode, language)
    );

    const { error } = await this.supabase.rpc("set_cached_analysis", {
      p_lookup_digest: lookupDigest,
      p_mode: versionedMode,
      p_language: language,
      p_encrypted_result: encryptedResult,
    });

    if (error) {
      console.error("Cache save RPC failed:", error.code ?? "unknown");
    }
  }

  private createLookupDigest(text: string): Promise<string> {
    return this.cacheLookupHmac.digest(text.trim());
  }

  private getVersionedMode(mode: AnalysisMode, explanationLocale: AppLocale): string {
    return `${mode}:${ANALYSIS_CACHE_VERSION}:explanation-${explanationLocale}`;
  }
}
