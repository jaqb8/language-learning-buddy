import { useCallback, useMemo, useReducer } from "react";
import { toast } from "sonner";
import { isFeatureBeta } from "@/features/feature-flags.service";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { usePointsStore } from "@/lib/stores/points.store";
import { useSettingsActions } from "@/lib/hooks/useSettingsActions";
import { usePointsActions } from "@/lib/hooks/usePointsActions";

type ControllerState =
  | { kind: "idle" }
  | { kind: "confirmDisablePoints" }
  | { kind: "savingPointsEnable" }
  | { kind: "savingPointsDisable" }
  | { kind: "savingContext"; enabled: boolean }
  | { kind: "savingBetaModes"; enabled: boolean };

type Action =
  | { type: "IDLE" }
  | { type: "CONFIRM_DISABLE_POINTS" }
  | { type: "SAVING_POINTS_ENABLE" }
  | { type: "SAVING_POINTS_DISABLE" }
  | { type: "SAVING_CONTEXT"; enabled: boolean }
  | { type: "SAVING_BETA_MODES"; enabled: boolean };

function reducer(_state: ControllerState, action: Action): ControllerState {
  switch (action.type) {
    case "IDLE":
      return { kind: "idle" };
    case "CONFIRM_DISABLE_POINTS":
      return { kind: "confirmDisablePoints" };
    case "SAVING_POINTS_ENABLE":
      return { kind: "savingPointsEnable" };
    case "SAVING_POINTS_DISABLE":
      return { kind: "savingPointsDisable" };
    case "SAVING_CONTEXT":
      return { kind: "savingContext", enabled: action.enabled };
    case "SAVING_BETA_MODES":
      return { kind: "savingBetaModes", enabled: action.enabled };
  }
}

export function useSettingsViewController() {
  const { pointsEnabled, contextEnabled, betaModesEnabled, isLoaded, initializeSettings } = useSettingsStore();
  const clearStats = usePointsStore((state) => state.clearStats);
  const setStats = usePointsStore((state) => state.setStats);
  const { updateSettings, resetPoints } = useSettingsActions();
  const { fetchStats } = usePointsActions();
  const [state, dispatch] = useReducer(reducer, { kind: "idle" });

  const gamificationBetaTagEnabled = isFeatureBeta("gamification");
  const betaModesBetaTagEnabled = isFeatureBeta("analysis-modes-beta");

  const currentPointsEnabled = useMemo(() => (isLoaded ? pointsEnabled : true), [isLoaded, pointsEnabled]);
  const currentContextEnabled = useMemo(() => (isLoaded ? contextEnabled : true), [isLoaded, contextEnabled]);
  const currentBetaModesEnabled = useMemo(() => (isLoaded ? betaModesEnabled : false), [isLoaded, betaModesEnabled]);

  const isSavingPoints = state.kind === "savingPointsEnable" || state.kind === "savingPointsDisable";
  const isSavingContext = state.kind === "savingContext";
  const isSavingBetaModes = state.kind === "savingBetaModes";
  const isConfirmOpen = state.kind === "confirmDisablePoints" || state.kind === "savingPointsDisable";

  const setConfirmOpen = useCallback((open: boolean) => {
    if (open) {
      dispatch({ type: "CONFIRM_DISABLE_POINTS" });
      return;
    }
    dispatch({ type: "IDLE" });
  }, []);

  const enablePoints = useCallback(async () => {
    dispatch({ type: "SAVING_POINTS_ENABLE" });
    const result = await updateSettings({ pointsEnabled: true });

    if (result.data) {
      initializeSettings(result.data);

      const statsResult = await fetchStats();
      if (statsResult.data !== null) {
        setStats(statsResult.data);
      } else if (statsResult.errorMessage) {
        toast.error(statsResult.errorMessage);
      }

      toast.success("Włączono śledzenie postępów.");
    } else if (result.errorMessage) {
      toast.error(result.errorMessage);
    }

    dispatch({ type: "IDLE" });
  }, [fetchStats, initializeSettings, setStats, updateSettings]);

  const confirmDisablePoints = useCallback(async () => {
    dispatch({ type: "SAVING_POINTS_DISABLE" });

    const updated = await updateSettings({ pointsEnabled: false });
    if (!updated.data) {
      if (updated.errorMessage) {
        toast.error(updated.errorMessage);
      }
      dispatch({ type: "CONFIRM_DISABLE_POINTS" });
      return;
    }

    const resetResult = await resetPoints();
    if (!resetResult.data) {
      if (resetResult.errorMessage) {
        toast.error(resetResult.errorMessage);
      }

      const reverted = await updateSettings({ pointsEnabled: true });
      if (reverted.data) {
        initializeSettings(reverted.data);
      }

      dispatch({ type: "CONFIRM_DISABLE_POINTS" });
      return;
    }

    clearStats();
    initializeSettings(updated.data);
    toast.success("Wyłączono śledzenie postępów i usunięto historię.");
    dispatch({ type: "IDLE" });
  }, [clearStats, initializeSettings, resetPoints, updateSettings]);

  const toggleContext = useCallback(
    async (enabled: boolean) => {
      dispatch({ type: "SAVING_CONTEXT", enabled });
      const updated = await updateSettings({ contextEnabled: enabled });
      if (updated.data) {
        initializeSettings(updated.data);
        toast.success(enabled ? "Włączono kontekst analizy." : "Wyłączono kontekst analizy.");
      } else if (updated.errorMessage) {
        toast.error(updated.errorMessage);
      }
      dispatch({ type: "IDLE" });
    },
    [initializeSettings, updateSettings]
  );

  const toggleBetaModes = useCallback(
    async (enabled: boolean) => {
      dispatch({ type: "SAVING_BETA_MODES", enabled });
      const updated = await updateSettings({ betaModesEnabled: enabled });
      if (updated.data) {
        initializeSettings(updated.data);
        toast.success(enabled ? "Włączono tryby beta." : "Wyłączono tryby beta.");
      } else if (updated.errorMessage) {
        toast.error(updated.errorMessage);
      }
      dispatch({ type: "IDLE" });
    },
    [initializeSettings, updateSettings]
  );

  const onPointsCheckedChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        void enablePoints();
        return;
      }
      dispatch({ type: "CONFIRM_DISABLE_POINTS" });
    },
    [enablePoints]
  );

  return {
    isLoaded,
    gamificationBetaTagEnabled,
    betaModesBetaTagEnabled,
    currentPointsEnabled,
    currentContextEnabled,
    currentBetaModesEnabled,
    isSavingPoints,
    isSavingContext,
    isSavingBetaModes,
    isConfirmOpen,
    setConfirmOpen,
    onPointsCheckedChange,
    confirmDisablePoints,
    toggleContext,
    toggleBetaModes,
  };
}
