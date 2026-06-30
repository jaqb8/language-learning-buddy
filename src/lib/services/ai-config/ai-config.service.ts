import { z, type ZodSchema } from "zod";
import type {
  AnalysisLanguage,
  AnalysisMode,
  TextAnalysisDto,
  AIModelConfig,
  AnalysisModeConfig,
} from "../../../types";
import { ANALYSIS_LANGUAGES, ANALYSIS_MODES } from "../../../types";
import grammarPrompt from "@/lib/prompts/grammar-analysis.prompt.md?raw";
import colloquialPrompt from "@/lib/prompts/colloquial-speech.prompt.md?raw";
import polishGrammarPrompt from "@/lib/prompts/polish-grammar-analysis.prompt.md?raw";
import polishColloquialPrompt from "@/lib/prompts/polish-colloquial-speech.prompt.md?raw";
import { DEFAULT_APP_LOCALE, type AppLocale } from "@/lib/i18n";

const TextAnalysisSchema = z.discriminatedUnion("is_correct", [
  z.object({
    is_correct: z.literal(true),
    gamification_result: z.literal("correct"),
    original_text: z.string(),
    translation: z.string().nullable().optional(),
  }),
  z.object({
    is_correct: z.literal(false),
    gamification_result: z.enum(["minor_issue", "incorrect"]),
    original_text: z.string(),
    corrected_text: z.string(),
    explanation: z.string(),
    translation: z.string().nullable().optional(),
  }),
]) as ZodSchema<TextAnalysisDto>;

const PROMPTS: Record<AnalysisLanguage, Record<AnalysisMode, string>> = {
  [ANALYSIS_LANGUAGES.ENGLISH]: {
    [ANALYSIS_MODES.GRAMMAR_AND_SPELLING]: grammarPrompt,
    [ANALYSIS_MODES.COLLOQUIAL_SPEECH]: colloquialPrompt,
  },
  [ANALYSIS_LANGUAGES.POLISH]: {
    [ANALYSIS_MODES.GRAMMAR_AND_SPELLING]: polishGrammarPrompt,
    [ANALYSIS_MODES.COLLOQUIAL_SPEECH]: polishColloquialPrompt,
  },
};

const ANALYSIS_MODE_CONFIGS = Object.fromEntries(
  Object.entries(PROMPTS).map(([language, prompts]) => [
    language,
    Object.fromEntries(Object.entries(prompts).map(([mode, prompt]) => [mode, { prompt, schema: TextAnalysisSchema }])),
  ])
) as Record<AnalysisLanguage, Record<AnalysisMode, AnalysisModeConfig>>;

function localizeExplanationPrompt(prompt: string, explanationLocale: AppLocale): string {
  const values =
    explanationLocale === "pl"
      ? {
          instruction: "`explanation` musi być napisane w całości po polsku.",
          markdownLabel: "Markdown po POLSKU",
          example: "POLSKIE_WYJAŚNIENIE",
        }
      : {
          instruction: "`explanation` musi być napisane w całości po angielsku.",
          markdownLabel: "Markdown po ANGIELSKU",
          example: "ANGIELSKIE_WYJAŚNIENIE",
        };

  return prompt
    .replaceAll("{{EXPLANATION_INSTRUCTION}}", values.instruction)
    .replaceAll("{{EXPLANATION_MARKDOWN_LABEL}}", values.markdownLabel)
    .replaceAll("{{EXPLANATION_EXAMPLE}}", values.example);
}

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
  getAnalysisModeConfig(
    mode: AnalysisMode,
    language: AnalysisLanguage,
    explanationLocale: AppLocale = DEFAULT_APP_LOCALE
  ): AnalysisModeConfig {
    const config = ANALYSIS_MODE_CONFIGS[language][mode];
    return {
      ...config,
      prompt: localizeExplanationPrompt(config.prompt, explanationLocale),
    };
  }

  /**
   * Returns the prompt for a specific analysis mode.
   * @param mode - The analysis mode
   */
  getPrompt(mode: AnalysisMode, language: AnalysisLanguage, explanationLocale: AppLocale = DEFAULT_APP_LOCALE): string {
    return this.getAnalysisModeConfig(mode, language, explanationLocale).prompt;
  }

  /**
   * Returns the response schema for a specific analysis mode.
   * @param mode - The analysis mode
   */
  getResponseSchema(mode: AnalysisMode, language: AnalysisLanguage): ZodSchema<TextAnalysisDto> {
    return this.getAnalysisModeConfig(mode, language).schema;
  }
}
