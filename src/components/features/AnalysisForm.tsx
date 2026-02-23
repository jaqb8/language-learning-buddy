import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Loader2, Copy, Check } from "lucide-react";
import { AnalysisModeSelector } from "./AnalysisModeSelector";
import { AnalysisContextInput } from "./AnalysisContextInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/stores/settings.store";

interface QuotaStatus {
  remaining: number;
  resetAt: string;
  limit: number;
}

interface AnalysisFormProps {
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading: boolean;
  isAnalyzing: boolean;
  maxLength: number;
  quota?: QuotaStatus | null;
  formatResetTime: (resetAt: string) => string;
  analysisContext?: string;
  onAnalysisContextChange?: (analysisContext: string) => void;
  isAuth?: boolean;
}

export function AnalysisForm({
  text,
  onTextChange,
  onSubmit,
  onClear,
  isLoading,
  isAnalyzing,
  maxLength,
  quota,
  formatResetTime,
  analysisContext = "",
  onAnalysisContextChange,
  isAuth = false,
}: AnalysisFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  const [modifierKey, setModifierKey] = useState("Ctrl");
  const { contextEnabled, isLoaded } = useSettingsStore();
  const isContextEnabled = !isLoaded || contextEnabled;

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    setModifierKey(isMac ? "⌘" : "Ctrl");
  }, []);

  const isOverLimit = text.length > maxLength;
  const isQuotaExceeded = quota !== null && quota !== undefined && quota.remaining === 0;
  const isDisabled = isLoading || text.trim().length === 0 || isOverLimit || isQuotaExceeded;
  const hasText = text.trim().length > 0;
  const isClearDisabled = isLoading || isAnalyzing || !hasText;
  const isContextTriggerDisabled = isAnalyzing || isQuotaExceeded;
  const isContextTextareaDisabled = isAnalyzing || isQuotaExceeded || !hasText;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onTextChange(e.target.value);
    },
    [onTextChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isDisabled) {
        onSubmit();
      }
    },
    [isDisabled, onSubmit]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Skopiowano do schowka!");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Nie udało się skopiować tekstu");
    }
  }, [text]);

  const handleClearClick = useCallback(() => {
    onClear();

    // Scroll back to the main input after clearing, matching the smooth scroll behavior used for results.
    const el = document.getElementById("text-input") as HTMLTextAreaElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.focus();
  }, [onClear]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isDisabled) {
        e.preventDefault();
        onSubmit();
      }

      if (e.key === "Backspace" && (e.ctrlKey || e.metaKey) && e.shiftKey && !isClearDisabled) {
        e.preventDefault();
        handleClearClick();
      }
    };

    form.addEventListener("keydown", handleKeyDown);
    return () => form.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled, onSubmit, isClearDisabled, handleClearClick]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" aria-label="Formularz analizy tekstu">
      <div className="space-y-2">
        <label htmlFor="text-input" className="block text-md font-semibold">
          Wprowadź tekst do analizy
        </label>
        <Textarea
          id="text-input"
          value={text}
          onChange={handleTextChange}
          placeholder="Wpisz tutaj swój tekst w języku angielskim..."
          disabled={isAnalyzing || isQuotaExceeded}
          rows={8}
          className="text-lg md:text-lg"
          aria-describedby="char-count char-count-helper"
          aria-invalid={isOverLimit}
          aria-required="true"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          data-test-id="analysis-text-input"
        />
        <div className="flex items-center justify-between gap-2">
          <p
            id="char-count-helper"
            className={cn(
              "text-xs",
              isOverLimit && "text-destructive",
              text.trim().length === 0 && text.length === 0 && "text-muted-foreground"
            )}
          >
            {isOverLimit && "Przekroczono limit znaków. "}
            {text.trim().length === 0 && text.length === 0 && "Pole nie może być puste."}
          </p>
          <div className="flex items-center gap-2">
            {hasText && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-7 w-7"
                aria-label="Kopiuj tekst do schowka"
                data-test-id="copy-text-button"
              >
                {copied ? (
                  <Check className="size-3.5 text-green-600 dark:text-green-500" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
              </Button>
            )}
            <p
              id="char-count"
              className={`text-sm font-medium tabular-nums ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
              aria-live="polite"
              role="status"
            >
              {text.length} / {maxLength}
            </p>
          </div>
        </div>
        {isAuth && isContextEnabled && onAnalysisContextChange && (
          <AnalysisContextInput
            analysisContext={analysisContext}
            onAnalysisContextChange={onAnalysisContextChange}
            maxLength={maxLength}
            triggerDisabled={isContextTriggerDisabled}
            inputDisabled={isContextTextareaDisabled}
          />
        )}
        <AnalysisModeSelector disabled={isQuotaExceeded} />
      </div>

      {quota && quota.remaining === 0 && (
        <Alert variant="destructive">
          <AlertTitle>Przekroczono dzienny limit analiz</AlertTitle>
          <AlertDescription>
            <p>
              Przekroczono dzienny limit {quota.limit} analiz dla niezalogowanych użytkowników. Limit zostanie
              zresetowany {formatResetTime(quota.resetAt)}.{" "}
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = "/login";
                }}
                className={cn(
                  "font-semibold underline underline-offset-4",
                  "hover:no-underline transition-all",
                  "cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                  "text-destructive hover:text-destructive/80"
                )}
              >
                Zaloguj się, aby uzyskać nielimitowany dostęp do analizy tekstu.
              </a>
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isDisabled}
          className="w-full text-lg"
          aria-busy={isAnalyzing}
          size="lg"
          data-test-id="analysis-submit-button"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Analizuję...
            </>
          ) : (
            <>
              <Brain className="size-4" /> Analizuj tekst
              <KbdGroup className="ml-2 hidden sm:inline-flex">
                <Kbd>{modifierKey}</Kbd>
                <Kbd>Enter</Kbd>
              </KbdGroup>
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={handleClearClick}
          disabled={isClearDisabled}
          variant="outline"
          className="w-full text-lg"
          size="lg"
          aria-label="Wyczyść formularz i zacznij od nowa"
          data-test-id="analysis-clear-button"
        >
          Wyczyść
          <KbdGroup className="ml-2 hidden sm:inline-flex">
            <Kbd>{modifierKey}</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>⌫</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </form>
  );
}
