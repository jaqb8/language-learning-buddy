import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { usePendingAnalysisStore } from "@/lib/stores/pending-analysis.store";
import { isFeatureEnabled, isFeatureBeta } from "@/features/feature-flags.service";
import type { TextAnalysisDto, CreateLearningItemCommand, AnalysisLanguage, AnalysisMode } from "../../types";
import { buildAnalysisResultViewModel } from "./analysis-result/analysisResult.model";
import { AnalysisResultView } from "./analysis-result/AnalysisResultView";
import { useI18n } from "@/lib/i18n";

interface AnalysisResultProps {
  isLoading: boolean;
  analysisResult: TextAnalysisDto | null;
  isSaved: boolean;
  analysisMode: AnalysisMode;
  analysisLanguage: AnalysisLanguage;
  analysisContext?: string;
  onSave: (item: CreateLearningItemCommand) => void;
  earnedPoint?: boolean;
}

export function AnalysisResult({
  isLoading,
  analysisResult,
  isSaved,
  analysisMode,
  analysisLanguage,
  analysisContext,
  onSave,
  earnedPoint = false,
}: AnalysisResultProps) {
  const { t } = useI18n();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { isAuth } = useAuthStore();
  const { setPendingAnalysis } = usePendingAnalysisStore();
  const isAuthFeatureEnabled = isFeatureEnabled("auth");
  const isLearningItemsFeatureEnabled = isFeatureEnabled("learning-items");
  const gamificationFeatureEnabled = isFeatureEnabled("gamification");
  const gamificationBetaTagEnabled = isFeatureBeta("gamification");

  useEffect(() => {
    if (isLoading || !analysisResult) {
      return;
    }

    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [analysisResult, isLoading]);

  const handleSave = useCallback(() => {
    if (!isAuth) {
      if (analysisResult && !analysisResult.is_correct) {
        setPendingAnalysis({
          result: analysisResult,
          mode: analysisMode,
          language: analysisLanguage,
          originalText: analysisResult.original_text,
          analysisContext: analysisContext?.trim() || undefined,
          timestamp: Date.now(),
        });
      }
      const returnUrl = encodeURIComponent("/?restoreAnalysis=true");
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return;
    }

    if (analysisResult && !analysisResult.is_correct) {
      const command: CreateLearningItemCommand = {
        original_sentence: analysisResult.original_text,
        corrected_sentence: analysisResult.corrected_text,
        explanation: analysisResult.explanation,
        analysis_mode: analysisMode,
        analysis_language: analysisLanguage,
        translation: analysisResult.translation ?? null,
      };
      onSave(command);
    }
  }, [analysisResult, onSave, isAuth, analysisMode, analysisLanguage, analysisContext, setPendingAnalysis]);

  const vm = buildAnalysisResultViewModel({
    isLoading,
    analysisResult,
    isSaved,
    analysisMode,
    isAuth,
    earnedPoint,
    t,
    features: {
      authEnabled: isAuthFeatureEnabled,
      learningItemsEnabled: isLearningItemsFeatureEnabled,
      gamificationEnabled: gamificationFeatureEnabled,
      gamificationBetaTagEnabled: gamificationBetaTagEnabled,
    },
  });

  return <AnalysisResultView vm={vm} resultRef={resultRef} onSaveClick={handleSave} />;
}
