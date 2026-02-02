import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookPlus, UserPlus } from "lucide-react";
import type { SaveCtaModel } from "../analysisResult.model";

interface SaveToLearningListButtonProps {
  cta: Exclude<SaveCtaModel, { kind: "hidden" }>;
  onClick: () => void;
}

export function SaveToLearningListButton({ cta, onClick }: SaveToLearningListButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={cta.disabled}
      variant="secondary"
      className={cn("w-full text-lg h-10", cta.emphasizeUnauthHover && "hover:bg-accent/90")}
      aria-label={cta.ariaLabel}
      data-test-id="analysis-save-button"
    >
      {cta.kind === "saved" ? (
        cta.label
      ) : cta.kind === "save" ? (
        <>
          <BookPlus className="size-4" />
          {cta.label}
        </>
      ) : (
        <>
          <UserPlus className="size-4" />
          {cta.label}
        </>
      )}
    </Button>
  );
}
