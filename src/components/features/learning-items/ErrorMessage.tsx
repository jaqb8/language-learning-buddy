import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-destructive mb-2">{t("learning.errorTitle")}</p>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <Button onClick={() => window.location.reload()}>{t("common.refresh")}</Button>
      </CardContent>
    </Card>
  );
}
