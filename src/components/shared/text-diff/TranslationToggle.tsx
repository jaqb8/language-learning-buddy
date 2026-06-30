import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface TranslationToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function TranslationToggle({ isVisible, onToggle }: TranslationToggleProps) {
  const { t } = useI18n();
  const label = t(isVisible ? "analysis.result.hideTranslation" : "analysis.result.showTranslation");
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn("h-7 text-xs sm:px-2 px-1", isVisible && "bg-accent text-accent-foreground")}
      aria-label={label}
      data-test-id="toggle-translation-button"
    >
      <Languages className="size-3.5 sm:mr-1" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
