/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { AppLocale } from "./lib/i18n.tsx";
import type { UserViewModel } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: UserViewModel | null;
      analysisQuota: { remaining: number; resetAt: string; limit: number } | null;
      locale: AppLocale;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLIC_KEY: string;
  readonly SUPABASE_SECRET_KEY: string;
  readonly DATA_ENCRYPTION_KEY_V1: string;
  readonly CACHE_HMAC_KEY_V1: string;
  readonly OPENROUTER_API_KEY: string;
  readonly USE_MOCKS?: string;
  readonly RATE_LIMIT_MAX_REQUESTS?: string;
  readonly RATE_LIMIT_WINDOW_MS?: string;
  readonly ANONYMOUS_DAILY_QUOTA: string;
  readonly ANONYMOUS_IP_SALT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
