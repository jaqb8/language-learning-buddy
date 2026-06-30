import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, DEFAULT_USER_ID } from "../db/supabase.client.ts";
import { analysisRateLimiter } from "../lib/rate-limiter.ts";
import { DailyQuotaService } from "../lib/services/daily-quota";
import { createErrorResponse } from "@/lib/api-helpers.ts";
import { getClientIP } from "@/lib/utils.ts";
import { ANONYMOUS_DAILY_QUOTA } from "astro:env/server";
import { APP_LOCALE_COOKIE, normalizeAppLocale } from "@/lib/i18n";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

const PRIVATE_PATHS = ["/learning-list"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  locals.locale = normalizeAppLocale(cookies.get(APP_LOCALE_COOKIE)?.value);

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    url,
  });

  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email!,
      id: user.id,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    };
  } else {
    locals.user = null;
  }

  if (user && AUTH_PAGES.includes(url.pathname)) {
    return redirect("/");
  }

  if (!user && PRIVATE_PATHS.some((path) => url.pathname.startsWith(path))) {
    return redirect("/login");
  }

  if (url.pathname === "/api/analyze") {
    if (locals.user) {
      const userId = locals.user.id || DEFAULT_USER_ID;

      if (!analysisRateLimiter.isAllowed(userId)) {
        const timeUntilReset = analysisRateLimiter.getTimeUntilReset(userId);

        return createErrorResponse("rate_limit_error", 429, {
          time_until_reset: timeUntilReset,
        });
      }

      locals.analysisQuota = null;
    } else {
      const clientIP = getClientIP(request);
      const dailyQuotaService = new DailyQuotaService(supabase);

      try {
        const result = await dailyQuotaService.checkAndIncrementAnonymousUsage(clientIP);

        if (!result.allowed) {
          locals.analysisQuota = {
            remaining: result.remaining,
            resetAt: result.resetAt,
            limit: ANONYMOUS_DAILY_QUOTA,
          };
          return createErrorResponse("daily_quota_exceeded", 429, {
            remaining: result.remaining,
            reset_at: result.resetAt,
            limit: ANONYMOUS_DAILY_QUOTA,
          });
        }

        locals.analysisQuota = {
          remaining: result.remaining,
          resetAt: result.resetAt,
          limit: ANONYMOUS_DAILY_QUOTA,
        };
      } catch (error) {
        console.error("Error checking daily quota:", error);
        return createErrorResponse("unknown_error", 500);
      }
    }
  } else {
    locals.analysisQuota = null;
  }

  return next();
});
