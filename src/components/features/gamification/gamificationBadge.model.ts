import { ChevronUp, ChevronsUp, Rocket, Crown } from "lucide-react";

export interface LevelConfig {
  name: string;
  description: string;
  range: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  betaClass: string;
  Icon: typeof ChevronUp;
}

export const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  beginner: {
    name: "Początkujący",
    description: "Dopiero zaczynasz swoją przygodę z językiem. Każdy błąd to okazja do nauki!",
    range: "0% – 39%",
    bgClass: "bg-slate-100 dark:bg-slate-800/50",
    borderClass: "border-slate-300 dark:border-slate-700",
    textClass: "text-slate-700 dark:text-slate-300",
    betaClass: "text-slate-600 dark:text-slate-400 border-slate-400 dark:border-slate-500",
    Icon: ChevronUp,
  },
  developing: {
    name: "Rozwijający się",
    description: "Robisz postępy! Kontynuuj ćwiczenia, a wkrótce osiągniesz wyższy poziom.",
    range: "40% – 69%",
    bgClass: "bg-amber-50 dark:bg-amber-950/50",
    borderClass: "border-amber-200 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
    betaClass: "text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-500",
    Icon: ChevronsUp,
  },
  advanced: {
    name: "Zaawansowany",
    description: "Świetna robota! Twoja znajomość języka jest na wysokim poziomie.",
    range: "70% – 89%",
    bgClass: "bg-green-50 dark:bg-green-950/50",
    borderClass: "border-green-200 dark:border-green-800",
    textClass: "text-green-700 dark:text-green-300",
    betaClass: "text-green-600 dark:text-green-400 border-green-400 dark:border-green-500",
    Icon: Crown,
  },
  expert: {
    name: "Ekspert",
    description: "Mistrzostwo! Piszesz niemal bezbłędnie. Jesteś wzorem do naśladowania!",
    range: "90% – 100%",
    bgClass: "bg-blue-50 dark:bg-blue-950/50",
    borderClass: "border-blue-200 dark:border-blue-800",
    textClass: "text-blue-700 dark:text-blue-300",
    betaClass: "text-blue-600 dark:text-blue-400 border-blue-400 dark:border-blue-500",
    Icon: Rocket,
  },
};

export function getLevelFromPercentage(percentage: number): string {
  if (percentage >= 90) return "expert";
  if (percentage >= 70) return "advanced";
  if (percentage >= 40) return "developing";
  return "beginner";
}

export interface GamificationBadgeVM {
  percentage: number;
  levelKey: string;
  config: LevelConfig;
  hasAnalyses: boolean;
  shouldShow: boolean;
  correctAnalyses: number;
  totalAnalyses: number;
  showBeta: boolean;
}

export function buildGamificationBadgeVM({
  correctAnalyses,
  totalAnalyses,
  showBeta = false,
}: {
  correctAnalyses?: number;
  totalAnalyses?: number;
  showBeta?: boolean;
}): GamificationBadgeVM | null {
  if (correctAnalyses === undefined || totalAnalyses === undefined) {
    return null;
  }

  const hasAnalyses = totalAnalyses > 0;
  const percentage = hasAnalyses ? Math.round((correctAnalyses / totalAnalyses) * 100) : 0;
  const levelKey = getLevelFromPercentage(percentage);
  const config = LEVEL_CONFIGS[levelKey];

  return {
    percentage,
    levelKey,
    config,
    hasAnalyses,
    shouldShow: true,
    correctAnalyses,
    totalAnalyses,
    showBeta,
  };
}
