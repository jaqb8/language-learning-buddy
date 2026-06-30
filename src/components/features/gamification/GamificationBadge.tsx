import { useMemo } from "react";
import { Sheet } from "@/components/ui/sheet";
import { GamificationBadgeButton } from "./GamificationBadgeButton";
import { GamificationBadgeSheet } from "./GamificationBadgeSheet";
import { buildGamificationBadgeVM } from "./gamificationBadge.model";
import { useI18n } from "@/lib/i18n";

interface GamificationBadgeProps {
  correctAnalyses?: number;
  totalAnalyses?: number;
  showBeta?: boolean;
  isLoading?: boolean;
}

export function GamificationBadge({
  correctAnalyses,
  totalAnalyses,
  showBeta = false,
  isLoading = false,
}: GamificationBadgeProps) {
  const { t } = useI18n();
  const vm = useMemo(
    () => buildGamificationBadgeVM({ correctAnalyses, totalAnalyses, showBeta, t }),
    [correctAnalyses, totalAnalyses, showBeta, t]
  );

  if (!vm && !isLoading) {
    return null;
  }

  return (
    <Sheet>
      <GamificationBadgeButton vm={vm} isLoading={isLoading} />
      {vm && <GamificationBadgeSheet vm={vm} />}
    </Sheet>
  );
}
