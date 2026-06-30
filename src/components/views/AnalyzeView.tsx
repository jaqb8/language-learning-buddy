import { useCallback } from "react";
import { useTextAnalysis } from "../../lib/hooks/useTextAnalysis";
import { useAnalysisModeStore } from "../../lib/stores/analysis-mode.store";
import { useAnalysisLanguageStore } from "../../lib/stores/analysis-language.store";
import { usePendingAnalysisStore } from "../../lib/stores/pending-analysis.store";
import { useAuthStore } from "../../lib/stores/auth.store";
import { usePointsStore } from "../../lib/stores/points.store";
import { useSettingsStore } from "../../lib/stores/settings.store";
import { isFeatureEnabled } from "../../features/feature-flags.service";
import { formatResetTime } from "../../lib/utils";
import { isGamificationSuccess } from "../../lib/analysis-gamification";
import { AnalysisForm } from "../features/AnalysisForm";
import { Skeleton } from "../ui/skeleton";
import { AnalysisResult } from "../features/AnalysisResult";
import type { CreateLearningItemCommand } from "../../types";
import { buildAnalyzeViewModel } from "./analyze/analyzeView.model";
import { useAnalyzeViewEffects } from "./analyze/useAnalyzeViewEffects";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

const MAX_TEXT_LENGTH = 500;

export function AnalyzeView({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <I18nProvider locale={locale}>
      <AnalyzeViewContent />
    </I18nProvider>
  );
}

function AnalyzeViewContent() {
  const { locale, t } = useI18n();
  const { state, quota, setText, setAnalysisContext, analyzeText, saveResult, clear } = useTextAnalysis();
  const mode = useAnalysisModeStore((state) => state.mode);
  const language = useAnalysisLanguageStore((state) => state.language);
  const { clearPendingAnalysis } = usePendingAnalysisStore();
  const isAuth = useAuthStore((state) => state.isAuth);
  const incrementStats = usePointsStore((state) => state.incrementStats);
  const { pointsEnabled: pointsSettingEnabled, contextEnabled, isLoaded } = useSettingsStore();
  const gamificationFeatureEnabled = isFeatureEnabled("gamification");
  const inputLanguage = t(language === "pl" ? "analysis.inputLanguage.pl" : "analysis.inputLanguage.en");

  const vm = buildAnalyzeViewModel({
    state: { status: state.status, result: state.result },
    quota,
    isAuth,
    settings: {
      isLoaded,
      pointsEnabled: pointsSettingEnabled,
      contextEnabled,
    },
  });

  useAnalyzeViewEffects({
    error: state.error,
    isCurrentResultSaved: state.isCurrentResultSaved,
    result: state.result,
    resultTimestamp: state.resultTimestamp,
    isRestoredResult: state.isRestoredResult,
    isAuth,
    analysisContext: state.analysisContext,
    isContextEnabled: vm.isContextEnabled,
    setAnalysisContext,
    clearPendingAnalysis,
    gamificationFeatureEnabled,
    isPointsAwardingEnabled: vm.isPointsAwardingEnabled,
    incrementStats,
  });

  const handleSave = useCallback(
    (command: CreateLearningItemCommand) => {
      saveResult(command);
    },
    [saveResult]
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("analysis.title")}</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          {t("analysis.subtitle", { language: inputLanguage })}
        </p>
      </header>

      <section aria-label={t("analysis.formAria")}>
        {vm.shouldShowSettingsSkeleton ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-40 w-full" />
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <AnalysisForm
            text={state.text}
            onTextChange={setText}
            onSubmit={() => analyzeText(mode, language)}
            onClear={clear}
            isLoading={vm.isAnalyzing}
            isAnalyzing={vm.isAnalyzing}
            maxLength={MAX_TEXT_LENGTH}
            quota={vm.quotaForForm}
            formatResetTime={(resetAt) => formatResetTime(resetAt, locale)}
            analysisContext={state.analysisContext}
            onAnalysisContextChange={setAnalysisContext}
            isAuth={isAuth}
            language={language}
          />
        )}
      </section>
      {vm.showResultSection && (
        <section aria-label={t("analysis.resultsAria")} aria-live="polite">
          <AnalysisResult
            isLoading={vm.isAnalyzing}
            analysisResult={state.result}
            isSaved={state.isCurrentResultSaved}
            analysisMode={state.resultMode ?? mode}
            analysisLanguage={state.resultLanguage ?? language}
            analysisContext={state.analysisContext}
            onSave={handleSave}
            earnedPoint={
              gamificationFeatureEnabled &&
              vm.isPointsAwardingEnabled &&
              Boolean(state.result && isGamificationSuccess(state.result)) &&
              isAuth
            }
          />
        </section>
      )}
    </main>
  );
}
