import { useEffect } from "react";
import { toast } from "sonner";
import { useLearningItems } from "@/lib/hooks/useLearningItems";
import { LearningItemsList } from "@/components/features/learning-items/LearningItemsList";
import { PaginationControls } from "@/components/features/learning-items/PaginationControls";
import { DeleteConfirmationDialog } from "@/components/features/learning-items/DeleteConfirmationDialog";
import { LoadingSkeleton } from "@/components/features/learning-items/LoadingSkeleton";
import { ErrorMessage } from "@/components/features/learning-items/ErrorMessage";
import type { LearningItemDto, PaginatedResponseDto } from "@/types";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

interface LearningItemsViewProps {
  locale?: AppLocale;
  initialData?: PaginatedResponseDto<LearningItemDto> | null;
  initialLoadError?: boolean;
}

export function LearningItemsView({ locale = "en", ...props }: LearningItemsViewProps) {
  return (
    <I18nProvider locale={locale}>
      <LearningItemsViewContent {...props} />
    </I18nProvider>
  );
}

function LearningItemsViewContent({ initialData, initialLoadError }: Omit<LearningItemsViewProps, "locale">) {
  const { t } = useI18n();
  const {
    viewModels,
    paginationViewModel,
    isLoading,
    error,
    isDeleting,
    isDeleteDialogOpen,
    setPage,
    deleteItem,
    confirmDelete,
    cancelDelete,
  } = useLearningItems({ initialData });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeleteItem = (id: string) => {
    const item = viewModels.find((vm) => vm.id === id);
    if (item) {
      deleteItem(item);
    }
  };

  const handleConfirmDelete = async () => {
    await confirmDelete();
    toast.success(t("learning.deleted"));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t("learning.title")}</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if ((error || initialLoadError) && !viewModels.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t("learning.title")}</h1>
        <ErrorMessage message={error || t("learning.loadError")} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t("learning.title")}</h1>

      <LearningItemsList items={viewModels} onDeleteItem={handleDeleteItem} />

      {paginationViewModel && viewModels.length > 0 && (
        <PaginationControls pagination={paginationViewModel} onPageChange={setPage} />
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        isPending={isDeleting}
        onCancel={cancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
