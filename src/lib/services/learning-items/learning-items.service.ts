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

export class LearningItemsService {
  constructor(private readonly supabase: SupabaseClient) {}

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
      .select(
        "id, original_sentence, corrected_sentence, explanation, analysis_mode, analysis_language, created_at, translation"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Database error in getLearningItems:", error);
      throw new LearningItemsDatabaseError(error);
    }

    const learningItems: LearningItemDto[] = data ?? [];

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
    const insertData = {
      ...itemData,
      user_id: userId,
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

    return data;
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
}
