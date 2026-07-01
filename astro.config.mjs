// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  devToolbar: {
    enabled: false,
  },
  server: { host: "0.0.0.0", port: 3000 },
  env: {
    schema: {
      PUBLIC_ENV_NAME: envField.string({ context: "client", access: "public" }),
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_PUBLIC_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SECRET_KEY: envField.string({ context: "server", access: "secret" }),
      DATA_ENCRYPTION_KEY_V1: envField.string({ context: "server", access: "secret" }),
      CACHE_HMAC_KEY_V1: envField.string({ context: "server", access: "secret" }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret", default: "mock-api-key" }),
      ASTRO_SITE: envField.string({ context: "server", access: "public", default: "http://localhost:3000" }),
      APP_NAME: envField.string({ context: "server", access: "public", default: "Language Learning Buddy" }),
      USE_MOCKS: envField.boolean({ context: "server", access: "public", default: true }),
      RATE_LIMIT_MAX_REQUESTS: envField.number({ context: "server", access: "public", default: 10 }),
      RATE_LIMIT_WINDOW_MS: envField.number({ context: "server", access: "public", default: 60000 }),
      ANONYMOUS_DAILY_QUOTA: envField.number({ context: "server", access: "public", default: 5 }),
      ANONYMOUS_IP_SALT: envField.string({ context: "server", access: "secret", default: "default-insecure-salt" }),
      AI_MODEL: envField.string({ context: "server", access: "public", default: "x-ai/grok-4.3" }),
      AI_TEMPERATURE: envField.string({ context: "server", access: "public", default: "0.3" }),
      AI_MAX_TOKENS: envField.string({ context: "server", access: "public", default: "1000" }),
    },
    validateSecrets: true,
  },
  vite: {
    server: {
      allowedHosts: ["rpi2.host.local"],
    },
    plugins: [tailwindcss()],
    resolve: {
      // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
      // Without this, MessageChannel from node:worker_threads needs to be polyfilled.
      alias: import.meta.env.PROD
        ? {
            "react-dom/server": "react-dom/server.edge",
          }
        : undefined,
    },
  },
  adapter: cloudflare(),
});
