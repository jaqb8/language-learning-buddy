import { OpenRouterService } from "./openrouter.service";
import { AIConfigService } from "../ai-config/ai-config.service";
import {
  OPENROUTER_API_KEY,
  ASTRO_SITE,
  APP_NAME,
  USE_MOCKS,
  AI_MODEL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS,
} from "astro:env/server";

function parseTemperature(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 2) return undefined;
  return parsed;
}

const MAX_TOKENS_LIMIT = 4096;

function parseMaxTokens(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return undefined;
  return Math.min(parsed, MAX_TOKENS_LIMIT);
}

export const aiConfigService = new AIConfigService(
  AI_MODEL,
  parseTemperature(AI_TEMPERATURE),
  parseMaxTokens(AI_MAX_TOKENS)
);

export const openRouterService = new OpenRouterService({
  apiKey: USE_MOCKS ? "mock-api-key" : OPENROUTER_API_KEY,
  siteUrl: ASTRO_SITE,
  appName: APP_NAME,
  aiConfig: aiConfigService,
});

export { OpenRouterService } from "./openrouter.service";
export * from "./openrouter.errors";
export * from "./openrouter.types";
