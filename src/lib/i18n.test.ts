import { describe, expect, it } from "vitest";
import {
  APP_LOCALE_COOKIE,
  createTranslator,
  getIntlLocale,
  normalizeAppLocale,
  setAppLocaleCookie,
  TRANSLATIONS,
} from "./i18n";
import { formatResetTime } from "./utils";
import { mapAuthErrorCodeToMessage } from "./clients/auth/auth.errors";

describe("i18n", () => {
  it("defaults unsupported and missing locales to English", () => {
    expect(normalizeAppLocale(undefined)).toBe("en");
    expect(normalizeAppLocale("de")).toBe("en");
  });

  it("accepts supported locales", () => {
    expect(normalizeAppLocale("en")).toBe("en");
    expect(normalizeAppLocale("pl")).toBe("pl");
  });

  it("interpolates translation parameters", () => {
    expect(createTranslator("en")("gamification.of", { correct: 2, total: 3 })).toBe("2 of 3");
    expect(createTranslator("pl")("gamification.of", { correct: 2, total: 3 })).toBe("2 z 3");
  });

  it("keeps translation catalog keys complete", () => {
    expect(Object.keys(TRANSLATIONS.pl).sort()).toEqual(Object.keys(TRANSLATIONS.en).sort());
  });

  it("maps application locales to Intl locales", () => {
    expect(getIntlLocale("en")).toBe("en-GB");
    expect(getIntlLocale("pl")).toBe("pl-PL");
  });

  it("stores the selected locale in a site-wide cookie", () => {
    setAppLocaleCookie("pl");

    expect(document.cookie).toContain(`${APP_LOCALE_COOKIE}=pl`);
  });

  it("localizes dates and times", () => {
    const timestamp = "2025-11-26T00:00:00Z";

    expect(formatResetTime(timestamp, "en")).toBe("26 November 2025 at 00:00 UTC");
    expect(formatResetTime(timestamp, "pl")).toBe("26 listopada 2025 o 00:00 UTC");
  });

  it("maps stable API error codes through the selected catalog", () => {
    expect(mapAuthErrorCodeToMessage("invalid_credentials", createTranslator("en"))).toBe(
      "Invalid email or password."
    );
    expect(mapAuthErrorCodeToMessage("invalid_credentials", createTranslator("pl"))).toBe(
      "Nieprawidłowy email lub hasło."
    );
  });
});
