import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisResultLoading() {
  return (
    <Card aria-busy="true" role="status" aria-label="Ładowanie wyników analizy" data-test-id="analysis-result-loading">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
      <span className="sr-only">Analizuję tekst, proszę czekać...</span>
    </Card>
  );
}
