import { create } from "zustand";

interface SettingsState {
  pointsEnabled: boolean;
  contextEnabled: boolean;
  betaModesEnabled: boolean;
  isLoaded: boolean;
}

interface SettingsActions {
  initializeSettings: (settings: {
    pointsEnabled: boolean;
    contextEnabled: boolean;
    betaModesEnabled: boolean;
  }) => void;
  setPointsEnabled: (enabled: boolean) => void;
  setContextEnabled: (enabled: boolean) => void;
  setBetaModesEnabled: (enabled: boolean) => void;
  clearSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSettings: SettingsState = {
  pointsEnabled: true,
  contextEnabled: true,
  betaModesEnabled: false,
  isLoaded: false,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...defaultSettings,
  initializeSettings: (settings) =>
    set({
      pointsEnabled: settings.pointsEnabled,
      contextEnabled: settings.contextEnabled,
      betaModesEnabled: settings.betaModesEnabled,
      isLoaded: true,
    }),
  setPointsEnabled: (enabled) => set({ pointsEnabled: enabled }),
  setContextEnabled: (enabled) => set({ contextEnabled: enabled }),
  setBetaModesEnabled: (enabled) => set({ betaModesEnabled: enabled }),
  clearSettings: () => set({ ...defaultSettings }),
}));
