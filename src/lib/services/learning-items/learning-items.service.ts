import type { SupabaseClient } from "../../../db/supabase.client";
import type {
  CreateLearningItemCommand,
  LearningItem,
  LearningItemDto,
  PaginatedResponseDto,
  PaginationDto,
} from "../../../types";
import {
  LearningItemsDatabaseError,
  LearningItemNotFoundError,
  LearningItemForbiddenError,
} from "./learning-items.errors";
import type { Database } from "../../../db/database.types";
import {
  createSensitiveRecordId,
  learningItemAad,
  SensitiveDataDecryptionError,
  type SensitiveDataCrypto,
} from "@/lib/crypto/sensitive-data.crypto";
import { createSensitiveDataCrypto } from "@/lib/crypto/server-crypto";

type LearningItemRow = Database["public"]["Tables"]["learning_items"]["Row"];

interface LearningItemPayload {
  original_sentence: string;
  corrected_sentence: string;
  explanation: string;
  translation: string | null;
}

export class LearningItemsService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly sensitiveDataCrypto: SensitiveDataCrypto = createSensitiveDataCrypto()
  ) {}

  async getLearningItems(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResponseDto<LearningItemDto>> {
    const offset = (page - 1) * pageSize;

    const { count, error: countError } = await this.supabase
      .from("learning_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Database error in getLearningItems (count):", countError);
      throw new LearningItemsDatabaseError(countError);
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems === 0 || offset >= totalItems) {
      const pagination: PaginationDto = {
        page,
        pageSize,
        totalItems,
        totalPages,
      };

      return {
        data: [],
        pagination,
      };
    }

    const { data, error } = await this.supabase
      .from("learning_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Database error in getLearningItems:", error);
      throw new LearningItemsDatabaseError(error);
    }

    const learningItems = await Promise.all((data ?? []).map((row) => this.toLearningItem(row)));

    const pagination: PaginationDto = {
      page,
      pageSize,
      totalItems,
      totalPages,
    };

    return {
      data: learningItems,
      pagination,
    };
  }

  async createLearningItem(itemData: CreateLearningItemCommand, userId: string): Promise<LearningItem> {
    const id = createSensitiveRecordId();
    const encryptedPayload = await this.sensitiveDataCrypto.encryptJson(
      {
        original_sentence: itemData.original_sentence,
        corrected_sentence: itemData.corrected_sentence,
        explanation: itemData.explanation,
        translation: itemData.translation,
      } satisfies LearningItemPayload,
      learningItemAad(id, userId, itemData.analysis_mode, itemData.analysis_language)
    );

    const insertData = {
      id,
      user_id: userId,
      analysis_mode: itemData.analysis_mode,
      analysis_language: itemData.analysis_language,
      encrypted_payload: encryptedPayload,
    };

    const { data, error } = await this.supabase.from("learning_items").insert(insertData).select().single();

    if (error) {
      console.error("Database error in createLearningItem:", error);
      throw new LearningItemsDatabaseError(error);
    }

    if (!data) {
      console.error("No data returned from createLearningItem");
      throw new LearningItemsDatabaseError();
    }

    return this.toLearningItem(data);
  }

  async deleteLearningItem(id: string, userId: string): Promise<void> {
    const { data: existingItem, error: fetchError } = await this.supabase
      .from("learning_items")
      .select("user_id, analysis_mode")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new LearningItemNotFoundError();
      }
      console.error("Database error in deleteLearningItem (fetch):", fetchError);
      throw new LearningItemsDatabaseError(fetchError);
    }

    if (!existingItem) {
      throw new LearningItemNotFoundError();
    }

    if (existingItem.user_id !== userId) {
      throw new LearningItemForbiddenError();
    }

    const { error: deleteError } = await this.supabase.from("learning_items").delete().eq("id", id);

    if (deleteError) {
      console.error("Database error in deleteLearningItem (delete):", deleteError);
      throw new LearningItemsDatabaseError(deleteError);
    }
  }

  private async toLearningItem(row: LearningItemRow): Promise<LearningItem> {
    let payload: LearningItemPayload;

    if (row.encrypted_payload) {
      try {
        payload = await this.sensitiveDataCrypto.decryptJson<LearningItemPayload>(
          row.encrypted_payload,
          learningItemAad(row.id, row.user_id, row.analysis_mode, row.analysis_language)
        );
      } catch (error) {
        console.error("Failed to decrypt learning item:", row.id);
        throw new LearningItemsDatabaseError(
          error instanceof SensitiveDataDecryptionError ? error : new SensitiveDataDecryptionError()
        );
      }
    } else {
      if (row.original_sentence === null || row.corrected_sentence === null || row.explanation === null) {
        console.error("Learning item has neither encrypted nor complete legacy content:", row.id);
        throw new LearningItemsDatabaseError();
      }

      payload = {
        original_sentence: row.original_sentence,
        corrected_sentence: row.corrected_sentence,
        explanation: row.explanation,
        translation: row.translation,
      };
    }

    if (
      typeof payload.original_sentence !== "string" ||
      typeof payload.corrected_sentence !== "string" ||
      typeof payload.explanation !== "string" ||
      (payload.translation !== null && typeof payload.translation !== "string")
    ) {
      console.error("Learning item decrypted to an invalid payload:", row.id);
      throw new LearningItemsDatabaseError();
    }

    return {
      id: row.id,
      user_id: row.user_id,
      original_sentence: payload.original_sentence,
      corrected_sentence: payload.corrected_sentence,
      explanation: payload.explanation,
      analysis_mode: row.analysis_mode,
      analysis_language: row.analysis_language,
      translation: payload.translation,
      created_at: row.created_at,
    };
  }
}
