import { useSettingsViewController } from "@/lib/hooks/useSettingsViewController";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export function SettingsView() {
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ustawienia</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Zarządzaj funkcjami aplikacji i dostosuj sposób działania analizy.
        </p>
      </header>

      <section className="space-y-4" aria-label="Opcje ustawień">
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
                  <span>Procent poprawnych analiz</span>
                  {gamificationBetaTagEnabled && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 border border-amber-400 dark:border-amber-500 rounded-sm px-1 py-0.5">
                      beta
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Wyświetla procent analiz bez błędów i pomaga śledzić postępy w nauce.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {currentPointsEnabled
                    ? "Funkcja jest aktywna."
                    : "Funkcja jest wyłączona, statystyki nie będą zbierane."}
                </div>
                <Switch
                  checked={currentPointsEnabled}
                  className="cursor-pointer"
                  disabled={!isLoaded || isSavingPoints}
                  onCheckedChange={onPointsCheckedChange}
                  aria-label="Zliczanie punktów"
                  data-test-id="settings-points-switch"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontekst analizy</CardTitle>
                <CardDescription>
                  Włącz, aby dodawać dodatkowy kontekst i poprawić jakość analizy tekstu.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {currentContextEnabled ? "Pole kontekstu jest widoczne." : "Pole kontekstu jest ukryte."}
                </div>
                <Switch
                  checked={currentContextEnabled}
                  className="cursor-pointer"
                  disabled={!isLoaded || isSavingContext}
                  onCheckedChange={toggleContext}
                  aria-label="Kontekst analizy"
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
            <AlertDialogTitle>Wyłączyć śledzenie postępów?</AlertDialogTitle>
            <AlertDialogDescription>
              Twoje statystyki analiz zostaną trwale usunięte. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingPoints}>Anuluj</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDisablePoints} disabled={isSavingPoints}>
                Wyłącz i usuń statystyki
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
