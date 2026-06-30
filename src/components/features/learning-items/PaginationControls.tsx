import { Button } from "@/components/ui/button";
import type { PaginationViewModel } from "@/types";
import { useI18n } from "@/lib/i18n";

interface PaginationControlsProps {
  pagination: PaginationViewModel;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      <Button
        variant="outline"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPreviousPage}
      >
        {t("learning.previous")}
      </Button>

      <span className="text-sm text-muted-foreground">
        {t("learning.page", { page: pagination.page, total: pagination.totalPages })}
      </span>

      <Button variant="outline" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage}>
        {t("learning.next")}
      </Button>
    </div>
  );
}
