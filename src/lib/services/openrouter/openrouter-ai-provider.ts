import type { AIProvider, AnalysisLanguage, AnalysisMode, TextAnalysisDto } from "../../../types";
import { DEFAULT_APP_LOCALE, type AppLocale } from "@/lib/i18n";
import type { OpenRouterService } from "./openrouter.service";
import {
  OpenRouterConfigurationError,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterInvalidRequestError,
  OpenRouterResponseValidationError,
  OpenRouterNetworkError,
} from "./openrouter.errors";
import {
  AnalysisConfigurationError,
  AnalysisAuthenticationError,
  AnalysisRateLimitError,
  AnalysisInvalidRequestError,
  AnalysisValidationError,
  AnalysisNetworkError,
  AnalysisUnknownError,
} from "../analysis/analysis.errors";

export class OpenRouterAIProvider implements AIProvider {
  constructor(private readonly service: OpenRouterService) {}

  async analyzeText(
    mode: AnalysisMode,
    language: AnalysisLanguage,
    text: string,
    context?: string,
    explanationLocale?: AppLocale
  ): Promise<TextAnalysisDto> {
    try {
      return explanationLocale && explanationLocale !== DEFAULT_APP_LOCALE
        ? await this.service.analyzeText(mode, language, text, context, explanationLocale)
        : await this.service.analyzeText(mode, language, text, context);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof OpenRouterConfigurationError) {
      console.error("OpenRouter configuration error:", (error as Error).message);
      return new AnalysisConfigurationError();
    }

    if (error instanceof OpenRouterAuthenticationError) {
      console.error("OpenRouter authentication error:", (error as Error).message);
      return new AnalysisAuthenticationError();
    }

    if (error instanceof OpenRouterRateLimitError) {
      console.error("OpenRouter rate limit exceeded:", (error as Error).message);
      return new AnalysisRateLimitError();
    }

    if (error instanceof OpenRouterInvalidRequestError) {
      console.error("OpenRouter invalid request:", (error as Error).message);
      return new AnalysisInvalidRequestError();
    }

    if (error instanceof OpenRouterResponseValidationError) {
      console.error("OpenRouter response validation error:", (error as Error).message, error.validationErrors);
      return new AnalysisValidationError(error.validationErrors);
    }

    if (error instanceof OpenRouterNetworkError) {
      console.error("OpenRouter network error:", (error as Error).message, error.cause);
      return new AnalysisNetworkError(error.cause);
    }

    console.error("Unexpected error during text analysis:", error);
    return new AnalysisUnknownError(error);
  }
}
