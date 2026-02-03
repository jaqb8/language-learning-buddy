import { useState, useCallback, type ChangeEvent } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, FileText, CircleHelp } from "lucide-react";

interface AnalysisContextInputProps {
  analysisContext: string;
  onAnalysisContextChange: (analysisContext: string) => void;
  maxLength: number;
  triggerDisabled?: boolean;
  inputDisabled?: boolean;
}

export function AnalysisContextInput({
  analysisContext,
  onAnalysisContextChange,
  maxLength,
  triggerDisabled = false,
  inputDisabled = false,
}: AnalysisContextInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isOverLimit = analysisContext.length > maxLength;

  const handleContextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onAnalysisContextChange(e.target.value);
    },
    [onAnalysisContextChange]
  );

  const handleClear = useCallback(() => {
    onAnalysisContextChange("");
  }, [onAnalysisContextChange]);

  const hasContext = analysisContext.trim().length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-between px-4 py-3 font-normal hover:bg-transparent h-auto"
          disabled={triggerDisabled}
          aria-expanded={isOpen}
          aria-controls="analysis-context-content"
        >
          <div className="flex items-center gap-2">
            <FileText className="size-4" aria-hidden="true" />
            <span className="text-sm font-medium">Kontekst (opcjonalne)</span>
          </div>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        id="analysis-context-content"
        className="space-y-2 px-4 pb-4 pt-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden"
      >
        <div className="flex items-center gap-1 text-muted-foreground">
          <Info className="size-3 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Podaj dodatkowy kontekst do analizowanego wyrażenia. Zostanie on uwzględniony podczas analizy pod kątem
            odpowiedniego doboru słownictwa i gramatyki.
          </p>
        </div>
        <Textarea
          id="analysis-context-input"
          value={analysisContext}
          onChange={handleContextChange}
          placeholder="Wpisz tutaj dodatkowy kontekst..."
          disabled={inputDisabled}
          rows={4}
          className="text-base"
          aria-describedby="context-char-count context-char-count-helper"
          aria-invalid={isOverLimit}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          data-test-id="analysis-context-input"
        />
        {inputDisabled && (
          <div
            className="flex items-center gap-1 text-xs"
            role="note"
            aria-live="polite"
            data-test-id="analysis-context-disabled-hint"
          >
            <CircleHelp className="size-3 shrink-0" aria-hidden="true" />
            <p>Podaj treść analizy, aby dodać dodatkowy kontekst</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p id="context-char-count-helper" className="text-destructive text-xs">
            {isOverLimit && "Przekroczono limit znaków. "}
          </p>
          <div className="flex items-center gap-2">
            {hasContext && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={inputDisabled}
                className="h-6"
                aria-label="Wyczyść kontekst"
                data-test-id="clear-context-button"
              >
                Wyczyść
              </Button>
            )}
            {!inputDisabled && (
              <p
                id="context-char-count"
                className={`text-sm font-medium tabular-nums ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
                aria-live="polite"
                role="status"
              >
                {analysisContext.length} / {maxLength}
              </p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
