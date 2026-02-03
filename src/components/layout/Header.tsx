import { useAuthStore } from "@/lib/stores/auth.store";
import { usePointsStore } from "@/lib/stores/points.store";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { isFeatureEnabled, isFeatureBeta } from "@/features/feature-flags.service";
import { buildHeaderVM } from "./header/header.model";
import { HeaderDesktop } from "./header/HeaderDesktop";
import { HeaderMobile } from "./header/HeaderMobile";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
}

export function Header({
  logo = {
    url: "/",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
    alt: "Language Learning Buddy",
    title: "Language Learning Buddy",
  },
  menu = [
    { title: "Analiza", url: "/" },
    { title: "Moja lista", url: "/learning-list" },
  ],
}: Navbar1Props) {
  const { user, isAuth, isAuthInitialized } = useAuthStore();
  const { correctAnalyses, totalAnalyses } = usePointsStore();
  const { pointsEnabled: pointsSettingEnabled, isLoaded: areSettingsLoaded } = useSettingsStore();
  const isAuthFeatureEnabled = isFeatureEnabled("auth");
  const isLearningItemsFeatureEnabled = isFeatureEnabled("learning-items");
  const gamificationFeatureEnabled = isFeatureEnabled("gamification");
  const gamificationBetaTagEnabled = isFeatureBeta("gamification");

  const vm = buildHeaderVM({
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
  });

  return (
    <section className="py-4">
      <HeaderDesktop vm={vm} />
      <HeaderMobile vm={vm} />
    </section>
  );
}
