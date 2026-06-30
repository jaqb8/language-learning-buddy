import type { APIRoute } from "astro";
import { z } from "zod";
import { SettingsService, SettingsDatabaseError } from "@/lib/services/settings";
import { createErrorResponse, createValidationErrorResponse } from "@/lib/api-helpers";

export const prerender = false;

const updateSettingsSchema = z
  .object({
    pointsEnabled: z.boolean().optional(),
    contextEnabled: z.boolean().optional(),
  })
  .refine((data) => data.pointsEnabled !== undefined || data.contextEnabled !== undefined, {
    message: "validation_error_settings_empty",
  });

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return createErrorResponse("authentication_error_unauthorized", 401);
  }

  try {
    const settings = await new SettingsService(locals.supabase).getUserSettings();

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof SettingsDatabaseError) {
      return createErrorResponse("database_error", 500);
    }

    console.error("Unexpected error in GET /api/settings:", error);
    return createErrorResponse("unknown_error", 500);
  }
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  if (!locals.user) {
    return createErrorResponse("authentication_error_unauthorized", 401);
  }

  try {
    const requestBody = await request.json();
    const validationResult = updateSettingsSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error);
    }

    const settings = await new SettingsService(locals.supabase).updateSettings(validationResult.data);

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof SettingsDatabaseError) {
      return createErrorResponse("database_error", 500);
    }

    console.error("Unexpected error in PATCH /api/settings:", error);
    return createErrorResponse("unknown_error", 500);
  }
};
