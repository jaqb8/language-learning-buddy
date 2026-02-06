import type { Database } from "./db/database.types";
import type { ZodSchema } from "zod";

// ============================================================================
// Database Entities
// ============================================================================

/**
 * Represents a single learning item record from the `learning_items` table.
 * This is the core entity type that other DTOs will be derived from.
 */
export type LearningItem = Database["public"]["Tables"]["learning_items"]["Row"];

/**
 * Represents the mode of text analysis.
 * - 'grammar_and_spelling': Analyzes text for grammatical and spelling errors
 * - 'colloquial_speech': Analyzes text for naturalness and colloquial style
 * - 'beta_grammar_and_spelling': Beta version of grammar analysis with optimized prompts
 * - 'beta_colloquial_speech': Beta version of colloquial speech analysis with optimized prompts
 */
export type AnalysisMode =
  | "grammar_and_spelling"
  | "colloquial_speech"
  | "beta_grammar_and_spelling"
  | "beta_colloquial_speech";

// ============================================================================
// API DTOs (Data Transfer Objects)
// ============================================================================

/**
 * DTO for API error responses.
 * All API endpoints return errors in this standardized format.
 *
 * @see src/lib/api-helpers.ts
 */
export interface ApiErrorResponse {
  error_code: string;
  data?: Record<string, unknown>;
}

export interface UserSettings {
  pointsEnabled: boolean;
  contextEnabled: boolean;
  betaModesEnabled: boolean;
}

/**
 * Statistics for user text analyses used in gamification.
 * Used to calculate percentage of correct analyses.
 */
export interface AnalysisStats {
  correctAnalyses: number;
  totalAnalyses: number;
}

/**
 * DTO for a learning item returned to the client.
 * It omits the `user_id` to avoid exposing it unnecessarily.
 *
 * @see GET /api/learning-items
 */
export type LearningItemDto = Pick<
  LearningItem,
  "id" | "original_sentence" | "corrected_sentence" | "explanation" | "analysis_mode" | "translation" | "created_at"
>;

/**
 * DTO for pagination metadata.
 */
export interface PaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Generic DTO for a paginated API response.
 * @template T The type of the items in the data array.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationDto;
}

/**
 * DTO for the response of a text analysis request.
 * It's a discriminated union based on whether errors were found.
 *
 * @see POST /api/analyze
 */
export type TextAnalysisDto =
  | {
      is_correct: true;
      original_text: string;
      translation: string | null;
    }
  | {
      is_correct: false;
      original_text: string;
      corrected_text: string;
      explanation: string;
      translation: string | null;
    };

/**
 * DTO for a user after a successful sign-up.
 * Represents the public-facing user data.
 *
 * @see POST /api/auth/signup
 */
export interface UserDto {
  id: string;
  email: string;
  created_at: string;
}

/**
 * DTO for a user after a successful sign-in.
 * It's a subset of the full UserDto.
 *
 * @see POST /api/auth/signin
 */
export type SignedInUserDto = Omit<UserDto, "created_at">;

// ============================================================================
// API Command Models
// ============================================================================

/**
 * Command model for creating a new learning item.
 * It includes only the properties required from the client, as `user_id`
 * will be derived from the session on the server.
 *
 * @see POST /api/learning-items
 */
export type CreateLearningItemCommand = Pick<
  LearningItem,
  "original_sentence" | "corrected_sentence" | "explanation" | "analysis_mode" | "translation"
>;

/**
 * Command model for analyzing a piece of text.
 * The `mode` field is optional and defaults to 'grammar_and_spelling'.
 *
 * @see POST /api/analyze
 */
export interface AnalyzeTextCommand {
  text: string;
  mode?: AnalysisMode;
}

/**
 * Base command model for authentication credentials.
 */
interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Command model for user sign-up.
 *
 * @see POST /api/auth/signup
 */
export type SignUpCommand = AuthCredentials;

/**
 * Command model for user sign-in.
 *
 * @see POST /api/auth/signin
 */
export type SignInCommand = AuthCredentials;

// ============================================================================
// Service Layer Result Types
// ============================================================================

/**
 * Generic result type for service layer operations that return data.
 * Provides a discriminated union for success and error cases.
 *
 * @template TData The type of data returned on success
 * @template TError The union of possible error types (as string literals)
 *
 * @example
 * type CreateResult = ServiceResult<User, "database_error" | "validation_error">;
 *
 * const result: CreateResult = await service.create(data);
 * if (result.success) {
 *   console.log(result.data); // User
 * } else {
 *   console.error(result.error); // "database_error" | "validation_error"
 * }
 */
export type ServiceResult<TData, TError extends string> =
  | { success: true; data: TData }
  | { success: false; error: TError };

/**
 * Result type for service layer operations that don't return data.
 * Used for operations like delete, update without return, etc.
 *
 * @template TError The union of possible error types (as string literals)
 *
 * @example
 * type DeleteResult = ServiceVoidResult<"not_found" | "forbidden">;
 *
 * const result: DeleteResult = await service.delete(id);
 * if (result.success) {
 *   console.log("Deleted successfully");
 * } else {
 *   console.error(result.error); // "not_found" | "forbidden"
 * }
 */
export type ServiceVoidResult<TError extends string> = { success: true } | { success: false; error: TError };

// ============================================================================
// View Models
// ============================================================================

/**
 * View model for a learning item with formatted date for UI display.
 * Extends LearningItemDto with a human-readable date format.
 */
export interface LearningItemViewModel extends LearningItemDto {
  formatted_created_at: string;
}

/**
 * View model for pagination with UI state flags.
 * Extends PaginationDto with boolean flags for navigation controls.
 */
export interface PaginationViewModel extends PaginationDto {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * View model for authenticated user data displayed in the UI.
 * Contains minimal user information needed for the header and navigation.
 */
export interface UserViewModel {
  id: string;
  email: string;
  avatarUrl: string | null;
}

// ============================================================================
// AI Configuration Types
// ============================================================================

/**
 * Configuration for the AI model.
 * Contains model name and inference parameters.
 */
export interface AIModelConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Configuration for a specific analysis mode.
 * Contains the system prompt and Zod schema for validating responses.
 */
export interface AnalysisModeConfig {
  prompt: string;
  schema: ZodSchema<TextAnalysisDto>;
}

// ============================================================================
// Analysis Mode Types & Constants
// ============================================================================

export const ANALYSIS_MODES = {
  GRAMMAR_AND_SPELLING: "grammar_and_spelling",
  COLLOQUIAL_SPEECH: "colloquial_speech",
  BETA_GRAMMAR_AND_SPELLING: "beta_grammar_and_spelling",
  BETA_COLLOQUIAL_SPEECH: "beta_colloquial_speech",
} as const;

/**
 * DTO describing an available analysis mode.
 * Returned by GET /api/analyze/modes.
 */
export interface AnalysisModeDto {
  value: AnalysisMode;
  label: string;
  description: string;
  isBeta: boolean;
  testId: string;
}

// ============================================================================
// AI Provider Interface
// ============================================================================

export interface AIProvider {
  analyzeText(mode: AnalysisMode, text: string, context?: string): Promise<TextAnalysisDto>;
}
