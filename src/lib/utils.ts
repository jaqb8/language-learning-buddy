import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getIntlLocale, type AppLocale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the client IP address from request headers.
 * Checks headers in order: CF-Connecting-IP, X-Real-IP, X-Forwarded-For.
 *
 * @param request - The Request object containing headers
 * @returns The client IP address or "unknown" if not found
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  const cfConnectingIP = headers.get("CF-Connecting-IP");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  const xRealIP = headers.get("X-Real-IP");
  if (xRealIP) {
    return xRealIP;
  }

  const xForwardedFor = headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return "unknown";
}

/**
 * Formats a UTC timestamp as a human-readable date and time string in Polish locale.
 *
 * @param resetAt - ISO timestamp string (UTC)
 * @returns Formatted string like "26 listopada 2025 o 00:00 UTC" or "wkrótce" on error
 */
export function formatResetTime(resetAt: string, locale: AppLocale = "en"): string {
  try {
    const resetDate = new Date(resetAt);

    const intlLocale = getIntlLocale(locale);
    const dateString = resetDate.toLocaleDateString(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const timeString = resetDate.toLocaleTimeString(intlLocale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    return locale === "pl" ? `${dateString} o ${timeString} UTC` : `${dateString} at ${timeString} UTC`;
  } catch {
    return locale === "pl" ? "wkrótce" : "soon";
  }
}

/**
 * Validates and normalizes a return URL to prevent open redirect attacks.
 * Only allows relative paths starting with '/' and disallows:
 * - Absolute URLs (with protocol like http://, https://, javascript:, etc.)
 * - Protocol-relative URLs (starting with //)
 * - URLs containing control characters or dangerous patterns
 *
 * @param url - The URL to validate
 * @returns A safe relative path or null if validation fails
 */
export function validateReturnUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(url);
    const trimmed = decoded.trim();

    if (!trimmed.startsWith("/")) {
      return null;
    }

    if (trimmed.startsWith("//")) {
      return null;
    }

    const lowercased = trimmed.toLowerCase();
    const dangerousProtocols = ["http:", "https:", "javascript:", "data:", "vbscript:", "file:"];
    if (dangerousProtocols.some((protocol) => lowercased.includes(protocol))) {
      return null;
    }

    for (let i = 0; i < trimmed.length; i++) {
      const charCode = trimmed.charCodeAt(i);
      if ((charCode >= 0 && charCode <= 31) || charCode === 127) {
        return null;
      }
    }

    return trimmed;
  } catch {
    return null;
  }
}
