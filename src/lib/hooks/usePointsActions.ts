import { useCallback } from "react";
import type { ApiErrorResponse, AnalysisStats } from "@/types";
import { useI18n, type Translator } from "@/lib/i18n";

type StatsActionResult<T> = { data: T; errorMessage?: undefined } | { data: null; errorMessage: string };

const mapErrorCodeToMessage = (errorCode: string, t: Translator): string => {
  const messages: Record<string, string> = {
    authentication_error_unauthorized: t("error.unauthorized"),
    unauthorized: t("error.unauthorized"),
    database_error: t("error.server"),
    unknown_error: t("error.unexpected"),
  };

  return messages[errorCode] ?? messages.unknown_error;
};

export function usePointsActions() {
  const { t } = useI18n();
  const fetchStats = useCallback(async (): Promise<StatsActionResult<AnalysisStats>> => {
    try {
      const response = await fetch("/api/gamification/points");
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        return { data: null, errorMessage: mapErrorCodeToMessage(errorData?.error_code ?? "unknown_error", t) };
      }

      const data = (await response.json()) as AnalysisStats;
      return { data };
    } catch (error) {
      console.error("Failed to fetch analysis stats:", error);
      return { data: null, errorMessage: mapErrorCodeToMessage("unknown_error", t) };
    }
  }, [t]);

  return { fetchStats };
}
