import { useCallback, useEffect, useReducer } from "react";
import { usePendingAnalysisStore } from "../stores/pending-analysis.store";
import { useAnalysisModeStore } from "../stores/analysis-mode.store";
import { useAnalysisLanguageStore } from "../stores/analysis-language.store";
import { useAuthStore } from "../stores/auth.store";
import { formatResetTime } from "../utils";
import { normalizeAnalysisLanguage, normalizeAnalysisMode } from "../analysis-mode.constants";
import type {
  TextAnalysisDto,
  CreateLearningItemCommand,
  ApiErrorResponse,
  AnalysisLanguage,
  AnalysisMode,
} from "../../types";
import { useI18n, type AppLocale, type Translator } from "@/lib/i18n";

type AnalysisStatus = "idle" | "loading" | "success" | "error";

interface AnalyzeViewState {
  status: AnalysisStatus;
  text: string;
  analysisContext: string;
  result: TextAnalysisDto | null;
  resultMode: AnalysisMode | null;
  resultLanguage: AnalysisLanguage | null;
  resultTimestamp: number | null;
  isRestoredResult: boolean;
  error: string | null;
  isCurrentResultSaved: boolean;
}

interface QuotaStatus {
  remaining: number;
  resetAt: string;
  limit: number;
}

type State = AnalyzeViewState & {
  quota: QuotaStatus | null;
  hasRestored: boolean;
};

type Action =
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_CONTEXT"; analysisContext: string }
  | { type: "ANALYZE_REQUEST" }
  | {
      type: "ANALYZE_SUCCESS";
      result: TextAnalysisDto;
      mode: AnalysisMode;
      language: AnalysisLanguage;
      quota: QuotaStatus | null;
    }
  | { type: "ANALYZE_ERROR"; error: string }
  | { type: "ANALYZE_QUOTA_EXCEEDED"; resetAt: string; limit: number }
  | { type: "QUOTA_CLEAR" }
  | { type: "QUOTA_SET"; quota: QuotaStatus | null }
  | { type: "RESTORE_PENDING"; payload: Omit<AnalyzeViewState, "status"> & { status: "success" } }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "CLEAR" };

const INITIAL_STATE: State = {
  status: "idle",
  text: "",
  analysisContext: "",
  result: null,
  resultMode: null,
  resultLanguage: null,
  resultTimestamp: null,
  isRestoredResult: false,
  error: null,
  isCurrentResultSaved: false,
  quota: null,
  hasRestored: false,
};

function mapErrorCodeToMessage(error: ApiErrorResponse, t: Translator, locale: AppLocale): string {
  const { error_code, data } = error;
  const errorMessages: Record<string, string> = {
    validation_error_text_empty: t("error.textEmpty"),
    validation_error_text_too_long: t("error.textTooLong"),
    configuration_error: t("error.configuration"),
    authentication_error: t("error.authentication"),
    authentication_error_unauthorized: t("error.unauthorized"),
    rate_limit_error: t("error.rateLimit", {
      seconds: Math.ceil(((data?.time_until_reset as number) ?? 0) / 1000),
    }),
    daily_quota_exceeded: t("error.dailyQuota", {
      resetAt: formatResetTime((data?.reset_at as string) ?? "", locale),
    }),
    invalid_request_error: t("error.invalidRequest"),
    validation_error: t("error.aiValidation"),
    network_error: t("error.network"),
    unknown_error: t("error.unexpected"),
    database_error: t("error.server"),
    validation_error_original_sentence_empty: t("error.originalRequired"),
    validation_error_corrected_sentence_empty: t("error.correctedRequired"),
    validation_error_explanation_empty: t("error.explanationRequired"),
    validation_error_explanation_too_long: t("error.explanationLong"),
    validation_error_analysis_context_too_long: t("error.contextLong"),
    validation_error_invalid_language: t("error.invalidAnalysisLanguage"),
  };

  return errorMessages[error_code] || t("error.unexpected");
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TEXT":
      return { ...state, text: action.text };
    case "SET_CONTEXT":
      return { ...state, analysisContext: action.analysisContext };
    case "ANALYZE_REQUEST":
      return { ...state, status: "loading", error: null };
    case "ANALYZE_SUCCESS":
      return {
        ...state,
        status: "success",
        result: action.result,
        resultMode: action.mode,
        resultLanguage: action.language,
        resultTimestamp: Date.now(),
        isRestoredResult: false,
        error: null,
        isCurrentResultSaved: false,
        quota: action.quota,
      };
    case "ANALYZE_ERROR":
      return { ...state, status: "error", error: action.error };
    case "ANALYZE_QUOTA_EXCEEDED":
      return {
        ...state,
        status: "error",
        error: null,
        quota: { remaining: 0, resetAt: action.resetAt, limit: action.limit },
      };
    case "QUOTA_CLEAR":
      return { ...state, quota: null };
    case "QUOTA_SET":
      return { ...state, quota: action.quota };
    case "RESTORE_PENDING":
      return {
        ...state,
        ...action.payload,
        hasRestored: true,
      };
    case "SAVE_SUCCESS":
      return { ...state, isCurrentResultSaved: true };
    case "SAVE_ERROR":
      return { ...state, error: action.error };
    case "CLEAR":
      return {
        ...INITIAL_STATE,
        quota: state.quota,
        hasRestored: state.hasRestored,
      };
  }
}

