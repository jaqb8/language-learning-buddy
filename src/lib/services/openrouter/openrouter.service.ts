import type { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  OpenRouterConfigurationError,
  OpenRouterApiError,
  OpenRouterAuthenticationError,
  OpenRouterRateLimitError,
  OpenRouterInvalidRequestError,
  OpenRouterResponseValidationError,
  OpenRouterNetworkError,
} from "./openrouter.errors";
import type {
  ChatCompletionParams,
  OpenRouterMessage,
  OpenRouterRequestBody,
  OpenRouterResponse,
} from "./openrouter.types";
import type { AIModelConfigService } from "../ai-config/ai-model-config.service";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_TOKENS_LIMIT = 4096;

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly appName: string;
  private readonly aiModelConfig: AIModelConfigService;

  constructor(config: { apiKey: string; siteUrl: string; appName: string; aiModelConfig: AIModelConfigService }) {
    if (!config.apiKey) {
      console.error("No OpenRouter API key provided.");
      throw new OpenRouterConfigurationError();
    }
    this.apiKey = config.apiKey;
    this.siteUrl = config.siteUrl;
    this.appName = config.appName;
    this.aiModelConfig = config.aiModelConfig;
  }

  async getChatCompletion<T>(params: ChatCompletionParams<T>): Promise<T> {
    const { model, systemMessage, userMessage, responseSchema, temperature, maxTokens } = params;

    if (maxTokens && maxTokens > MAX_TOKENS_LIMIT) {
      console.error(`Parametr maxTokens przekracza dozwolony limit ${MAX_TOKENS_LIMIT}`);
      throw new OpenRouterInvalidRequestError();
    }

    const requestBody = this.buildRequestBody({
      model,
      systemMessage,
      userMessage,
      responseSchema,
      temperature,
      maxTokens,
    });

    const headers = this.buildHeaders();

    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error("Błąd sieci podczas komunikacji z OpenRouter API", error);
      throw new OpenRouterNetworkError(error);
    }

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    let responseData: OpenRouterResponse;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error("Błąd parsowania odpowiedzi JSON z OpenRouter API", error);
      throw new OpenRouterNetworkError(error);
    }

    const content = this.extractContent(responseData);
    const parsedContent = this.parseContent(content);
    const validatedData = this.validateResponse(parsedContent, responseSchema);

    return validatedData;
  }

  private buildRequestBody<T>(params: {
    model: string;
    systemMessage: string;
    userMessage: string;
    responseSchema: ZodSchema<T>;
    temperature?: number;
    maxTokens?: number;
  }): OpenRouterRequestBody {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: params.systemMessage },
      { role: "user", content: params.userMessage },
    ];

    const jsonSchema = zodToJsonSchema(params.responseSchema, {
      name: "response",
    });

    const temperature = params.temperature ?? this.aiModelConfig.getTemperature();
    const maxTokens = params.maxTokens ?? this.aiModelConfig.getMaxTokens();

    const requestBody: OpenRouterRequestBody = {
      model: params.model,
      messages,
      reasoning: {
        enabled: false,
      },
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analysis",
          strict: true,
          schema: jsonSchema,
        },
      },
      temperature,
      max_tokens: maxTokens,
    };

    return requestBody;
  }

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": this.siteUrl,
      "X-Title": this.appName,
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `OpenRouter API zwróciło błąd: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing errors for error responses
    }

    console.error(errorMessage);

    switch (response.status) {
      case 401:
        throw new OpenRouterAuthenticationError();
      case 429:
        throw new OpenRouterRateLimitError();
      case 400:
        throw new OpenRouterInvalidRequestError();
      default:
        throw new OpenRouterApiError(response.status);
    }
  }

  private extractContent(responseData: OpenRouterResponse): string {
    if (
      !responseData.choices ||
      !responseData.choices[0] ||
      !responseData.choices[0].message ||
      !responseData.choices[0].message.content
    ) {
      console.error("Odpowiedź z OpenRouter API nie zawiera oczekiwanej struktury");
      throw new OpenRouterResponseValidationError();
    }

    return responseData.choices[0].message.content;
  }

  private parseContent(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Nie udało się sparsować odpowiedzi jako JSON", error);
      throw new OpenRouterResponseValidationError(error);
    }
  }

  private validateResponse<T>(data: unknown, schema: ZodSchema<T>): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error("Odpowiedź z API nie pasuje do oczekiwanego schematu", result.error.errors);
      throw new OpenRouterResponseValidationError(result.error.errors);
    }

    return result.data;
  }
}
