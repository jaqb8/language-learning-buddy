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
import { z } from "zod";
import grammarPrompt from "@/lib/prompts/grammar-analysis.prompt.md?raw";
import colloquialPrompt from "@/lib/prompts/colloquial-speech.prompt.md?raw";
import { USE_MOCKS } from "astro:env/server";

const TextAnalysisSchema = z.discriminatedUnion("is_correct", [
  z.object({
    is_correct: z.literal(true),
    original_text: z.string(),
    translation: z.string().nullable().optional(),
  }),
  z.object({
    is_correct: z.literal(false),
    original_text: z.string(),
    corrected_text: z.string(),
    explanation: z.string(),
    translation: z.string().nullable().optional(),
  }),
]);

const ANALYSIS_PROMPTS: Record<AnalysisMode, string> = {
  grammar_and_spelling: grammarPrompt,
  colloquial_speech: colloquialPrompt,
};

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
    const systemPrompt = ANALYSIS_PROMPTS[mode];
    const trimmedContext = analysisContext?.trim();
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

    let userMessage: string;
    if (trimmedContext) {
      userMessage = `Tekst do analizy:\n${text}\n\nKontekst użytkownika:\n${trimmedContext}`;
    } else {
      userMessage = text;
    }

    try {
      const result = await openRouterService.getChatCompletion({
        model: "x-ai/grok-4.1-fast",
        systemMessage: systemPrompt,
        userMessage,
        responseSchema: TextAnalysisSchema,
      });

      const normalizedResult = {
        ...result,
        translation: result.translation ?? null,
      };

      if (shouldUseCache) {
        try {
          await this.cacheService?.set(text, mode, normalizedResult);
        } catch (error) {
          console.error("Cache save failed:", error);
        }
      }

      return normalizedResult;
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
