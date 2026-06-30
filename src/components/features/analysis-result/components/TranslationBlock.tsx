import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface TranslationBlockProps {
  translation: string;
}

export function TranslationBlock({ translation }: TranslationBlockProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-2 pt-4 max-w-2xl w-full">
      <div className="border-t border-border w-full pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 justify-center">
          <Languages className="size-4" aria-hidden="true" />
          {t("analysis.result.translation")}
        </h3>
        <div
          className="text-sm font-thin leading-relaxed text-foreground/80 italic mt-2"
          data-test-id="analysis-result-translation"
        >
          {translation}
        </div>
      </div>
    </div>
  );
}
