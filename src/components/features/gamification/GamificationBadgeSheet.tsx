import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LEVEL_CONFIGS, type GamificationBadgeVM } from "./gamificationBadge.model";

interface GamificationBadgeSheetProps {
  vm: GamificationBadgeVM;
}

export function GamificationBadgeSheet({ vm }: GamificationBadgeSheetProps) {
  const { Icon } = vm.config;

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-full",
              vm.config.bgClass,
              vm.config.borderClass
            )}
          >
            <Icon className={cn("size-5", vm.config.textClass)} />
          </div>
          <div>
            <span className={vm.config.textClass}>{vm.config.name}</span>
            <p className="text-sm font-normal text-muted-foreground">{vm.config.range}</p>
          </div>
        </SheetTitle>
        <SheetDescription className="pt-3 text-lg">{vm.config.description}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm text-muted-foreground">Twój wynik</p>
            <p className={cn("text-3xl font-bold", vm.config.textClass)}>{vm.percentage}%</p>
          </div>
          {vm.hasAnalyses && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Poprawne analizy</p>
              <p className="text-lg font-semibold">
                {vm.correctAnalyses} z {vm.totalAnalyses}
              </p>
            </div>
          )}
        </div>

        {!vm.hasAnalyses && (
          <p className="text-sm text-muted-foreground text-center">
            Przeprowadź pierwszą analizę, aby zobaczyć swoje statystyki!
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Wszystkie poziomy:</p>
          <div className="grid gap-2">
            {Object.entries(LEVEL_CONFIGS).map(([key, levelConfig]) => {
              const isCurrentLevel = vm.config === levelConfig;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-3 border rounded-md p-2 text-sm",
                    isCurrentLevel && "font-semibold",
                    isCurrentLevel && "bg-secondary/40"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-7 rounded-full",
                      levelConfig.bgClass,
                      levelConfig.borderClass
                    )}
                  >
                    <levelConfig.Icon className={cn("size-4", levelConfig.textClass)} />
                  </div>
                  <div className="flex-1">
                    <span className={cn(isCurrentLevel ? "font-bold" : "font-medium", levelConfig.textClass)}>
                      {levelConfig.name}
                    </span>
                  </div>
                  <span className={cn("text-xs", isCurrentLevel ? "font-semibold" : "text-muted-foreground")}>
                    {levelConfig.range}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SheetContent>
  );
}
