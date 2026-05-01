import type { RefObject } from "react";
import type { AnalysisResultViewModel } from "./analysisResult.model";
import { AnalysisResultLoading } from "./variants/AnalysisResultLoading";
import { AnalysisResultCorrect } from "./variants/AnalysisResultCorrect";
import { AnalysisResultWithErrors } from "./variants/AnalysisResultWithErrors";

interface AnalysisResultViewProps {
  vm: AnalysisResultViewModel;
  resultRef: RefObject<HTMLDivElement | null>;
  onSaveClick: () => void;
}

export function AnalysisResultView({ vm, resultRef, onSaveClick }: AnalysisResultViewProps) {
  switch (vm.kind) {
    case "loading":
      return <AnalysisResultLoading />;
    case "empty":
      return null;
    case "correct":
      return (
        <div ref={resultRef}>
          <AnalysisResultCorrect
            translation={vm.translation}
            showEarnedPointBadge={vm.showEarnedPointBadge}
            showGamificationBetaTag={vm.showGamificationBetaTag}
          />
        </div>
      );
    case "errors":
      return (
        <div ref={resultRef}>
          <AnalysisResultWithErrors
            analysisMode={vm.analysisMode}
            textDiff={vm.textDiff}
            explanationMarkdown={vm.explanationMarkdown}
            saveCta={vm.saveCta}
            showEarnedPointBadge={vm.showEarnedPointBadge}
            showGamificationBetaTag={vm.showGamificationBetaTag}
            onSaveClick={onSaveClick}
          />
        </div>
      );
    default: {
      const _exhaustive: never = vm;
      return _exhaustive;
    }
  }
}
