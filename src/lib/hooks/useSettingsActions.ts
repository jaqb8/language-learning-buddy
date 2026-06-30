import { useCallback } from "react";
import type { ApiErrorResponse, UserSettings } from "@/types";
import { useI18n, type Translator } from "@/lib/i18n";

type SettingsActionResult<T> = { data: T; errorMessage?: undefined } | { data: null; errorMessage: string };

const mapErrorCodeToMessage = (errorCode: string, t: Translator): string => {
  const messages: Record<string, string> = {
    authentication_error_unauthorized: t("error.sessionExpired"),
    validation_error_settings_empty: t("error.settingsEmpty"),
    database_error: t("error.server"),
    unknown_error: t("error.unexpected"),
  };

  return messages[errorCode] ?? messages.unknown_error;
};

export function useSettingsActions() {
  const { t } = useI18n();
  const updateSettings = useCallback(
    async (payload: Partial<UserSettings>): Promise<SettingsActionResult<UserSettings>> => {
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
          return { data: null, errorMessage: mapErrorCodeToMessage(errorData?.error_code ?? "unknown_error", t) };
        }

        return { data: (await response.json()) as UserSettings };
      } catch (error) {
        console.error("Failed to update settings:", error);
        return { data: null, errorMessage: mapErrorCodeToMessage("unknown_error", t) };
      }
    },
    [t]
  );

  const resetPoints = useCallback(async (): Promise<SettingsActionResult<true>> => {
    try {
      const response = await fetch("/api/gamification/reset", { method: "DELETE" });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        return { data: null, errorMessage: mapErrorCodeToMessage(errorData?.error_code ?? "unknown_error", t) };
      }

      return { data: true };
    } catch (error) {
      console.error("Failed to reset points:", error);
      return { data: null, errorMessage: mapErrorCodeToMessage("unknown_error", t) };
    }
  }, [t]);

  return { updateSettings, resetPoints };
}
