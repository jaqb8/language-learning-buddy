import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ANALYSIS_LANGUAGES, type AnalysisLanguage } from "@/types";
import { normalizeAnalysisLanguage } from "@/lib/analysis-mode.constants";

interface AnalysisLanguageStore {
  language: AnalysisLanguage;
  setLanguage: (language: AnalysisLanguage) => void;
}

export const useAnalysisLanguageStore = create<AnalysisLanguageStore>()(
  persist(
    (set) => ({
      language: ANALYSIS_LANGUAGES.ENGLISH,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "analysis_language",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AnalysisLanguageStore>;
        return { language: normalizeAnalysisLanguage(state.language) } as AnalysisLanguageStore;
      },
    }
  )
);
