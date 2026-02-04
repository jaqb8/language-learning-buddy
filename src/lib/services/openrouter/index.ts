import { OpenRouterService } from "./openrouter.service";
import { AIModelConfigService } from "../ai-config/ai-model-config.service";
import {
  OPENROUTER_API_KEY,
  ASTRO_SITE,
  APP_NAME,
  USE_MOCKS,
  AI_MODEL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS,
} from "astro:env/server";

export const aiModelConfigService = new AIModelConfigService(
  AI_MODEL,
  AI_TEMPERATURE ? parseFloat(String(AI_TEMPERATURE)) : undefined,
  AI_MAX_TOKENS ? parseInt(String(AI_MAX_TOKENS), 10) : undefined
);

export const openRouterService = new OpenRouterService({
  apiKey: USE_MOCKS ? "mock-api-key" : OPENROUTER_API_KEY,
  siteUrl: ASTRO_SITE,
  appName: APP_NAME,
  aiModelConfig: aiModelConfigService,
});

export { OpenRouterService } from "./openrouter.service";
export * from "./openrouter.errors";
export * from "./openrouter.types";
