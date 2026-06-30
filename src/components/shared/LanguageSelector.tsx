import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { createTranslator, setAppLocaleCookie, type AppLocale, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  locale: AppLocale;
  variant?: "compact" | "full";
  className?: string;
}

const options: { value: AppLocale; labelKey: TranslationKey; shortLabel: string }[] = [
  { value: "en", labelKey: "language.english", shortLabel: "EN" },
  { value: "pl", labelKey: "language.polish", shortLabel: "PL" },
];

export function LanguageSelector({ locale, variant = "compact", className }: LanguageSelectorProps) {
  const t = createTranslator(locale);
  const selected = options.find((option) => option.value === locale)!;

  const handleValueChange = (value: string) => {
    if (value !== "en" && value !== "pl") return;
    setAppLocaleCookie(value);
    window.location.reload();
  };

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t("language.select")}
        data-test-id={variant === "compact" ? "language-selector" : "language-selector-mobile"}
        className={cn(
          variant === "compact" ? "h-9 min-w-24 bg-background" : "h-10 w-full bg-secondary justify-between",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <LanguageFlag language={locale} />
            <span>{variant === "compact" ? selected.shortLabel : t(selected.labelKey)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} data-test-id={`language-option-${option.value}`}>
            <LanguageFlag language={option.value} />
            <span>{t(option.labelKey)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LanguageSelectorLabel({ locale }: { locale: AppLocale }) {
  const t = createTranslator(locale);
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
      {t("language.label")}
    </span>
  );
}
