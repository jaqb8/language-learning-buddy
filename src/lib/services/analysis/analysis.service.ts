import type { AIProvider, AnalysisLanguage, AnalysisMode, TextAnalysisDto } from "../../../types";
import { getMockAnalysis } from "./analysis.mocks";
import type { AnalysisCacheService } from "./analysis-cache.service";
import { USE_MOCKS } from "astro:env/server";
import { normalizeAnalysisResult } from "@/lib/analysis-gamification";
import { DEFAULT_APP_LOCALE, type AppLocale } from "@/lib/i18n";

export class AnalysisService {
  private useMocks: boolean;
  private cacheService?: AnalysisCacheService;

  constructor(
    private readonly aiProvider: AIProvider,
    cacheService?: AnalysisCacheService
  ) {
    this.useMocks = USE_MOCKS;
    this.cacheService = cacheService;
  }

  async analyzeText(
    text: string,
    mode: AnalysisMode,
    language: AnalysisLanguage,
    analysisContext?: string,
    explanationLocale: AppLocale = DEFAULT_APP_LOCALE
  ): Promise<TextAnalysisDto> {
    if (this.useMocks) {
      return this.analyzeMocked(text, mode, language, explanationLocale);
    }

    return this.analyzeWithAI(text, mode, language, analysisContext, explanationLocale);
  }

  private async analyzeMocked(
    text: string,
    mode: AnalysisMode,
    language: AnalysisLanguage,
    explanationLocale: AppLocale
  ): Promise<TextAnalysisDto> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getMockAnalysis(text, mode, language, explanationLocale);
  }

  private async analyzeWithAI(
    text: string,
    mode: AnalysisMode,
    language: AnalysisLanguage,
    analysisContext: string | undefined,
    explanationLocale: AppLocale
  ): Promise<TextAnalysisDto> {
    const trimmedContext = analysisContext?.trim() || undefined;
    const shouldUseCache = !trimmedContext && this.cacheService;

    if (shouldUseCache) {
      try {
        const cachedResult = await this.cacheService?.get(text, mode, language, explanationLocale);
        if (cachedResult) {
          return normalizeAnalysisResult(cachedResult);
        }
      } catch (error) {
        console.error("Cache lookup failed:", error);
      }
    }

    const result = normalizeAnalysisResult(
      await this.aiProvider.analyzeText(mode, language, text, trimmedContext, explanationLocale)
    );

    if (shouldUseCache) {
      try {
        await this.cacheService?.set(text, mode, language, explanationLocale, result);
      } catch (error) {
        console.error("Cache save failed:", error);
      }
    }

    return result;
  }
}