export function useTextAnalysis() {
  const { locale, t } = useI18n();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { pendingAnalysis, clearPendingAnalysis } = usePendingAnalysisStore();
  const { setMode } = useAnalysisModeStore();
  const { setLanguage } = useAnalysisLanguageStore();
  const isAuth = useAuthStore((state) => state.isAuth);

  const checkQuota = useCallback(async () => {
    if (isAuth) {
      dispatch({ type: "QUOTA_CLEAR" });
      return;
    }

    try {
      const response = await fetch("/api/analyze/quota");
      if (response.ok) {
        const data = await response.json();
        if (data.remaining !== null && data.resetAt !== null && data.limit !== null) {
          dispatch({
            type: "QUOTA_SET",
            quota: { remaining: data.remaining, resetAt: data.resetAt, limit: data.limit },
          });
        } else {
          dispatch({ type: "QUOTA_SET", quota: null });
        }
      }
    } catch (error) {
      console.error("Error checking quota:", error);
    }
  }, [isAuth]);

  useEffect(() => {
    if (state.hasRestored) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const shouldRestore = urlParams.get("restoreAnalysis") === "true";

    if (!shouldRestore || !pendingAnalysis) {
      return;
    }

    try {
      const restoredMode = normalizeAnalysisMode(pendingAnalysis.mode);
      const restoredLanguage = normalizeAnalysisLanguage(pendingAnalysis.language);

      dispatch({
        type: "RESTORE_PENDING",
        payload: {
          status: "success",
          text: pendingAnalysis.originalText,
          analysisContext: pendingAnalysis.analysisContext ?? "",
          result: pendingAnalysis.result,
          resultMode: restoredMode,
          resultLanguage: restoredLanguage,
          resultTimestamp: pendingAnalysis.timestamp ?? null,
          isRestoredResult: true,
          error: null,
          isCurrentResultSaved: false,
        },
      });

      setMode(restoredMode);
      setLanguage(restoredLanguage);

      clearPendingAnalysis();

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("restoreAnalysis");
      window.history.replaceState({}, "", newUrl.toString());
    } catch (error) {
      console.error("Error restoring analysis state:", error);
      clearPendingAnalysis();
    }
  }, [pendingAnalysis, clearPendingAnalysis, setMode, setLanguage, state.hasRestored]);

  useEffect(() => {
    checkQuota();
  }, [checkQuota]);

  const setText = useCallback((text: string) => {
    dispatch({ type: "SET_TEXT", text });
  }, []);

  const setAnalysisContext = useCallback((analysisContext: string) => {
    dispatch({ type: "SET_CONTEXT", analysisContext });
  }, []);

  const analyzeText = useCallback(
    async (mode: AnalysisMode, language: AnalysisLanguage) => {
      if (!state.text.trim()) {
        return;
      }

      dispatch({ type: "ANALYZE_REQUEST" });

      try {
        const requestBody: {
          text: string;
          mode: AnalysisMode;
          language: AnalysisLanguage;
          analysisContext?: string;
        } = {
          text: state.text,
          mode,
          language,
        };

        if (state.analysisContext.trim()) {
          requestBody.analysisContext = state.analysisContext.trim();
        }

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();

          if (errorData.error_code === "daily_quota_exceeded") {
            const resetAt = (errorData.data?.reset_at as string) ?? "";
            const limit = (errorData.data?.limit as number) ?? 0;
            dispatch({ type: "ANALYZE_QUOTA_EXCEEDED", resetAt, limit });
            return;
          }

          const errorMessage = mapErrorCodeToMessage(errorData, t, locale);

          dispatch({ type: "ANALYZE_ERROR", error: errorMessage });
          return;
        }

        const result: TextAnalysisDto = await response.json();

        const remainingHeader = response.headers.get("X-Daily-Quota-Remaining");
        const resetAtHeader = response.headers.get("X-Daily-Quota-Reset-At");
        const limitHeader = response.headers.get("X-Daily-Quota-Limit");

        const quotaFromHeaders =
          remainingHeader !== null && resetAtHeader !== null && limitHeader !== null
            ? {
                remaining: parseInt(remainingHeader, 10),
                resetAt: resetAtHeader,
                limit: parseInt(limitHeader, 10),
              }
            : state.quota;

        dispatch({ type: "ANALYZE_SUCCESS", result, mode, language, quota: quotaFromHeaders ?? null });
      } catch (error) {
        console.error("Network error during text analysis:", error);
        dispatch({ type: "ANALYZE_ERROR", error: t("error.genericRetry") });
      }
    },
    [state.text, state.analysisContext, state.quota, t, locale]
  );

  const saveResult = useCallback(
    async (command: CreateLearningItemCommand) => {
      if (!state.result || state.result.is_correct) {
        return;
      }

      try {
        const response = await fetch("/api/learning-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (response.status === 401) {
          // eslint-disable-next-line react-compiler/react-compiler
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          const errorMessage = mapErrorCodeToMessage(errorData, t, locale);
          dispatch({ type: "SAVE_ERROR", error: errorMessage });
          return;
        }

        dispatch({ type: "SAVE_SUCCESS" });
      } catch (error) {
        console.error("Network error during save:", error);
        dispatch({ type: "SAVE_ERROR", error: t("error.genericRetry") });
      }
    },
    [state.result, t, locale]
  );

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return {
    state,
    quota: state.quota,
    setText,
    setAnalysisContext,
    analyzeText,
    saveResult,
    clear,
  };
}
