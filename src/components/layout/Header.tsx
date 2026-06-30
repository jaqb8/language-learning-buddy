import { useAuthStore } from "@/lib/stores/auth.store";
import { usePointsStore } from "@/lib/stores/points.store";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { isFeatureEnabled, isFeatureBeta } from "@/features/feature-flags.service";
import { buildHeaderVM } from "./header/header.model";
import { HeaderDesktop } from "./header/HeaderDesktop";
import { HeaderMobile } from "./header/HeaderMobile";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  locale?: AppLocale;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
}

export function Header({ locale = "en", ...props }: Navbar1Props) {
  return (
    <I18nProvider locale={locale}>
      <HeaderContent {...props} />
    </I18nProvider>
  );
}

function HeaderContent({
  logo = {
    url: "/",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
    alt: "Language Learning Buddy",
    title: "Language Learning Buddy",
  },
  menu,
}: Navbar1Props) {
  const { t } = useI18n();
  const { user, isAuth, isAuthInitialized } = useAuthStore();
  const { correctAnalyses, totalAnalyses } = usePointsStore();
  const { pointsEnabled: pointsSettingEnabled, isLoaded: areSettingsLoaded } = useSettingsStore();
  const isAuthFeatureEnabled = isFeatureEnabled("auth");
  const isLearningItemsFeatureEnabled = isFeatureEnabled("learning-items");
  const gamificationFeatureEnabled = isFeatureEnabled("gamification");
  const gamificationBetaTagEnabled = isFeatureBeta("gamification");
  const resolvedMenu = menu ?? [
    { title: t("header.analyze"), url: "/" },
    { title: t("header.learningList"), url: "/learning-list" },
  ];

  const vm = buildHeaderVM({
    logo,
    menu: resolvedMenu,
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
