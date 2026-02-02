import { useMemo } from "react";
import { Sheet } from "@/components/ui/sheet";
import { GamificationBadgeButton } from "./GamificationBadgeButton";
import { GamificationBadgeSheet } from "./GamificationBadgeSheet";
import { buildGamificationBadgeVM } from "./gamificationBadge.model";

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
  const vm = useMemo(
    () => buildGamificationBadgeVM({ correctAnalyses, totalAnalyses, showBeta }),
    [correctAnalyses, totalAnalyses, showBeta]
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
