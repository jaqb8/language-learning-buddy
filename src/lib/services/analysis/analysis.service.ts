import type { AIProvider, AnalysisMode, TextAnalysisDto } from "../../../types";
import { getMockAnalysis } from "./analysis.mocks";
import type { SupabaseClient } from "../../../db/supabase.client";
import { AnalysisCacheService } from "./analysis-cache.service";
import { USE_MOCKS } from "astro:env/server";

export class AnalysisService {
  private useMocks: boolean;
  private cacheService?: AnalysisCacheService;

  constructor(
    private readonly aiProvider: AIProvider,
    supabase?: SupabaseClient
  ) {
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

    const result = await this.aiProvider.analyzeText(mode, text, trimmedContext);

    if (shouldUseCache) {
      try {
        await this.cacheService?.set(text, mode, result);
      } catch (error) {
        console.error("Cache save failed:", error);
      }
    }

    return result;
  }
}
