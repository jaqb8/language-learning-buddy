import type { AnalysisMode, TextAnalysisDto } from "../../../types";
import { getMockAnalysis } from "./analysis.mocks";
import { openRouterService } from "../openrouter";
import {
  OpenRouterConfigurationError,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterInvalidRequestError,
  OpenRouterResponseValidationError,
  OpenRouterNetworkError,
} from "../openrouter";
import {
  AnalysisConfigurationError,
  AnalysisAuthenticationError,
  AnalysisRateLimitError,
  AnalysisInvalidRequestError,
  AnalysisValidationError,
  AnalysisNetworkError,
  AnalysisUnknownError,
} from "./analysis.errors";
import type { SupabaseClient } from "../../../db/supabase.client";
import { AnalysisCacheService } from "./analysis-cache.service";
import { USE_MOCKS } from "astro:env/server";

export class AnalysisService {
  private useMocks: boolean;
  private cacheService?: AnalysisCacheService;

  constructor(supabase?: SupabaseClient) {
    this.useMocks = USE_MOCKS;
    this.cacheService = supabase ? new AnalysisCacheService(supabase) : undefined;
  }

  async analyzeText(text: string, mode: AnalysisMode, analysisContext?: string): Promise<TextAnalysisDto> {
    if (this.useMocks) {
      return this.analyzeMocked(text, mode);
    }

    return this.analyzeWithAI(text, mode, analysisContext);
  }

  private async analyzeMocked(text: string, mode: AnalysisMode): Promise<TextAnalysisDto> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getMockAnalysis(text, mode);
  }

  private async analyzeWithAI(text: string, mode: AnalysisMode, analysisContext?: string): Promise<TextAnalysisDto> {
    const trimmedContext = analysisContext?.trim() || undefined;
    const shouldUseCache = !trimmedContext && this.cacheService;

    if (shouldUseCache) {
      try {
        const cachedResult = await this.cacheService?.get(text, mode);
        if (cachedResult) {
          return cachedResult;
        }
      } catch (error) {
        console.error("Cache lookup failed:", error);
      }
    }

    try {
      const result = await openRouterService.analyzeText(mode, text, trimmedContext);

      if (shouldUseCache) {
        try {
          await this.cacheService?.set(text, mode, result);
        } catch (error) {
          console.error("Cache save failed:", error);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof OpenRouterConfigurationError) {
        console.error("OpenRouter configuration error:", error.message);
        throw new AnalysisConfigurationError();
      }

      if (error instanceof OpenRouterAuthenticationError) {
        console.error("OpenRouter authentication error:", error.message);
        throw new AnalysisAuthenticationError();
      }

      if (error instanceof OpenRouterRateLimitError) {
        console.error("OpenRouter rate limit exceeded:", error.message);
        throw new AnalysisRateLimitError();
      }

      if (error instanceof OpenRouterInvalidRequestError) {
        console.error("OpenRouter invalid request:", error.message);
        throw new AnalysisInvalidRequestError();
      }

      if (error instanceof OpenRouterResponseValidationError) {
        console.error("OpenRouter response validation error:", error.message, error.validationErrors);
        throw new AnalysisValidationError(error.validationErrors);
      }

      if (error instanceof OpenRouterNetworkError) {
        console.error("OpenRouter network error:", error.message, error.cause);
        throw new AnalysisNetworkError(error.cause);
      }

      console.error("Unexpected error during text analysis:", error);
      throw new AnalysisUnknownError(error);
    }
  }
}
