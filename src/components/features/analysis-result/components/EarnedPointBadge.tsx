import { TrendingUp } from "lucide-react";
import { BetaBadge } from "@/components/shared/BetaBadge";
import { useI18n } from "@/lib/i18n";

interface EarnedPointBadgeProps {
  showBetaTag: boolean;
  variant?: "correct" | "minor_issue";
}

export function EarnedPointBadge({ showBetaTag, variant = "correct" }: EarnedPointBadgeProps) {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col pt-2 items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
      data-test-id="earned-point-badge"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700">
        <TrendingUp className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
          {t("analysis.result.earned.title")}
        </span>
        {showBetaTag && <BetaBadge />}
      </div>
      <p className="text-sm pt-1 md:max-w-md text-center text-muted-foreground">
        {t(variant === "minor_issue" ? "analysis.result.earned.minor" : "analysis.result.earned.correct")}
      </p>
    </div>
  );
}
