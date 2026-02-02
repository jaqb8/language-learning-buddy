import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyCorrectedTextButtonProps {
  correctedText: string;
}

export function CopyCorrectedTextButton({ correctedText }: CopyCorrectedTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
      setCopied(true);
      toast.success("Skopiowano do schowka!");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Nie udało się skopiować tekstu");
    }
  }, [correctedText]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-7 w-7"
      aria-label="Kopiuj poprawiony tekst do schowka"
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
