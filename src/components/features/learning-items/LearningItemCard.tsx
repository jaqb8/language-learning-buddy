import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextDiff } from "@/components/shared/TextDiff";
import { AnalysisModeBadge } from "@/components/shared/AnalysisModeBadge";
import { AnalysisLanguageBadge } from "@/components/shared/AnalysisLanguageBadge";
import ReactMarkdown from "react-markdown";
import type { LearningItemViewModel } from "@/types";
import { useI18n } from "@/lib/i18n";

interface LearningItemCardProps {
  item: LearningItemViewModel;
  onDelete: (id: string) => void;
}

export function LearningItemCard({ item, onDelete }: LearningItemCardProps) {
  const { t } = useI18n();
  return (
    <Card data-test-id="learning-item-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span data-learning-item>{t("learning.item")}</span>
          <span className="text-sm font-normal text-muted-foreground">{item.formatted_created_at}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <AnalysisModeBadge mode={item.analysis_mode} className="text-xs" />
          <AnalysisLanguageBadge language={item.analysis_language} className="text-xs" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextDiff
          originalText={item.original_sentence}
          correctedText={item.corrected_sentence}
          translation={item.translation}
        />
        <div>
          <h4 className="mb-2 text-sm font-semibold px-2">{t("analysis.result.explanation")}</h4>
          <div className="text-sm leading-relaxed rounded-md bg-muted p-3">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-3 ml-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-3 ml-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
              }}
            >
              {item.explanation}
            </ReactMarkdown>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          {t("common.delete")}
        </Button>
      </CardFooter>
    </Card>
  );
}
