export interface AIModelConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Service for managing AI model configuration.
 * Provides centralized handling of model parameters (model name, temperature, max tokens).
 * Supports fallback to sensible defaults.
 */
export class AIModelConfigService {
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
  getConfig(): AIModelConfig {
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
}
