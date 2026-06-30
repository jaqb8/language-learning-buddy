import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { TextAnalysisDto } from "@/types";
import { isGamificationSuccess } from "@/lib/analysis-gamification";
import { useI18n } from "@/lib/i18n";

interface UseAnalyzeViewEffectsArgs {
  error: string | null;
  isCurrentResultSaved: boolean;
  result: TextAnalysisDto | null;
  resultTimestamp: number | null;
  isRestoredResult: boolean;
  isAuth: boolean;
  analysisContext: string;
  isContextEnabled: boolean;
  setAnalysisContext: (analysisContext: string) => void;
  clearPendingAnalysis: () => void;
  gamificationFeatureEnabled: boolean;
  isPointsAwardingEnabled: boolean;
  incrementStats: (isCorrect: boolean) => void;
}

export function useAnalyzeViewEffects({
  error,
  isCurrentResultSaved,
  result,
  resultTimestamp,
  isRestoredResult,
  isAuth,
  analysisContext,
  isContextEnabled,
  setAnalysisContext,
  clearPendingAnalysis,
  gamificationFeatureEnabled,
  isPointsAwardingEnabled,
  incrementStats,
}: UseAnalyzeViewEffectsArgs) {
  const { t } = useI18n();
  const lastResultRef = useRef<number | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (
      gamificationFeatureEnabled &&
      isPointsAwardingEnabled &&
      result &&
      isAuth &&
      resultTimestamp &&
      !isRestoredResult
    ) {
      if (lastResultRef.current !== resultTimestamp) {
        lastResultRef.current = resultTimestamp;
        incrementStats(isGamificationSuccess(result));
      }
    }
  }, [
    result,
    resultTimestamp,
    isRestoredResult,
    isAuth,
    incrementStats,
    gamificationFeatureEnabled,
    isPointsAwardingEnabled,
  ]);

  useEffect(() => {
    if (!isContextEnabled && analysisContext.trim().length > 0) {
      setAnalysisContext("");
    }
  }, [isContextEnabled, analysisContext, setAnalysisContext]);

  useEffect(() => {
    return () => {
      clearPendingAnalysis();
    };
  }, [clearPendingAnalysis]);

  useEffect(() => {
    if (isCurrentResultSaved) {
      toast.success(t("analysis.result.savedToast"), {
        action: {
          label: t("analysis.result.openList"),
          onClick: () => {
            window.location.href = "/learning-list";
          },
        },
      });
    }
  }, [isCurrentResultSaved, t]);
}
