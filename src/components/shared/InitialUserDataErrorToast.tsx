import { useEffect, useRef } from "react";
import type { InitialUserDataStatus } from "@/lib/fetch-initial-user-data";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { createTranslator, type AppLocale } from "@/lib/i18n";

interface InitialUserDataErrorToastProps {
  status: InitialUserDataStatus;
  locale?: AppLocale;
}

export function InitialUserDataErrorToast({ status, locale = "en" }: InitialUserDataErrorToastProps) {
  const t = createTranslator(locale);
  const hasShownErrorToast = useRef(false);

  useEffect(() => {
    if (status !== "error" || hasShownErrorToast.current) {
      return;
    }

    hasShownErrorToast.current = true;
    toast.error(t("error.userData"));
  }, [status, t]);

  return <Toaster richColors />;
}
