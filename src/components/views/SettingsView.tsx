import { useSettingsViewController } from "@/lib/hooks/useSettingsViewController";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BetaBadge } from "@/components/shared/BetaBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

export function SettingsView({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <I18nProvider locale={locale}>
      <SettingsViewContent />
    </I18nProvider>
  );
}

function SettingsViewContent() {
  const { t } = useI18n();
  const {
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
  } = useSettingsViewController();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-base sm:text-lg">{t("settings.subtitle")}</p>
      </header>

      <section className="space-y-4" aria-label={t("settings.optionsAria")}>
        {!isLoaded ? (
          <>
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{t("settings.points.title")}</span>
                  {gamificationBetaTagEnabled && <BetaBadge />}
                </CardTitle>
                <CardDescription>{t("settings.points.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {currentPointsEnabled ? t("settings.points.active") : t("settings.points.inactive")}
                </div>
                <Switch
                  checked={currentPointsEnabled}
                  className="cursor-pointer"
                  disabled={!isLoaded || isSavingPoints}
                  onCheckedChange={onPointsCheckedChange}
                  aria-label={t("settings.points.aria")}
                  data-test-id="settings-points-switch"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.context.title")}</CardTitle>
                <CardDescription>{t("settings.context.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {currentContextEnabled ? t("settings.context.visible") : t("settings.context.hidden")}
                </div>
                <Switch
                  checked={currentContextEnabled}
                  className="cursor-pointer"
                  disabled={!isLoaded || isSavingContext}
                  onCheckedChange={toggleContext}
                  aria-label={t("settings.context.aria")}
                  data-test-id="settings-context-switch"
                />
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.disable.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.disable.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingPoints}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDisablePoints} disabled={isSavingPoints}>
                {t("settings.disable.confirm")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
