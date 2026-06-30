import type { APIRoute } from "astro";
import { z } from "zod";
import { LearningItemsService, LearningItemsDatabaseError } from "@/lib/services/learning-items";
import { createErrorResponse, createValidationErrorResponse } from "@/lib/api-helpers";
import { isFeatureEnabled } from "@/features/feature-flags.service";
import { isValidAnalysisLanguage, isValidAnalysisMode } from "@/lib/analysis-mode.constants";
import type { AnalysisLanguage, AnalysisMode } from "@/types";

export const prerender = false;

const queryParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive({ message: "validation_error_page_invalid" })),
  pageSize: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .min(1, { message: "validation_error_page_size_too_small" })
        .max(100, { message: "validation_error_page_size_too_large" })
    ),
});

const createLearningItemSchema = z.object({
  original_sentence: z.string().min(1, { message: "validation_error_original_sentence_empty" }),
  corrected_sentence: z.string().min(1, { message: "validation_error_corrected_sentence_empty" }),
  explanation: z
    .string()
    .min(1, { message: "validation_error_explanation_empty" })
    .max(500, { message: "validation_error_explanation_too_long" }),
  analysis_mode: z
    .string()
    .default("grammar_and_spelling")
    .refine((val): val is AnalysisMode => isValidAnalysisMode(val), {
      message: "validation_error_invalid_mode",
    }),
  analysis_language: z
    .string()
    .default("en")
    .refine((val): val is AnalysisLanguage => isValidAnalysisLanguage(val), {
      message: "validation_error_invalid_language",
    }),
  translation: z.string().nullable(),
});

/**
 * GET handler for retrieving paginated learning items.
 *
 * This endpoint returns a paginated list of the authenticated user's
 * learning items, sorted by creation date (newest first).
 *
 * @param context - Astro API context containing locals and request
 * @returns JSON response with paginated learning items or error
 *
 * @example
 * GET /api/learning-items?page=1&pageSize=20
 *
 * Response:
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalItems": 50,
 *     "totalPages": 3
 *   }
 * }
 */
export const GET: APIRoute = async ({ locals, url }) => {
  if (!isFeatureEnabled("learning-items")) {
    return createErrorResponse("feature_not_available", 404);
  }

  try {
    if (!locals.user) {
      return createErrorResponse("authentication_error_unauthorized", 401);
    }

    const rawParams = {
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    };

    const validationResult = queryParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const { page, pageSize } = validationResult.data;

    const result = await new LearningItemsService(locals.supabase).getLearningItems(locals.user.id, page, pageSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof LearningItemsDatabaseError) {
      return createErrorResponse("database_error", 500);
    }

    console.error("Unexpected error in GET /api/learning-items:", error);
    return createErrorResponse("unknown_error", 500);
  }
};

/**
 * POST handler for creating a new learning item.
 *
 * This endpoint allows users to create a new learning item
 * by providing the original sentence, corrected sentence, and explanation.
 *
 * @param context - Astro API context containing locals and request
 * @returns JSON response with the created learning item or error
 *
 * @example
 * POST /api/learning-items
 * Body:
 * {
 *   "original_sentence": "She have two cats.",
 *   "corrected_sentence": "She has two cats.",
 *   "explanation": "Use 'has' for the third-person singular present tense."
 * }
 *
 * Response (201):
 * {
 *   "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
 *   "user_id": "f1g2h3i4-j5k6-7890-1234-567890abcdef",
 *   "original_sentence": "She have two cats.",
 *   "corrected_sentence": "She has two cats.",
 *   "explanation": "Use 'has' for the third-person singular present tense.",
 *   "created_at": "2025-10-26T10:05:00Z"
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isFeatureEnabled("learning-items")) {
    return createErrorResponse("feature_not_available", 404);
  }

  try {
    if (!locals.user) {
      return createErrorResponse("authentication_error_unauthorized", 401);
    }

    const requestBody = await request.json();
    const validationResult = createLearningItemSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const result = await new LearningItemsService(locals.supabase).createLearningItem(
      validationResult.data,
      locals.user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof LearningItemsDatabaseError) {
      return createErrorResponse("database_error", 500);
    }

    console.error("Unexpected error in POST /api/learning-items:", error);
    return createErrorResponse("unknown_error", 500);
  }
};
