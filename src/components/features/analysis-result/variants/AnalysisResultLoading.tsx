import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export function AnalysisResultLoading() {
  const { t } = useI18n();
  return (
    <Card
      aria-busy="true"
      role="status"
      aria-label={t("analysis.result.loadingAria")}
      data-test-id="analysis-result-loading"
    >
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
      <span className="sr-only">{t("analysis.result.loading")}</span>
    </Card>
  );
}
