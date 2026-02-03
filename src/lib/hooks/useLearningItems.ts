import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  LearningItemDto,
  LearningItemViewModel,
  PaginatedResponseDto,
  PaginationViewModel,
  ApiErrorResponse,
} from "@/types";

const PAGE_SIZE = 10;

function mapErrorCodeToMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    validation_error_page_invalid: "Nieprawidłowy numer strony.",
    validation_error_page_size_too_small: "Rozmiar strony musi wynosić co najmniej 1.",
    validation_error_page_size_too_large: "Rozmiar strony nie może przekraczać 100.",
    validation_error_id_required: "ID elementu jest wymagane.",
    validation_error_invalid_uuid: "Nieprawidłowy format ID elementu.",
    authentication_error_unauthorized: "Musisz być zalogowany, aby wykonać tę operację.",
    database_error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.",
    not_found: "Element nie został znaleziony.",
    forbidden: "Nie masz uprawnień do wykonania tej operacji.",
    unknown_error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
  };

  return errorMessages[errorCode] || "Wystąpił nieoczekiwany błąd.";
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
  didHydrateInitialData: boolean;
}

type Action =
  | { type: "HYDRATE_INITIAL_DATA" }
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
    case "HYDRATE_INITIAL_DATA":
      return { ...state, didHydrateInitialData: true };
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapToViewModel(item: LearningItemDto): LearningItemViewModel {
  return {
    ...item,
    formatted_created_at: formatDate(item.created_at),
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
  const { initialData = null } = options;

  const hasInitialData = initialData !== null;

  const [state, dispatch] = useReducer(reducer, {
    data: initialData,
    isLoading: !hasInitialData,
    error: null,
    page: 1,
    isDeleting: false,
    itemToDelete: null,
    didHydrateInitialData: hasInitialData,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchItems = useCallback(async (currentPage: number, signal?: AbortSignal) => {
    dispatch({ type: "FETCH_PAGE_REQUEST" });

    try {
      const response = await fetch(`/api/learning-items?page=${currentPage}&pageSize=${PAGE_SIZE}`, { signal });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        const errorMessage = mapErrorCodeToMessage(errorData.error_code);
        dispatch({ type: "FETCH_PAGE_ERROR", error: errorMessage });
        return;
      }

      const result: PaginatedResponseDto<LearningItemDto> = await response.json();
      dispatch({ type: "FETCH_PAGE_SUCCESS", data: result });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Network error during fetch:", err);
      dispatch({ type: "FETCH_PAGE_ERROR", error: "Coś poszło nie tak. Spróbuj ponownie za chwilę." });
    }
  }, []);

  useEffect(() => {
    if (state.didHydrateInitialData && state.page === 1) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchItems(state.page, controller.signal);

    return () => {
      controller.abort();
    };
  }, [state.page, fetchItems, state.didHydrateInitialData]);

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
        const errorMessage = mapErrorCodeToMessage(errorData.error_code);
        dispatch({ type: "DELETE_ERROR", error: errorMessage });
        return;
      }

      dispatch({ type: "DELETE_SUCCESS" });
      await fetchItems(state.page);
    } catch (err) {
      console.error("Network error during delete:", err);
      dispatch({ type: "DELETE_ERROR", error: "Coś poszło nie tak. Spróbuj ponownie za chwilę." });
    }
  }, [state.itemToDelete, state.page, fetchItems]);

  const cancelDelete = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_DIALOG" });
  }, []);

  const viewModels = useMemo(() => state.data?.data.map(mapToViewModel) ?? [], [state.data]);
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
