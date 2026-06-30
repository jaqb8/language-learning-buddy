import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  LearningItemDto,
  LearningItemViewModel,
  PaginatedResponseDto,
  PaginationViewModel,
  ApiErrorResponse,
} from "@/types";
import { useI18n, type Translator } from "@/lib/i18n";

const PAGE_SIZE = 10;

function mapErrorCodeToMessage(errorCode: string, t: Translator): string {
  const errorMessages: Record<string, string> = {
    validation_error_page_invalid: t("error.invalidPage"),
    validation_error_page_size_too_small: t("error.pageSizeSmall"),
    validation_error_page_size_too_large: t("error.pageSizeLarge"),
    validation_error_id_required: t("error.idRequired"),
    validation_error_invalid_uuid: t("error.invalidId"),
    authentication_error_unauthorized: t("error.unauthorized"),
    database_error: t("error.server"),
    not_found: t("error.notFound"),
    forbidden: t("error.forbidden"),
    unknown_error: t("error.unexpected"),
  };

  return errorMessages[errorCode] || t("error.unexpectedShort");
}

interface UseLearningItemsOptions {
  initialData?: PaginatedResponseDto<LearningItemDto> | null;
}

interface UseLearningItemsReturn {
  viewModels: LearningItemViewModel[];
  paginationViewModel: PaginationViewModel | null;
  isLoading: boolean;
  error: string | null;
  isDeleting: boolean;
  isDeleteDialogOpen: boolean;
  setPage: (page: number) => void;
  deleteItem: (item: LearningItemDto) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

interface State {
  data: PaginatedResponseDto<LearningItemDto> | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  isDeleting: boolean;
  itemToDelete: LearningItemDto | null;
}

type Action =
  | { type: "SET_PAGE"; page: number }
  | { type: "FETCH_PAGE_REQUEST" }
  | { type: "FETCH_PAGE_SUCCESS"; data: PaginatedResponseDto<LearningItemDto> }
  | { type: "FETCH_PAGE_ERROR"; error: string }
  | { type: "OPEN_DELETE_DIALOG"; item: LearningItemDto }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "DELETE_REQUEST" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "FETCH_PAGE_REQUEST":
      return { ...state, isLoading: true, error: null };
    case "FETCH_PAGE_SUCCESS":
      return { ...state, isLoading: false, data: action.data };
    case "FETCH_PAGE_ERROR":
      return { ...state, isLoading: false, error: action.error };
    case "OPEN_DELETE_DIALOG":
      return { ...state, itemToDelete: action.item };
    case "CLOSE_DELETE_DIALOG":
      return { ...state, itemToDelete: null };
    case "DELETE_REQUEST":
      return { ...state, isDeleting: true, error: null };
    case "DELETE_SUCCESS":
      return { ...state, isDeleting: false, itemToDelete: null };
    case "DELETE_ERROR":
      return { ...state, isDeleting: false, itemToDelete: null, error: action.error };
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = action;
      return state;
    }
  }
}

function formatDate(dateString: string, intlLocale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapToViewModel(item: LearningItemDto, intlLocale: string): LearningItemViewModel {
  return {
    ...item,
    formatted_created_at: formatDate(item.created_at, intlLocale),
  };
}

function mapToPaginationViewModel(
  pagination: PaginatedResponseDto<LearningItemDto>["pagination"]
): PaginationViewModel {
  return {
    ...pagination,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}

export function useLearningItems(options: UseLearningItemsOptions = {}): UseLearningItemsReturn {
  const { t, intlLocale } = useI18n();
  const { initialData = null } = options;

  const hasInitialData = initialData !== null;

  const [state, dispatch] = useReducer(reducer, {
    data: initialData,
    isLoading: !hasInitialData,
    error: null,
    page: 1,
    isDeleting: false,
    itemToDelete: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasUsedInitialDataRef = useRef(false);

  const fetchItems = useCallback(
    async (currentPage: number, signal?: AbortSignal) => {
      dispatch({ type: "FETCH_PAGE_REQUEST" });

      try {
        const response = await fetch(`/api/learning-items?page=${currentPage}&pageSize=${PAGE_SIZE}`, { signal });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          const errorMessage = mapErrorCodeToMessage(errorData.error_code, t);
          dispatch({ type: "FETCH_PAGE_ERROR", error: errorMessage });
          return;
        }

        const result: PaginatedResponseDto<LearningItemDto> = await response.json();
        dispatch({ type: "FETCH_PAGE_SUCCESS", data: result });
      } catch (err) {
        if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
          return;
        }
        console.error("Network error during fetch:", err);
        dispatch({ type: "FETCH_PAGE_ERROR", error: t("error.genericRetry") });
      }
    },
    [t]
  );

  useEffect(() => {
    // Skip only the very first fetch on page 1 if we have initial data from SSR
    if (hasInitialData && state.page === 1 && !hasUsedInitialDataRef.current) {
      hasUsedInitialDataRef.current = true;
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchItems(state.page, controller.signal);

    return () => {
      controller.abort();
    };
  }, [state.page, fetchItems, hasInitialData]);

  const handleSetPage = useCallback((newPage: number) => {
    dispatch({ type: "SET_PAGE", page: newPage });
  }, []);

  const deleteItem = useCallback((item: LearningItemDto) => {
    dispatch({ type: "OPEN_DELETE_DIALOG", item });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!state.itemToDelete) return;

    dispatch({ type: "DELETE_REQUEST" });

    try {
      const response = await fetch(`/api/learning-items/${state.itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        const errorMessage = mapErrorCodeToMessage(errorData.error_code, t);
        dispatch({ type: "DELETE_ERROR", error: errorMessage });
        return;
      }

      dispatch({ type: "DELETE_SUCCESS" });

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      await fetchItems(state.page, controller.signal);
    } catch (err) {
      console.error("Network error during delete:", err);
      dispatch({ type: "DELETE_ERROR", error: t("error.genericRetry") });
    }
  }, [state.itemToDelete, state.page, fetchItems, t]);

  const cancelDelete = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_DIALOG" });
  }, []);

  const viewModels = useMemo(
    () => state.data?.data.map((item) => mapToViewModel(item, intlLocale)) ?? [],
    [state.data, intlLocale]
  );
  const paginationViewModel = useMemo(
    () => (state.data?.pagination ? mapToPaginationViewModel(state.data.pagination) : null),
    [state.data]
  );

  return {
    viewModels,
    paginationViewModel,
    isLoading: state.isLoading,
    error: state.error,
    isDeleting: state.isDeleting,
    isDeleteDialogOpen: state.itemToDelete !== null,
    setPage: handleSetPage,
    deleteItem,
    confirmDelete,
    cancelDelete,
  };
}
