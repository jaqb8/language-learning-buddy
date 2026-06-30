import type { UserViewModel } from "@/types";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface HeaderLogo {
  url: string;
  src: string;
  alt: string;
  title: string;
}

export type PointsBadgeVM =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "visible"; correctAnalyses?: number; totalAnalyses?: number; showBeta: boolean };

export type HeaderAuthVM =
  | { kind: "hidden" }
  | { kind: "unauthenticated" }
  | { kind: "authenticated"; user: UserViewModel; pointsBadge: PointsBadgeVM };

export interface HeaderVM {
  logo: HeaderLogo;
  menu: MenuItem[];
  auth: HeaderAuthVM;
  showModeToggleDesktop: boolean;
}

export function buildHeaderVM({
  logo,
  menu,
  user,
  isAuth,
  isAuthInitialized,
  isAuthFeatureEnabled,
  isLearningItemsFeatureEnabled,
  gamificationFeatureEnabled,
  gamificationBetaTagEnabled,
  pointsSettingEnabled,
  areSettingsLoaded,
  correctAnalyses,
  totalAnalyses,
}: {
  logo: HeaderLogo;
  menu: MenuItem[];
  user: UserViewModel | null;
  isAuth: boolean;
  isAuthInitialized: boolean;
  isAuthFeatureEnabled: boolean;
  isLearningItemsFeatureEnabled: boolean;
  gamificationFeatureEnabled: boolean;
  gamificationBetaTagEnabled: boolean;
  pointsSettingEnabled: boolean;
  areSettingsLoaded: boolean;
  correctAnalyses: number | null;
  totalAnalyses: number | null;
}): HeaderVM {
  const shouldShowAuthControls = isAuthFeatureEnabled && isAuthInitialized;
  const filteredMenu = isAuth && isLearningItemsFeatureEnabled ? menu : [];

  if (!shouldShowAuthControls) {
    return {
      logo,
      menu: filteredMenu,
      auth: { kind: "hidden" },
      showModeToggleDesktop: true,
    };
  }

  if (!user) {
    return {
      logo,
      menu: filteredMenu,
      auth: { kind: "unauthenticated" },
      showModeToggleDesktop: true,
    };
  }

  const pointsBadge: PointsBadgeVM = !gamificationFeatureEnabled
    ? { kind: "hidden" }
    : !areSettingsLoaded
      ? { kind: "loading" }
      : !pointsSettingEnabled || totalAnalyses === null
        ? { kind: "hidden" }
        : {
            kind: "visible",
            correctAnalyses: correctAnalyses ?? undefined,
            totalAnalyses: totalAnalyses ?? undefined,
            showBeta: gamificationBetaTagEnabled,
          };

  return {
    logo,
    menu: filteredMenu,
    auth: { kind: "authenticated", user, pointsBadge },
    showModeToggleDesktop: false,
  };
}
