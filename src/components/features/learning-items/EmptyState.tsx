import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function EmptyState() {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground mb-2">{t("learning.emptyTitle")}</p>
        <p className="text-sm text-muted-foreground mb-4">{t("learning.emptyDescription")}</p>
        <Button asChild>
          <a href="/">{t("learning.goToAnalysis")}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
