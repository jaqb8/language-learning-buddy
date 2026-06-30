import { useCallback, useMemo, useReducer } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
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
  | { kind: "savingContext"; enabled: boolean };

type Action =
  | { type: "IDLE" }
  | { type: "CONFIRM_DISABLE_POINTS" }
  | { type: "SAVING_POINTS_ENABLE" }
  | { type: "SAVING_POINTS_DISABLE" }
  | { type: "SAVING_CONTEXT"; enabled: boolean };

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
  }
}

export function useSettingsViewController() {
  const { t } = useI18n();
  const { pointsEnabled, contextEnabled, isLoaded, initializeSettings } = useSettingsStore();
  const clearStats = usePointsStore((state) => state.clearStats);
  const setStats = usePointsStore((state) => state.setStats);
  const { updateSettings, resetPoints } = useSettingsActions();
  const { fetchStats } = usePointsActions();
  const [state, dispatch] = useReducer(reducer, { kind: "idle" });

  const gamificationBetaTagEnabled = isFeatureBeta("gamification");

  const currentPointsEnabled = useMemo(() => (isLoaded ? pointsEnabled : true), [isLoaded, pointsEnabled]);
  const currentContextEnabled = useMemo(() => (isLoaded ? contextEnabled : true), [isLoaded, contextEnabled]);

  const isSavingPoints = state.kind === "savingPointsEnable" || state.kind === "savingPointsDisable";
  const isSavingContext = state.kind === "savingContext";
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

      toast.success(t("settings.toast.pointsEnabled"));
    } else if (result.errorMessage) {
      toast.error(result.errorMessage);
    }

    dispatch({ type: "IDLE" });
  }, [fetchStats, initializeSettings, setStats, t, updateSettings]);

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
    toast.success(t("settings.toast.pointsDisabled"));
    dispatch({ type: "IDLE" });
  }, [clearStats, initializeSettings, resetPoints, t, updateSettings]);

  const toggleContext = useCallback(
    async (enabled: boolean) => {
      dispatch({ type: "SAVING_CONTEXT", enabled });
      const updated = await updateSettings({ contextEnabled: enabled });
      if (updated.data) {
        initializeSettings(updated.data);
        toast.success(enabled ? t("settings.toast.contextEnabled") : t("settings.toast.contextDisabled"));
      } else if (updated.errorMessage) {
        toast.error(updated.errorMessage);
      }
      dispatch({ type: "IDLE" });
    },
    [initializeSettings, t, updateSettings]
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
    currentPointsEnabled,
    currentContextEnabled,
    isSavingPoints,
    isSavingContext,
    isConfirmOpen,
    setConfirmOpen,
    onPointsCheckedChange,
    confirmDisablePoints,
    toggleContext,
  };
}
