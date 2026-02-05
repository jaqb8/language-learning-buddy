import { z, type ZodSchema } from "zod";
import type { AnalysisMode, TextAnalysisDto, AIModelConfig, AnalysisModeConfig } from "../../../types";
import { ANALYSIS_MODES } from "../../../types";
import { ANALYSIS_MODE_DEFINITIONS } from "@/lib/analysis-mode.constants";
import grammarPrompt from "@/lib/prompts/grammar-analysis.prompt.md?raw";
import colloquialPrompt from "@/lib/prompts/colloquial-speech.prompt.md?raw";
import betaGrammarPrompt from "@/lib/prompts/beta-grammar-analysis.prompt.md?raw";
import betaColloquialPrompt from "@/lib/prompts/beta-colloquial-speech.prompt.md?raw";

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
]) as ZodSchema<TextAnalysisDto>;

const PROMPTS: Record<AnalysisMode, string> = {
  [ANALYSIS_MODES.GRAMMAR_AND_SPELLING]: grammarPrompt,
  [ANALYSIS_MODES.COLLOQUIAL_SPEECH]: colloquialPrompt,
  [ANALYSIS_MODES.BETA_GRAMMAR_AND_SPELLING]: betaGrammarPrompt,
  [ANALYSIS_MODES.BETA_COLLOQUIAL_SPEECH]: betaColloquialPrompt,
};

const ANALYSIS_MODE_CONFIGS = Object.fromEntries(
  ANALYSIS_MODE_DEFINITIONS.map((mode) => [mode.value, { prompt: PROMPTS[mode.value], schema: TextAnalysisSchema }])
) as Record<AnalysisMode, AnalysisModeConfig>;

/**
 * Service for managing AI configuration.
 * Provides centralized handling of model parameters (model name, temperature, max tokens)
 * and analysis mode configurations (prompts, schemas).
 * Supports fallback to sensible defaults.
 */
export class AIConfigService {
  private readonly modelName: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  /**
   * @param modelName - OpenRouter model name (default: x-ai/grok-4.1-fast)
   * @param temperature - Temperature parameter (default: 0.3)
   * @param maxTokens - Maximum number of tokens (default: 1000)
   */
  constructor(modelName?: string, temperature?: number, maxTokens?: number) {
    this.modelName = modelName?.trim() || "x-ai/grok-4.1-fast";
    this.temperature = temperature ?? 0.3;
    this.maxTokens = maxTokens ?? 1000;
  }

  /**
   * Returns the complete model configuration.
   */
  getModelConfig(): AIModelConfig {
    return {
      modelName: this.modelName,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }

  /**
   * Returns the model name.
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Returns the temperature parameter.
   */
  getTemperature(): number {
    return this.temperature;
  }

  /**
   * Returns the max tokens parameter.
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /**
   * Returns the configuration for a specific analysis mode.
   * @param mode - The analysis mode
   */
  getAnalysisModeConfig(mode: AnalysisMode): AnalysisModeConfig {
    return ANALYSIS_MODE_CONFIGS[mode];
  }

  /**
   * Returns the prompt for a specific analysis mode.
   * @param mode - The analysis mode
   */
  getPrompt(mode: AnalysisMode): string {
    return ANALYSIS_MODE_CONFIGS[mode].prompt;
  }

  /**
   * Returns the response schema for a specific analysis mode.
   * @param mode - The analysis mode
   */
  getResponseSchema(mode: AnalysisMode): ZodSchema<TextAnalysisDto> {
    return ANALYSIS_MODE_CONFIGS[mode].schema;
  }
}
