import type { TextAnalysisDto } from "@/types";

interface AnalyzeViewStateSnapshot {
  status: "idle" | "loading" | "success" | "error";
  result: TextAnalysisDto | null;
}

interface QuotaStatus {
  remaining: number;
  resetAt: string;
  limit: number;
}

export interface AnalyzeViewModel {
  shouldShowSettingsSkeleton: boolean;
  showResultSection: boolean;
  quotaForForm: QuotaStatus | null;
  isAnalyzing: boolean;
  isContextEnabled: boolean;
  isPointsAwardingEnabled: boolean;
}

interface BuildAnalyzeViewModelArgs {
  state: AnalyzeViewStateSnapshot;
  quota: QuotaStatus | null;
  isAuth: boolean;
  settings: {
    isLoaded: boolean;
    pointsEnabled: boolean;
    contextEnabled: boolean;
  };
}

export function buildAnalyzeViewModel(args: BuildAnalyzeViewModelArgs): AnalyzeViewModel {
  const shouldShowSettingsSkeleton = args.isAuth && !args.settings.isLoaded;

  // Keep current behavior: when settings haven't loaded yet, default to enabled.
  const isPointsAwardingEnabled = !args.settings.isLoaded || args.settings.pointsEnabled;
  const isContextEnabled = !args.settings.isLoaded || args.settings.contextEnabled;

  return {
    shouldShowSettingsSkeleton,
    showResultSection: args.state.status === "loading" || Boolean(args.state.result),
    quotaForForm: !args.isAuth ? args.quota : null,
    isAnalyzing: args.state.status === "loading",
    isContextEnabled,
    isPointsAwardingEnabled,
  };
}
