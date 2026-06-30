import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface CopyCorrectedTextButtonProps {
  correctedText: string;
}

export function CopyCorrectedTextButton({ correctedText }: CopyCorrectedTextButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
      setCopied(true);
      toast.success(t("analysis.copySuccess"));
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error(t("analysis.copyError"));
    }
  }, [correctedText, t]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-7 w-7"
      aria-label={t("analysis.result.copyCorrected")}
      data-test-id="copy-corrected-text-button"
    >
      {copied ? (
        <Check className="size-3.5 text-green-600 dark:text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}
