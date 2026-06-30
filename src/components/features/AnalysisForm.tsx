import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Loader2, Copy, Check } from "lucide-react";
import { AnalysisModeSelector } from "./AnalysisModeSelector";
import { AnalysisLanguageSelector } from "./AnalysisLanguageSelector";
import { AnalysisContextInput } from "./AnalysisContextInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/stores/settings.store";
import type { AnalysisLanguage } from "@/types";
import { useI18n } from "@/lib/i18n";

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
  language: AnalysisLanguage;
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
  language,
}: AnalysisFormProps) {
  const { t } = useI18n();
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
      toast.success(t("analysis.copySuccess"));
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error(t("analysis.copyError"));
    }
  }, [text, t]);

  const handleClearClick = useCallback(() => {
    onClear();

    // Scroll back to the main input after clearing, matching the smooth scroll behavior used for results.
    const el = document.getElementById("text-input") as HTMLTextAreaElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.focus();
  }, [onClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isDisabled) {
        e.preventDefault();
        onSubmit();
      }

      if (e.key === "Delete" && (e.ctrlKey || e.metaKey) && !isClearDisabled) {
        e.preventDefault();
        handleClearClick();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled, onSubmit, isClearDisabled, handleClearClick]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" aria-label={t("analysis.formAria")}>
      <div className="space-y-2">
        <label htmlFor="text-input" className="block text-md font-semibold">
          {t("analysis.inputLabel")}
        </label>
        <Textarea
          id="text-input"
          value={text}
          onChange={handleTextChange}
          placeholder={t(language === "pl" ? "analysis.placeholder.pl" : "analysis.placeholder.en")}
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
            {isOverLimit && t("analysis.limitExceeded")}
            {text.trim().length === 0 && text.length === 0 && t("analysis.empty")}
          </p>
          <div className="flex items-center gap-2">
            {hasText && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-7 w-7"
                aria-label={t("analysis.copy")}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <AnalysisLanguageSelector disabled={isQuotaExceeded || isAnalyzing} />
          <AnalysisModeSelector disabled={isQuotaExceeded || isAnalyzing} />
        </div>
      </div>

      {quota && quota.remaining === 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t("analysis.dailyLimitTitle")}</AlertTitle>
          <AlertDescription>
            <p>
              {t("analysis.dailyLimit", { limit: quota.limit, resetAt: formatResetTime(quota.resetAt) })}{" "}
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
                {t("analysis.dailyLimitLogin")}
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
              <Loader2 className="size-4 animate-spin" /> {t("analysis.submitting")}
            </>
          ) : (
            <>
              <Brain className="size-4" /> {t("analysis.submit")}
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
          aria-label={t("analysis.clearAria")}
          data-test-id="analysis-clear-button"
        >
          {t("analysis.clear")}
          <KbdGroup className="ml-2 hidden sm:inline-flex">
            <Kbd>{modifierKey}</Kbd>
            <Kbd>Del</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </form>
  );
}
