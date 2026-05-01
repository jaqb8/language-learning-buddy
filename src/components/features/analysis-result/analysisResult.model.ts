import type { AnalysisMode, TextAnalysisDto } from "@/types";

export type SaveCtaModel =
  | { kind: "hidden" }
  | {
      kind: "saved";
      disabled: true;
      ariaLabel: "Element już zapisany na liście";
      label: "Zapisano ✓";
      emphasizeUnauthHover: false;
    }
  | {
      kind: "save";
      disabled: false;
      ariaLabel: "Dodaj ten błąd do listy Do nauki";
      label: "Dodaj do listy Do nauki";
      emphasizeUnauthHover: false;
    }
  | {
      kind: "login";
      disabled: false;
      ariaLabel: "Zaloguj się, aby dodać do listy";
      label: "Zaloguj się, aby dodać do listy";
      emphasizeUnauthHover: true;
    };

export type AnalysisResultViewModel =
  | { kind: "loading" }
  | { kind: "empty" }
  | {
      kind: "correct";
      translation: string | null;
      showEarnedPointBadge: boolean;
      showGamificationBetaTag: boolean;
    }
  | {
      kind: "errors";
      analysisMode: AnalysisMode;
      textDiff: {
        originalText: string;
        correctedText: string;
        translation: string | null;
      };
      explanationMarkdown: string;
      saveCta: SaveCtaModel;
      showEarnedPointBadge: boolean;
      showGamificationBetaTag: boolean;
    };

interface BuildAnalysisResultViewModelArgs {
  isLoading: boolean;
  analysisResult: TextAnalysisDto | null;
  isSaved: boolean;
  analysisMode: AnalysisMode;
  isAuth: boolean;
  earnedPoint: boolean;
  features: {
    authEnabled: boolean;
    learningItemsEnabled: boolean;
    gamificationEnabled: boolean;
    gamificationBetaTagEnabled: boolean;
  };
}

export function buildAnalysisResultViewModel(args: BuildAnalysisResultViewModelArgs): AnalysisResultViewModel {
  const { isLoading, analysisResult } = args;

  if (isLoading) {
    return { kind: "loading" };
  }

  if (!analysisResult) {
    return { kind: "empty" };
  }

  if (analysisResult.is_correct) {
    return {
      kind: "correct",
      translation: analysisResult.translation,
      showEarnedPointBadge: args.features.gamificationEnabled && args.earnedPoint,
      showGamificationBetaTag: args.features.gamificationBetaTagEnabled,
    };
  }

  const shouldShowSaveButton = args.features.authEnabled && args.features.learningItemsEnabled;

  let saveCta: SaveCtaModel = { kind: "hidden" };
  if (shouldShowSaveButton) {
    if (args.isSaved) {
      saveCta = {
        kind: "saved",
        disabled: true,
        ariaLabel: "Element już zapisany na liście",
        label: "Zapisano ✓",
        emphasizeUnauthHover: false,
      };
    } else if (args.isAuth) {
      saveCta = {
        kind: "save",
        disabled: false,
        ariaLabel: "Dodaj ten błąd do listy Do nauki",
        label: "Dodaj do listy Do nauki",
        emphasizeUnauthHover: false,
      };
    } else {
      saveCta = {
        kind: "login",
        disabled: false,
        ariaLabel: "Zaloguj się, aby dodać do listy",
        label: "Zaloguj się, aby dodać do listy",
        emphasizeUnauthHover: true,
      };
    }
  }

  return {
    kind: "errors",
    analysisMode: args.analysisMode,
    textDiff: {
      originalText: analysisResult.original_text,
      correctedText: analysisResult.corrected_text,
      translation: analysisResult.translation,
    },
    explanationMarkdown: analysisResult.explanation,
    saveCta,
    showEarnedPointBadge: args.features.gamificationEnabled && args.earnedPoint,
    showGamificationBetaTag: args.features.gamificationBetaTagEnabled,
  };
}
