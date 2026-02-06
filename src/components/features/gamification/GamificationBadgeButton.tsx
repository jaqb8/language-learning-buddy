import { useEffect, useRef, useState } from "react";
import { SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GamificationBadgeVM } from "./gamificationBadge.model";
import { BetaBadge } from "@/components/shared/BetaBadge";

interface GamificationBadgeButtonProps {
  vm: GamificationBadgeVM | null;
  isLoading: boolean;
}

export function GamificationBadgeButton({ vm, isLoading }: GamificationBadgeButtonProps) {
  const prevTotalRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (vm && prevTotalRef.current !== null && vm.totalAnalyses > prevTotalRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = vm?.totalAnalyses ?? null;
  }, [vm?.totalAnalyses, vm]);

  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-full" data-test-id="header-points-skeleton" />;
  }

  if (!vm) {
    return null;
  }

  const { Icon } = vm.config;

  return (
    <SheetTrigger asChild>
      <button
        type="button"
        className={cn(
          "points-badge shadow-xs flex items-center gap-2 border rounded-full h-8 px-3 cursor-pointer transition-colors",
          vm.config.bgClass,
          vm.config.borderClass,
          isAnimating && "animate-scale"
        )}
        data-test-id="header-points-badge"
      >
        <Icon className={cn("size-4", vm.config.textClass)} />
        <span className={cn("text-base font-medium", vm.config.textClass)}>{vm.percentage}%</span>
        {vm.showBeta && <BetaBadge />}
      </button>
    </SheetTrigger>
  );
}
